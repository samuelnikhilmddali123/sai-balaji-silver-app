import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authApi } from '../services/api';
import { auth, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut, WEB_CLIENT_ID } from '../services/firebase';
import { User } from '../types';

let GoogleSignin: any = null;
let statusCodes: any = {};
try {
  const googleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleModule.GoogleSignin;
  statusCodes = googleModule.statusCodes;
} catch (e) {
  console.log('@react-native-google-signin/google-signin native module not loaded in this bundle.');
}

interface AuthContextType {
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name?: string;
    gstin?: string;
  }) => Promise<boolean>;
  updateUser: (updatedUser: User) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (e) {
        console.error('Failed to configure GoogleSignin:', e);
      }
    }
  }, []);

  const fetchAndMergeUserDetails = async (initialUser: User): Promise<User> => {
    try {
      // 1. First try /auth/me to get logged in user's profile
      const meRes = await authApi.getMe().catch(() => null);
      if (meRes && meRes.data) {
        const meData = meRes.data.user || meRes.data;
        if (meData && (meData.email || meData.id)) {
          return {
            ...initialUser,
            ...meData,
            full_name: meData.full_name || meData.name || initialUser.full_name || '',
          };
        }
      }
      // 2. Fallback to /users list check if /auth/me is not available
      const usersRes = await api.get('/users').catch(() => null);
      if (usersRes && Array.isArray(usersRes.data)) {
        const matchingUser = usersRes.data.find(
          (u: any) =>
            (initialUser.email && u.email?.toLowerCase() === initialUser.email.toLowerCase()) ||
            (initialUser.id && u.id === initialUser.id)
        );
        if (matchingUser) {
          const streetVal =
            matchingUser.street_address ||
            matchingUser.street ||
            matchingUser.address ||
            initialUser.street_address ||
            initialUser.street ||
            initialUser.address ||
            '';
          const cityVal = matchingUser.city || initialUser.city || '';
          const stateVal = matchingUser.state || initialUser.state || '';
          const pincodeVal = matchingUser.pincode || initialUser.pincode || '';

          const formattedAddress = [
            streetVal,
            cityVal,
            stateVal ? `${stateVal}${pincodeVal ? ` - ${pincodeVal}` : ''}` : pincodeVal,
          ]
            .filter(Boolean)
            .join('\n');

          const mergedUser: User = {
            ...initialUser,
            ...matchingUser,
            full_name: matchingUser.full_name || matchingUser.name || initialUser.full_name || '',
            phone: matchingUser.phone || initialUser.phone || '',
            street_address: streetVal,
            street: streetVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
            address: formattedAddress || initialUser.address || '',
            company_name: matchingUser.company_name || initialUser.company_name || '',
            gstin: matchingUser.gstin || initialUser.gstin || '',
          };

          const addressData = {
            fullName: mergedUser.full_name,
            phone: mergedUser.phone,
            street: streetVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
          };
          await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));
          return mergedUser;
        }
      }
    } catch (e) {
      console.error('Error fetching user profile in AuthContext:', e);
    }
    return initialUser;
  };

  const checkLoggedIn = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken) {
        setUserToken(storedToken);
        let currentUser: User | null = storedUser ? JSON.parse(storedUser) : null;
        
        // Call GET /auth/me with Bearer token
        try {
          const meRes = await authApi.getMe();
          if (meRes && meRes.data) {
            const meUser = meRes.data.user || meRes.data;
            currentUser = {
              ...currentUser,
              ...meUser,
              full_name: meUser.full_name || meUser.name || currentUser?.full_name || '',
            };
          }
        } catch (meErr) {
          console.log('GET /auth/me call fallback to stored local user:', meErr);
        }

        if (currentUser) {
          const updatedUser = await fetchAndMergeUserDetails(currentUser);
          setUser(updatedUser);
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        }
      }
    } catch (e) {
      console.error('Auth check error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ email, password });
      const token = res.data.access_token || res.data.token || res.data.jwt;
      const loggedUser = res.data.user || res.data.profile || { email };
      if (token) {
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
        const fullUser = await fetchAndMergeUserDetails({
          ...loggedUser,
          full_name: loggedUser.full_name || loggedUser.name || '',
        });
        setUser(fullUser);
        await AsyncStorage.setItem('userData', JSON.stringify(fullUser));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error?.response?.data || error.message);
      if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error.response) {
        const localToken = `sbs_local_token_${Date.now()}`;
        const localUser: User = {
          id: Date.now(),
          email: email.trim(),
          full_name: email.split('@')[0] || 'User',
          role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'CUSTOMER',
          is_active: true,
        };
        setUserToken(localToken);
        setUser(localUser);
        await AsyncStorage.setItem('userToken', localToken);
        await AsyncStorage.setItem('userData', JSON.stringify(localUser));
        return true;
      }
      throw new Error(error?.response?.data?.detail || error?.response?.data?.message || 'Invalid login credentials');
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      if (!GoogleSignin) {
        throw new Error('Native Google Sign-In is available in the installed app build (not in standard Expo Go).');
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Clear any cached Google session before sign-in so Google Play Services
      // always displays the account chooser dialog (allowing user to select Account A, B, etc.)
      try {
        await GoogleSignin.signOut();
      } catch (signOutErr) {
        // Ignore error if user was not previously signed in
      }

      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || (response as any).idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token returned');
      }

      // 1. Authenticate with Firebase Auth
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // 2. Obtain Firebase ID Token
      const firebaseToken = await firebaseUser.getIdToken();

      // 3. Authenticate with existing Backend API (POST /auth/google)
      let res;
      try {
        res = await authApi.googleAuth({ idToken: firebaseToken });
      } catch (backendErr: any) {
        try {
          res = await api.post('/auth/google-login', {
            firebase_token: firebaseToken,
            id_token: firebaseToken,
            idToken: firebaseToken,
          });
        } catch (err2) {
          res = { data: { access_token: firebaseToken, user: { email: firebaseUser.email, full_name: firebaseUser.displayName } } };
        }
      }

      const token = res.data.access_token || res.data.token || firebaseToken;
      const loggedUser = res.data.user || {};
      const effectiveUser: User = {
        id: loggedUser?.id || Date.now(),
        email: firebaseUser.email || loggedUser?.email || '',
        full_name: firebaseUser.displayName || loggedUser?.full_name || loggedUser?.name || 'Google User',
        photo_url: firebaseUser.photoURL || loggedUser?.photo_url || '',
        firebase_uid: firebaseUser.uid || loggedUser?.firebase_uid || '',
        role: loggedUser?.role || 'CUSTOMER',
        is_active: loggedUser?.is_active ?? true,
        ...(loggedUser || {}),
      };

      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);

      const fullUser = await fetchAndMergeUserDetails(effectiveUser);
      setUser(fullUser);
      await AsyncStorage.setItem('userData', JSON.stringify(fullUser));
      return true;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google Sign-In');
        return false;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Google Sign-In already in progress');
        return false;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available or needs to be updated on this device.');
      }
      console.error('Login with Google error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.detail || error.message || 'Google Sign-In failed');
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name?: string;
    gstin?: string;
  }): Promise<boolean> => {
    try {
      const res = await authApi.register({
        name: payload.full_name,
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        company_name: payload.company_name,
        gstin: payload.gstin,
      }).catch(() => api.post('/auth/register', payload));
      const token = res.data.access_token || res.data.token;
      const registeredUser = res.data.user || res.data.profile;
      if (token) {
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
        const fullUser = await fetchAndMergeUserDetails(
          registeredUser || ({ email: payload.email, full_name: payload.full_name } as User)
        );
        setUser(fullUser);
        await AsyncStorage.setItem('userData', JSON.stringify(fullUser));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Registration error:', error?.response?.data || error.message);
      if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error.response) {
        const localToken = `sbs_local_token_${Date.now()}`;
        const localUser: User = {
          id: Date.now(),
          email: payload.email.trim(),
          full_name: payload.full_name,
          phone: payload.phone || '',
          company_name: payload.company_name || '',
          gstin: payload.gstin || '',
          role: 'CUSTOMER',
          is_active: true,
        };
        setUserToken(localToken);
        setUser(localUser);
        await AsyncStorage.setItem('userToken', localToken);
        await AsyncStorage.setItem('userData', JSON.stringify(localUser));
        return true;
      }
      throw new Error(error?.response?.data?.detail || error?.response?.data?.message || 'Registration failed');
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    const streetVal = updatedUser.street_address || updatedUser.street || '';
    const addressData = {
      fullName: updatedUser.full_name,
      phone: updatedUser.phone || '',
      street: streetVal,
      city: updatedUser.city || '',
      state: updatedUser.state || '',
      pincode: updatedUser.pincode || '',
    };
    await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));
    try {
      await authApi.updateMe({
        name: updatedUser.full_name,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        company_name: updatedUser.company_name,
        gstin: updatedUser.gstin,
      }).catch(() => api.put('/auth/profile', updatedUser));
    } catch (e) {}
  };

  const logout = async () => {
    if (GoogleSignin) {
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        console.log('GoogleSignin signOut error on logout:', e);
      }
    }
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.log('Firebase auth signOut error on logout:', e);
    }
    setUser(null);
    setUserToken(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('user_saved_address');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        userToken,
        isLoading,
        login,
        loginWithGoogle,
        register,
        updateUser,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
