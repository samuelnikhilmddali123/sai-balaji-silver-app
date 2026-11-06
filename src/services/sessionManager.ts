import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const TOKEN_KEY = 'userToken';
const USER_KEY = 'userData';
const ADDRESS_KEY = 'user_saved_address';

// In-memory cache for synchronous fast access
let cachedToken: string | null = null;
let cachedUser: User | null = null;

const safeSecureSet = async (key: string, value: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    // EncryptedSharedPreferences or KeyStore may fail on certain devices or if value exceeds 2048 bytes
    return false;
  }
};

const safeSecureGet = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    return null;
  }
};

const safeSecureDelete = async (key: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    return false;
  }
};

const safeAsyncSet = async (key: string, value: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[SessionManager] AsyncStorage set error for ${key}:`, error);
    return false;
  }
};

const safeAsyncGet = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`[SessionManager] AsyncStorage get error for ${key}:`, error);
    return null;
  }
};

const safeAsyncDelete = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

export interface StoredSession {
  token: string | null;
  user: User | null;
}

export const sessionManager = {
  /**
   * Persists authentication token and user information across both SecureStore and AsyncStorage.
   * Ensures process-death durability on Android.
   */
  saveSession: async (token: string, user: User): Promise<void> => {
    cachedToken = token;
    cachedUser = user;

    const userJson = JSON.stringify(user);

    // Save token to SecureStore (primary secure store) and AsyncStorage (interceptor & fallback)
    await Promise.all([
      safeSecureSet(TOKEN_KEY, token),
      safeAsyncSet(TOKEN_KEY, token),
      safeAsyncSet(USER_KEY, userJson),
      // User info may exceed 2048 bytes limit in SecureStore on some devices, so safeSecureSet catches silently
      safeSecureSet(USER_KEY, userJson),
    ]);
  },

  /**
   * Reads the current persisted session on application startup or cold start.
   * Checks SecureStore first, then AsyncStorage fallback, and cross-synchronizes.
   */
  getSession: async (): Promise<StoredSession> => {
    // 1. Retrieve access token
    let token = await safeSecureGet(TOKEN_KEY);
    if (!token) {
      token = await safeAsyncGet(TOKEN_KEY);
      if (token) {
        // Sync back to SecureStore
        await safeSecureSet(TOKEN_KEY, token);
      }
    } else {
      // Sync back to AsyncStorage
      await safeAsyncSet(TOKEN_KEY, token);
    }

    // 2. Retrieve user data
    let userJson = await safeAsyncGet(USER_KEY);
    if (!userJson) {
      userJson = await safeSecureGet(USER_KEY);
      if (userJson) {
        await safeAsyncSet(USER_KEY, userJson);
      }
    }

    let user: User | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch (parseErr) {
        console.warn('[SessionManager] Corrupted user data in storage, wiping invalid entry');
        await safeAsyncDelete(USER_KEY);
        await safeSecureDelete(USER_KEY);
      }
    }

    cachedToken = token;
    cachedUser = user;

    return { token, user };
  },

  /**
   * Fast retrieval of the current token for API request interceptors.
   */
  getToken: async (): Promise<string | null> => {
    if (cachedToken) {
      return cachedToken;
    }
    const token = (await safeSecureGet(TOKEN_KEY)) || (await safeAsyncGet(TOKEN_KEY));
    if (token) {
      cachedToken = token;
    }
    return token;
  },

  /**
   * Fast synchronous retrieval of cached token if available.
   */
  getCachedToken: (): string | null => {
    return cachedToken;
  },

  /**
   * Fast synchronous retrieval of cached user if available.
   */
  getCachedUser: (): User | null => {
    return cachedUser;
  },

  /**
   * Updates the persisted user information without modifying the access token.
   */
  updateUser: async (user: User): Promise<void> => {
    cachedUser = user;
    const userJson = JSON.stringify(user);
    await Promise.all([
      safeAsyncSet(USER_KEY, userJson),
      safeSecureSet(USER_KEY, userJson),
    ]);
  },

  /**
   * Completely and securely clears all session information from storage.
   */
  clearSession: async (): Promise<void> => {
    cachedToken = null;
    cachedUser = null;

    await Promise.all([
      safeSecureDelete(TOKEN_KEY),
      safeAsyncDelete(TOKEN_KEY),
      safeSecureDelete(USER_KEY),
      safeAsyncDelete(USER_KEY),
      safeAsyncDelete(ADDRESS_KEY),
    ]);
  },
};

export default sessionManager;
