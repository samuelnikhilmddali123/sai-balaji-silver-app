import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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

  const fetchAndMergeUserDetails = async (initialUser: User): Promise<User> => {
    try {
      const usersRes = await api.get('/users');
      if (Array.isArray(usersRes.data)) {
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
            full_name: matchingUser.full_name || initialUser.full_name || '',
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
      console.error('Error fetching /users endpoint in AuthContext:', e);
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
        if (currentUser) {
          setUser(currentUser);
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
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedUser } = res.data;
      if (access_token) {
        setUserToken(access_token);
        await AsyncStorage.setItem('userToken', access_token);
        const fullUser = await fetchAndMergeUserDetails(loggedUser || ({ email } as User));
        setUser(fullUser);
        await AsyncStorage.setItem('userData', JSON.stringify(fullUser));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.detail || 'Invalid login credentials');
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
      const res = await api.post('/auth/register', payload);
      const { access_token, user: registeredUser } = res.data;
      if (access_token) {
        setUserToken(access_token);
        await AsyncStorage.setItem('userToken', access_token);
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
      throw new Error(error?.response?.data?.detail || 'Registration failed');
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
      await api.put('/auth/profile', updatedUser);
    } catch (e) {}
  };

  const logout = async () => {
    setUser(null);
    setUserToken(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('user_saved_address');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, userToken, isLoading, login, register, updateUser, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
