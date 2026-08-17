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

  const checkLoggedIn = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken && storedUser) {
        setUserToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Refresh profile from server silently
        try {
          const res = await api.get('/auth/me');
          if (res.data) {
            setUser(res.data);
            await AsyncStorage.setItem('userData', JSON.stringify(res.data));
          }
        } catch (e) {
          // Token expired or server unreachable
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
        setUser(loggedUser);
        await AsyncStorage.setItem('userToken', access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(loggedUser));
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
        setUser(registeredUser);
        await AsyncStorage.setItem('userToken', access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(registeredUser));
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
