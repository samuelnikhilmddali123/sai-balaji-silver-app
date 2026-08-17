import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, EffectiveCartItem, CartType } from '../types';

export const WHOLESALE_MOQ = 5; // Minimum Order Quantity for Wholesale pricing

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[]; // Alias for backward compatibility
  effectiveCartItems: EffectiveCartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalItemsCount: number; // Alias for backward compatibility
  cartType: CartType;
  isWholesale: boolean;
  WHOLESALE_MOQ: number;
  itemsToWholesale: number;
  subtotal: number;
  savings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load persisted cart on app startup
  useEffect(() => {
    AsyncStorage.getItem('app_cart').then((data) => {
      if (data) {
        try {
          setCart(JSON.parse(data));
        } catch (e) {
          console.error('Failed to parse cart storage', e);
        }
      }
    });
  }, []);

  // Save cart changes to AsyncStorage
  const saveCart = async (items: CartItem[]) => {
    setCart(items);
    await AsyncStorage.setItem('app_cart', JSON.stringify(items));
  };

  // Total Item Count across all products in cart
  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Automatically determine Cart Type based on MOQ threshold (5 items)
  const cartType: CartType = useMemo(() => {
    return totalQuantity >= WHOLESALE_MOQ ? 'WHOLESALE' : 'RETAIL';
  }, [totalQuantity]);

  const isWholesale = cartType === 'WHOLESALE';
  const itemsToWholesale = Math.max(0, WHOLESALE_MOQ - totalQuantity);

  // Price Calculation Helper
  const getItemEffectivePrice = (product: Product, mode: CartType): number => {
    if (mode === 'WHOLESALE' && product.wholesale_price && product.wholesale_price > 0) {
      return product.wholesale_price;
    }
    return product.retail_price;
  };

  // Compute Effective Cart Items
  const effectiveCartItems: EffectiveCartItem[] = useMemo(() => {
    return cart.map((item) => {
      const hasWholesalePrice = Boolean(
        item.product.wholesale_price && item.product.wholesale_price > 0
      );
      const effectivePrice = getItemEffectivePrice(item.product, cartType);
      const itemSubtotal = effectivePrice * item.quantity;
      return {
        ...item,
        effectivePrice,
        hasWholesalePrice,
        itemSubtotal,
      };
    });
  }, [cart, cartType]);

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    return effectiveCartItems.reduce((sum, item) => sum + item.itemSubtotal, 0);
  }, [effectiveCartItems]);

  // Total Savings in Wholesale Mode
  const savings = useMemo(() => {
    if (!isWholesale) return 0;
    const retailTotal = cart.reduce(
      (sum, item) => sum + item.product.retail_price * item.quantity,
      0
    );
    return Math.max(0, retailTotal - subtotal);
  }, [cart, subtotal, isWholesale]);

  // Actions
  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((i) => i.product.id === product.id);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...cart, { product, quantity }];
    }
    saveCart(updated);
  };

  const removeFromCart = (productId: number) => {
    const updated = cart.filter((i) => i.product.id !== productId);
    saveCart(updated);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart,
        effectiveCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalQuantity,
        totalItemsCount: totalQuantity,
        cartType,
        isWholesale,
        WHOLESALE_MOQ,
        itemsToWholesale,
        subtotal,
        savings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
