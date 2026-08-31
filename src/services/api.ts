import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  return 'https://saibalajisilverworkspvtltd.com/api/v1';
};

export const API_BASE_URL = getBaseURL();

export const getFullImageUrl = (url?: string): string => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=400';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return encodeURI(url);
  }
  const hostBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return encodeURI(`${hostBase}${cleanPath}`);
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 530) {
      console.warn('API returned HTTP 530 (Tunnel/Proxy error). Check backend connection on port 8000 or 5173.');
    }
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION API ---
export const authApi = {
  register: async (payload: { name: string; email: string; password: string; full_name?: string; phone?: string; company_name?: string; gstin?: string }) => {
    const body = {
      ...payload,
      name: payload.name || payload.full_name || '',
    };
    try {
      return await api.post('/auth/register', body);
    } catch (e: any) {
      if (e?.message === 'Network Error' || !e.response) {
        const fallbackUrls = [
          'https://saibalajisilverworkspvtltd.com/api/v1/auth/register',
          'http://localhost:8000/api/v1/auth/register',
          'http://localhost:5173/api/v1/auth/register',
          'http://10.0.2.2:8000/api/v1/auth/register',
        ];
        for (const url of fallbackUrls) {
          try {
            const res = await axios.post(url, body, { timeout: 3000 });
            if (res && res.data) return res;
          } catch (err) {}
        }
      }
      throw e;
    }
  },
  login: async (payload: { email: string; password: string }) => {
    try {
      return await api.post('/auth/login', payload);
    } catch (e: any) {
      if (e?.message === 'Network Error' || !e.response) {
        const fallbackUrls = [
          'https://saibalajisilverworkspvtltd.com/api/v1/auth/login',
          'http://localhost:8000/api/v1/auth/login',
          'http://localhost:5173/api/v1/auth/login',
          'http://10.0.2.2:8000/api/v1/auth/login',
        ];
        for (const url of fallbackUrls) {
          try {
            const res = await axios.post(url, payload, { timeout: 3000 });
            if (res && res.data) return res;
          } catch (err) {}
        }
      }
      throw e;
    }
  },
  googleAuth: (payload: { idToken: string }) =>
    api.post('/auth/google', {
      idToken: payload.idToken,
      id_token: payload.idToken,
      firebase_token: payload.idToken,
    }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: any) => api.put('/auth/me', data),
};

// --- LIVE SILVER RATE API ---
export const silverRateApi = {
  getLiveRate: () => api.get('/silver-rate'),
  subscribeStream: (onData: (data: any) => void, onError?: (err: any) => void) => {
    let isCancelled = false;
    let pollInterval: any = null;

    if (typeof EventSource !== 'undefined') {
      try {
        const streamUrl = `${API_BASE_URL}/silver-rate/stream`;
        const es = new EventSource(streamUrl);
        es.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const parsed = JSON.parse(event.data);
            onData(parsed);
          } catch (e) {
            onData(event.data);
          }
        };
        es.onerror = (err) => {
          if (isCancelled) return;
          if (onError) onError(err);
        };
        return () => {
          isCancelled = true;
          es.close();
        };
      } catch (e) {
        console.log('EventSource initialization failed, using polling fallback');
      }
    }

    const fetchRate = async () => {
      if (isCancelled) return;
      try {
        const res = await api.get('/silver-rate');
        if (res.data && !isCancelled) {
          onData(res.data);
        }
      } catch (e) {
        if (onError && !isCancelled) onError(e);
      }
    };

    fetchRate();
    pollInterval = setInterval(fetchRate, 1000);

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  },
};

// --- CATALOG & CATEGORIES API ---
export const catalogApi = {
  getCategories: () => api.get('/categories'),
  getProducts: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/products', { params }),
  getProductDetail: (idOrSlug: string | number) =>
    api.get(`/products/${idOrSlug}`),
};

// --- WISHLIST API ---
export const wishlistApi = {
  getWishlist: () => api.get('/wishlist').catch(() => ({ data: [] })),
  toggleWishlist: (productId: number) => api.post('/wishlist/toggle', { product_id: productId }).catch(() => ({ data: {} })),
  syncWishlist: (productIds: number[]) => api.post('/wishlist/sync', { product_ids: productIds }).catch(() => ({ data: {} })),
};

// --- ORDERS & CHECKOUT API ---
export const orderApi = {
  createOrder: (orderData: {
    items: any[];
    shipping_address: string;
    payment_method?: string;
    total_amount?: number;
    grand_total?: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    user_id?: number;
  }) => api.post('/orders', orderData),
  getMyOrders: async (params?: any) => {
    try {
      const res = await api.get('/orders/my-orders', { params });
      if (res && res.data && (Array.isArray(res.data) ? res.data.length > 0 : Object.keys(res.data).length > 0)) {
        return res;
      }
    } catch (e) {}

    try {
      const res = await api.get('/orders', { params });
      if (res && res.data && (Array.isArray(res.data) ? res.data.length > 0 : Object.keys(res.data).length > 0)) {
        return res;
      }
    } catch (e) {}

    const baseHost = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const fallbackUrls = [
      `${baseHost}/api/v1/orders/my-orders`,
      `${baseHost}/api/v1/orders`,
    ];

    for (const url of fallbackUrls) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await axios.get(url, { headers, params, timeout: 3000 });
        if (res && res.data && (Array.isArray(res.data) ? res.data.length > 0 : Object.keys(res.data).length > 0)) {
          return res;
        }
      } catch (err) {}
    }

    return { data: [] };
  },
};

// --- WHOLESALE & B2B QUOTATIONS API ---
export const wholesaleApi = {
  submitRequest: (data: {
    company_name: string;
    gst_number?: string;
    gstin?: string;
    products?: any;
    requirements?: string;
    note?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    items?: any[];
    user_id?: number;
  }) =>
    api.post('/wholesale/requests', data).catch(() => api.post('/wholesale/quote', data)),
  getMyRequests: async (params?: any) => {
    try {
      const res = await api.get('/wholesale/my-requests', { params });
      if (res && res.data) {
        return res;
      }
    } catch (e) {}

    try {
      const res = await api.get('/wholesale/requests', { params });
      if (res && res.data) {
        return res;
      }
    } catch (e) {}

    const baseHost = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const fallbackUrls = [
      `${baseHost}/api/v1/wholesale/my-requests`,
      `${baseHost}/api/v1/wholesale/requests`,
    ];

    for (const url of fallbackUrls) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await axios.get(url, { headers, params, timeout: 3000 });
        if (res && res.data) {
          return res;
        }
      } catch (err) {}
    }

    return { data: [] };
  },
  getPdfUrl: (id: string | number) => `${API_BASE_URL}/quotations/${id}/pdf`,
};

export default api;
