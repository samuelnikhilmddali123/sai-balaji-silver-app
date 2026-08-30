import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { wishlistApi } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const { user, userToken } = useAuth();

  // Load guest local wishlist on mount
  useEffect(() => {
    AsyncStorage.getItem('wishlistItems').then((data) => {
      if (data) {
        try {
          setWishlist(JSON.parse(data));
        } catch (e) {}
      }
    });
  }, []);

  // Sync guest wishlist on login and fetch server wishlist
  useEffect(() => {
    const syncAndFetchWishlist = async () => {
      // 0. Always load saved local items first
      const localData = await AsyncStorage.getItem('wishlistItems');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed && Array.isArray(parsed)) {
            setWishlist(parsed);
          }
        } catch (e) {}
      }

      if (userToken) {
        try {
          // 1. Sync guest wishlist if any exists locally
          if (localData) {
            const localProducts: Product[] = JSON.parse(localData);
            if (localProducts.length > 0) {
              const productIds = localProducts.map((p) => p.id);
              await wishlistApi.syncWishlist(productIds);
            }
          }

          // 2. Fetch server wishlist
          const res = await wishlistApi.getWishlist();
          if (res && res.data) {
            const items = Array.isArray(res.data) ? res.data : (res.data.items || res.data.products || []);
            if (Array.isArray(items) && items.length > 0) {
              setWishlist(items);
              await AsyncStorage.setItem('wishlistItems', JSON.stringify(items));
            }
          }
        } catch (e) {
          // Silent fallback on network error; local state remains active
        }
      }
    };

    syncAndFetchWishlist();
  }, [userToken]);

  const refreshWishlist = async () => {
    if (userToken) {
      try {
        const res = await wishlistApi.getWishlist();
        if (res && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data.items || res.data.products || []);
          if (Array.isArray(items) && items.length > 0) {
            setWishlist(items);
            await AsyncStorage.setItem('wishlistItems', JSON.stringify(items));
          }
        }
      } catch (e) {
        // Fallback silently
      }
    }
  };

  const toggleWishlist = async (product: Product) => {
    const exists = wishlist.some((p) => p.id === product.id);
    let updated: Product[];
    if (exists) {
      updated = wishlist.filter((p) => p.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    setWishlist(updated);
    await AsyncStorage.setItem('wishlistItems', JSON.stringify(updated));

    // Call backend API if user is logged in
    if (userToken) {
      try {
        await wishlistApi.toggleWishlist(product.id);
      } catch (e) {
        // Fallback silently on network error
      }
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((p) => p.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
