import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, BodoniModa_400Regular, BodoniModa_600SemiBold, BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { MenuProvider } from './src/context/MenuContext';
import { SilverRateProvider } from './src/context/SilverRateContext';
import { RootNavigator } from './src/navigation/RootNavigator';

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
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
