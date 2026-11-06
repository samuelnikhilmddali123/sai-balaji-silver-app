import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, Image, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, BodoniModa_400Regular, BodoniModa_600SemiBold, BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { MenuProvider } from './src/context/MenuContext';
import { SilverRateProvider } from './src/context/SilverRateContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FAF8F5',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <StatusBar style="dark" />
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: '#E5E0D8',
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
            marginBottom: 20,
          }}
        >
          <Image
            source={require('./assets/logo.webp')}
            style={{ width: 64, height: 64, borderRadius: 14 }}
            resizeMode="contain"
          />
        </View>

        <Text
          style={{
            fontSize: 17,
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            color: '#202020',
            letterSpacing: 3,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          SAI BALAJI
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: '#898985',
            letterSpacing: 3.5,
            fontWeight: '600',
            marginBottom: 28,
          }}
        >
          SILVERWORKS
        </Text>

        <ActivityIndicator size="small" color="#C5A059" />
      </View>
    );
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <MenuProvider>
          <SilverRateProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </SilverRateProvider>
        </MenuProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_600SemiBold,
    BodoniModa_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
