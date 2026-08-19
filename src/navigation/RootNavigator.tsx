import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, Image, Text, TouchableOpacity } from 'react-native';
import { Home, LayoutGrid, Briefcase, User, Search, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { WholesaleScreen } from '../screens/WholesaleScreen';
import { CartScreen } from '../screens/CartScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { FloatingCartBar } from '../components/FloatingCartBar';
import { useCart } from '../context/CartContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HeaderLogoTitle: React.FC<{ title?: string }> = ({ title = 'Sai Balaji Silverworks' }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: 26, height: 26, borderRadius: 13 }}
      resizeMode="contain"
    />
    <Text
      style={{
        color: '#111111',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        letterSpacing: 0.3,
      }}
      numberOfLines={1}
    >
      {title}
    </Text>
  </View>
);

const HeaderRightIcons: React.FC = () => {
  const navigation = useNavigation<any>();
  const { totalItemsCount } = useCart();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginRight: 16 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Categories')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Search color="#111111" size={20} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Cart')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        style={{ position: 'relative' }}
      >
        <ShoppingBag color="#111111" size={20} />
        {totalItemsCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -6,
              backgroundColor: '#111111',
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '800' }}>
              {totalItemsCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EFEA',
          height: Platform.OS === 'ios' ? 44 + insets.top : 56,
        },
        headerTitleAlign: 'left',
        headerRight: () => <HeaderRightIcons />,
        headerTintColor: '#111111',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 56 + bottomInset,
          borderTopWidth: 1,
          borderTopColor: '#E5E5E0',
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#898985',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="Sai Balaji Silverworks" />,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="Silver Collections" />,
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Wholesale"
        component={WholesaleScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="B2B Wholesale" />,
          tabBarLabel: 'Wholesale',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="Account" />,
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{
            headerShown: true,
            headerTitle: () => <HeaderLogoTitle title="Shopping Cart" />,
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#2D6A68',
          }}
        />
      </Stack.Navigator>

      {/* Floating Quick Cart Bar overlay */}
      <FloatingCartBar />
    </View>
  );
};
