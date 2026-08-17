import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';

export const FloatingCartBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { totalItemsCount, subtotal } = useCart();

  // Safely get active route name across stack & tab navigators
  const activeRouteName = useNavigationState((state) => {
    if (!state) return '';
    const currentRoute = state.routes[state.index];
    if (currentRoute.state && currentRoute.state.routes) {
      const nestedRoute = currentRoute.state.routes[currentRoute.state.index || 0];
      return nestedRoute.name;
    }
    return currentRoute.name;
  });

  // Do not render if cart is empty, or if user is on Cart or ProductDetail screen
  if (totalItemsCount <= 0 || activeRouteName === 'Cart' || activeRouteName === 'ProductDetail') {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('Cart');
  };

  const dynamicBottom = 56 + (insets.bottom > 0 ? insets.bottom : 8) + 10;

  return (
    <View style={[styles.container, { bottom: dynamicBottom }]}>
      <TouchableOpacity
        style={styles.bar}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Left Section: Bag Icon with Badge + Items Count & Subtotal */}
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <ShoppingBag color="#FFFFFF" size={20} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItemsCount}</Text>
            </View>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.itemCountText}>
              {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} in Bag
            </Text>
            <Text style={styles.totalText}>
              Total: ₹{subtotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Right Section: Gold Pill Cart Button */}
        <View style={styles.cartBtn}>
          <Text style={styles.cartBtnText}>Cart</Text>
          <ChevronRight color="#2D6A68" size={16} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 70 : 65, // Floats right above bottom tabs
    left: 14,
    right: 14,
    zIndex: 999,
  },
  containerStack: {
    bottom: Platform.OS === 'ios' ? 85 : 80, // Floats above ProductDetail footer
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2D6A68',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#2D6A68',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E6A15C',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  infoCol: {
    justifyContent: 'center',
  },
  itemCountText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  cartBtnText: {
    color: '#2D6A68',
    fontSize: 12,
    fontWeight: '800',
  },
});
