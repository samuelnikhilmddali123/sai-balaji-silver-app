import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, Image, Text } from 'react-native';
import { Home, LayoutGrid, Briefcase, User } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { WholesaleScreen } from '../screens/WholesaleScreen';
import { CartScreen } from '../screens/CartScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { FloatingCartBar } from '../components/FloatingCartBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HeaderLogoTitle: React.FC<{ title: string }> = ({ title }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: 28, height: 28, borderRadius: 14 }}
      resizeMode="contain"
    />
    <Text
      style={{
        color: '#111827',
        fontSize: 17,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      }}
    >
      {title}
    </Text>
  </View>
);

const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#EBF0F0',
        },
        headerTintColor: '#2D6A68',
        tabBarStyle: {
          backgroundColor: '#2D6A68',
          position: 'absolute',
          bottom: insets.bottom > 0 ? insets.bottom : 12,
          left: 16,
          right: 16,
          borderRadius: 28,
          height: 60,
          borderTopWidth: 0,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: '#2D6A68',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.55)',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="Sai Balaji Silverworks" />,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="Silver Collections" />,
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Wholesale"
        component={WholesaleScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="B2B Wholesale" />,
          tabBarLabel: 'Wholesale',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerTitle: () => <HeaderLogoTitle title="User Account" />,
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
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
