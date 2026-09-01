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

  // Safely get active route name across stack & tab navigators without crashing on cold launch
  const activeRouteName = useNavigationState((state) => {
    try {
      if (!state || !state.routes || state.index === undefined) return '';
      const currentRoute = state.routes[state.index];
      if (!currentRoute) return '';
      if (currentRoute.state && currentRoute.state.routes && Array.isArray(currentRoute.state.routes)) {
        const nestedIndex = currentRoute.state.index ?? 0;
        const nestedRoute = currentRoute.state.routes[nestedIndex];
        return nestedRoute?.name || currentRoute.name || '';
      }
      return currentRoute.name || '';
    } catch (e) {
      return '';
    }
  });

  // Do not render if cart is empty, or if user is on Cart or ProductDetail screen
  if (totalItemsCount <= 0 || activeRouteName === 'Cart' || activeRouteName === 'ProductDetail') {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('Cart');
  };

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const dynamicBottom = 56 + bottomInset + 8;

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
            <ShoppingBag color="#FFFFFF" size={18} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItemsCount}</Text>
            </View>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.itemCountText}>
              {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} in Bag
            </Text>
            <Text style={styles.totalText}>
              Total: ₹{subtotal.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Right Section: View Bag Button */}
        <View style={styles.cartBtn}>
          <Text style={styles.cartBtnText}>View Bag</Text>
          <ChevronRight color="#111111" size={14} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 999,
  },
  containerStack: {
    bottom: Platform.OS === 'ios' ? 85 : 80,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#C5A059',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#111111',
    fontSize: 9,
    fontWeight: '800',
  },
  infoCol: {
    justifyContent: 'center',
  },
  itemCountText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  cartBtnText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
});
