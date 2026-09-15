import React, { createContext, useContext, useState, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import api, { authApi } from '../services/api';
import { auth, signOut as firebaseSignOut } from '../services/firebase';
import { setAdminPhoneNumber } from '../services/photoShare';
import { User } from '../types';

// Ensure any in-progress auth sessions are completed on web/custom tab redirect
WebBrowser.maybeCompleteAuthSession();

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
    address_line1?: string;
    address_line2?: string;
    street_address?: string;
    street?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
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
  const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState<boolean>(false);

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

          if ((mergedUser.role === 'ADMIN' || mergedUser.email?.toLowerCase().includes('admin')) && mergedUser.phone) {
            setAdminPhoneNumber(mergedUser.phone);
          }

          return mergedUser;
        }
      }
    } catch (e) {
      console.error('Error fetching user profile in AuthContext:', e);
    }
    if ((initialUser.role === 'ADMIN' || initialUser.email?.toLowerCase().includes('admin')) && initialUser.phone) {
      setAdminPhoneNumber(initialUser.phone);
    }
    return initialUser;
  };

  const checkLoggedIn = async () => {
    try {
      let storedToken = await AsyncStorage.getItem('userToken');
      if (!storedToken) {
        try {
          storedToken = await SecureStore.getItemAsync('userToken');
          if (storedToken) {
            await AsyncStorage.setItem('userToken', storedToken);
          }
        } catch (secErr) {}
      }
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

  const processCodeExchange = async (code: string): Promise<boolean> => {
    try {
      // 1. Immediately wipe previous authentication and user state in memory & storage
      setUser(null);
      setUserToken(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('user_saved_address');
      try {
        await SecureStore.deleteItemAsync('userToken');
      } catch (secErr) {}

      // 2. Call backend token exchange endpoint: POST /auth/mobile/exchange
      const res = await authApi.exchangeMobileAuthCode(code);
      const data = res.data;

      if (!data || !data.access_token) {
        throw new Error('Invalid response from token exchange server.');
      }

      const token = data.access_token;
      const returnedUser = data.user;

      if (!returnedUser) {
        throw new Error('No user data returned from authentication exchange.');
      }

      // 3. Save access_token securely
      await AsyncStorage.setItem('userToken', token);
      try {
        await SecureStore.setItemAsync('userToken', token);
      } catch (secErr) {}

      // 4. Construct user profile and merge details
      const initialUser: User = {
        id: returnedUser.id || Date.now(),
        email: returnedUser.email || '',
        full_name: returnedUser.full_name || returnedUser.name || 'Google User',
        phone: returnedUser.phone || '',
        role: returnedUser.role || 'CUSTOMER',
        photo_url: returnedUser.photo_url || '',
        street_address: returnedUser.street_address || '',
        street: returnedUser.street_address || '',
        city: returnedUser.city || '',
        state: returnedUser.state || '',
        pincode: returnedUser.pincode || '',
        company_name: returnedUser.company_name || '',
        gstin: returnedUser.gstin || '',
        is_active: returnedUser.is_active ?? true,
        ...returnedUser,
      };

      const fullUser = await fetchAndMergeUserDetails(initialUser);
      setUserToken(token);
      setUser(fullUser);
      await AsyncStorage.setItem('userData', JSON.stringify(fullUser));

      return true;
    } catch (err: any) {
      console.error('Token exchange error:', err?.response?.data || err?.message);
      throw new Error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Unable to sign in. Please try again.'
      );
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    if (isGoogleAuthInProgress) {
      console.log('Google Sign-In already in progress');
      return false;
    }
    setIsGoogleAuthInProgress(true);

    let deepLinkSubscription: any = null;
    let isProcessed = false;

    try {
      const redirectUri = 'saibalaji://auth/callback';
      const authUrl = `https://www.saibalajisilverworkspvtltd.com/mobile-auth?redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Helper to validate deep link URI and process code
      const parseAndProcessUrl = async (urlStr: string): Promise<boolean> => {
        if (isProcessed || !urlStr) return false;

        if (
          urlStr.startsWith('saibalaji://auth/callback') ||
          urlStr.startsWith('saibalajisilverworks://auth/callback')
        ) {
          isProcessed = true;
          const queryIndex = urlStr.indexOf('?');
          if (queryIndex !== -1) {
            const queryString = urlStr.substring(queryIndex + 1);
            const searchParams = new URLSearchParams(queryString);
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
              if (error.toLowerCase().includes('cancel')) {
                return false;
              }
              throw new Error('Google sign-in was cancelled or failed.');
            }

            if (code && code.trim().length > 0) {
              return await processCodeExchange(code.trim());
            }
          }
          throw new Error('Unable to sign in. Please try again.');
        }
        return false;
      };

      // Set up deep link listener for incoming Android intent
      const deepLinkPromise = new Promise<boolean>((resolve, reject) => {
        deepLinkSubscription = Linking.addEventListener('url', async (event) => {
          try {
            const success = await parseAndProcessUrl(event.url);
            resolve(success);
          } catch (e) {
            reject(e);
          }
        });
      });

      // Launch Chrome Custom Tab / WebBrowser
      const browserPromise = (async (): Promise<boolean> => {
        try {
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
          if (result.type === 'success' && result.url) {
            return await parseAndProcessUrl(result.url);
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            console.log('Google Sign-In was cancelled by user');
            return false;
          }
        } catch (browserError) {
          console.warn('Custom Tabs unavailable, falling back to system browser:', browserError);
          try {
            await Linking.openURL(authUrl);
          } catch (openErr) {
            throw new Error('Unable to open browser for Google Sign-In.');
          }
        }
        return false;
      })();

      const result = await Promise.race([browserPromise, deepLinkPromise]);
      return result;
    } catch (error: any) {
      console.error('Login with Google error:', error?.message);
      if (error?.message?.includes('cancelled')) {
        return false;
      }
      throw new Error(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      if (deepLinkSubscription && typeof deepLinkSubscription.remove === 'function') {
        deepLinkSubscription.remove();
      }
      setIsGoogleAuthInProgress(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name?: string;
    gstin?: string;
    address_line1?: string;
    address_line2?: string;
    street_address?: string;
    street?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  }): Promise<boolean> => {
    try {
      const streetCombined =
        payload.street_address ||
        (payload.address_line1
          ? payload.address_line2
            ? `${payload.address_line1.trim()}, ${payload.address_line2.trim()}`
            : payload.address_line1.trim()
          : payload.street || payload.address || '');

      const formattedAddress = [
        streetCombined,
        payload.city,
        payload.state ? `${payload.state}${payload.pincode ? ` - ${payload.pincode}` : ''}` : payload.pincode,
        payload.country,
      ]
        .filter(Boolean)
        .join('\n');

      const fullPayload = {
        ...payload,
        name: payload.full_name,
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone || '',
        company_name: payload.company_name || '',
        gstin: payload.gstin || '',
        street_address: streetCombined,
        street: streetCombined,
        address_line1: payload.address_line1 || '',
        address_line2: payload.address_line2 || '',
        address: formattedAddress,
        city: payload.city || '',
        state: payload.state || '',
        pincode: payload.pincode || '',
        country: payload.country || 'India',
      };

      const res = await authApi.register(fullPayload).catch(() => api.post('/auth/register', fullPayload));
      const token = res.data.access_token || res.data.token;
      const registeredUser = res.data.user || res.data.profile;
      if (token) {
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
        const fullUser = await fetchAndMergeUserDetails(
          registeredUser ||
            ({
              ...fullPayload,
              id: Date.now(),
              role: 'CUSTOMER',
              is_active: true,
            } as User)
        );
        setUser(fullUser);
        await AsyncStorage.setItem('userData', JSON.stringify(fullUser));

        const addressData = {
          fullName: fullPayload.full_name,
          phone: fullPayload.phone,
          street: streetCombined,
          city: fullPayload.city,
          state: fullPayload.state,
          pincode: fullPayload.pincode,
        };
        await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));

        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Registration error:', error?.response?.data || error.message);
      if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error.response) {
        const streetCombined =
          payload.street_address ||
          (payload.address_line1
            ? payload.address_line2
              ? `${payload.address_line1.trim()}, ${payload.address_line2.trim()}`
              : payload.address_line1.trim()
            : payload.street || payload.address || '');

        const localToken = `sbs_local_token_${Date.now()}`;
        const localUser: User = {
          id: Date.now(),
          email: payload.email.trim(),
          full_name: payload.full_name,
          phone: payload.phone || '',
          company_name: payload.company_name || '',
          gstin: payload.gstin || '',
          street_address: streetCombined,
          street: streetCombined,
          address_line1: payload.address_line1 || '',
          address_line2: payload.address_line2 || '',
          city: payload.city || '',
          state: payload.state || '',
          pincode: payload.pincode || '',
          country: payload.country || 'India',
          role: 'CUSTOMER',
          is_active: true,
        };
        setUserToken(localToken);
        setUser(localUser);
        await AsyncStorage.setItem('userToken', localToken);
        await AsyncStorage.setItem('userData', JSON.stringify(localUser));

        const addressData = {
          fullName: localUser.full_name,
          phone: localUser.phone || '',
          street: streetCombined,
          city: localUser.city || '',
          state: localUser.state || '',
          pincode: localUser.pincode || '',
        };
        await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));

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
    if ((updatedUser.role === 'ADMIN' || updatedUser.email?.toLowerCase().includes('admin')) && updatedUser.phone) {
      setAdminPhoneNumber(updatedUser.phone);
    }
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
    setUser(null);
    setUserToken(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('user_saved_address');
    try {
      await SecureStore.deleteItemAsync('userToken');
    } catch (e) {}
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.log('Firebase auth signOut error on logout:', e);
    }
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
