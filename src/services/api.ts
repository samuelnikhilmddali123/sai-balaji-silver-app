import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return 'https://score-bills-med-gibson.trycloudflare.com/api/v1';
};

export const API_BASE_URL = getBaseURL();

export const getFullImageUrl = (url?: string): string => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=400';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const hostBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${hostBase}${cleanPath}`;
};

export const getProductImageUrl = (item: any): string => {
  if (!item) return getFullImageUrl();
  const rawUrl = item.featured_image || (item.images && item.images[0]) || item.image_url;
  return getFullImageUrl(rawUrl);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from storage:', error);
  }
  return config;
});

export default api;
