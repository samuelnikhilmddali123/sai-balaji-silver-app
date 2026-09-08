import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, Image, Text, TouchableOpacity, Linking } from 'react-native';
import { Home, LayoutGrid, Briefcase, User, Search, ShoppingBag, Menu, Instagram } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { WholesaleScreen } from '../screens/WholesaleScreen';
import { CartScreen } from '../screens/CartScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { FloatingCartBar } from '../components/FloatingCartBar';
import { NavigationMenuModal } from '../components/NavigationMenuModal';
import { GlobalAddressModal } from '../components/GlobalAddressModal';
import { SearchModal } from '../components/SearchModal';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { SearchProvider, useSearchModal } from '../context/SearchContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HeaderLeftMenu: React.FC = () => {
  const navigation = useNavigation<any>();
  const { openMenu } = useMenu();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, gap: 12 }}>
      <TouchableOpacity
        onPress={openMenu}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Menu color="#202020" size={22} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        activeOpacity={0.88}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#E5E0D8',
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Image
            source={require('../../assets/logo.webp')}
            style={{ width: 30, height: 30, borderRadius: 15 }}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={{ fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#202020', letterSpacing: 2, fontWeight: '500' }}>
            SAI BALAJI
          </Text>
          <Text style={{ fontSize: 8.5, color: '#666666', letterSpacing: 2, fontWeight: '600' }}>
            SILVERWORKS
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const HeaderRightIcons: React.FC = () => {
  const navigation = useNavigation<any>();
  const { totalItemsCount } = useCart();
  const { openSearch } = useSearchModal();

  const handleInstagramPress = () => {
    Linking.openURL('https://www.instagram.com/saibalaji_silverworkspvtltd?igsi=ajl0a3hnYWw3dzhi').catch(() => {});
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 14 }}>
      <TouchableOpacity
        onPress={openSearch}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Search color="#202020" size={20} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleInstagramPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Instagram color="#202020" size={20} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('MainTabs', { screen: 'Account' })}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <User color="#202020" size={20} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.88}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#1A1918',
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 20,
        }}
      >
        <ShoppingBag color="#FFFFFF" size={13} />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
          }}
        >
          CART ({totalItemsCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const commonHeaderOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#FAF8F5',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE6DF',
  },
  headerTitleAlign: 'center' as const,
  headerLeft: () => <HeaderLeftMenu />,
  headerTitle: () => null,
  headerRight: () => <HeaderRightIcons />,
  headerTintColor: '#111111',
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={{
        ...commonHeaderOptions,
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
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Retail',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Wholesale"
        component={WholesaleScreen}
        options={{
          tabBarLabel: 'Wholesale',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <SearchProvider>
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FAF8F5' },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={commonHeaderOptions}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={commonHeaderOptions}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={commonHeaderOptions}
          />
          <Stack.Screen
            name="Contact"
            component={ContactScreen}
            options={commonHeaderOptions}
          />
        </Stack.Navigator>

        {/* Floating Quick Cart Bar overlay */}
        <FloatingCartBar />

        {/* Full-screen Navigation Menu Modal */}
        <NavigationMenuModal />

        {/* Global Profile & Delivery Setup Address Modal */}
        <GlobalAddressModal />

        {/* Global Search Modal matching website Image 4 */}
        <SearchModal />
      </View>
    </SearchProvider>
  );
};

export default RootNavigator;
