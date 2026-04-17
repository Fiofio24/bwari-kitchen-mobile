// Note: This file requires an Expo/React Native environment to compile correctly.
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 
import { ThemeProvider } from '../context/ThemeContext'; 
import * as SplashScreen from 'expo-splash-screen';
import { CartProvider } from '../context/CartContext';
import { FavoriteProvider } from '../context/FavoriteContext';
import { UserProvider } from '../context/UserContext'; 
import { NotificationProvider } from '../context/NotificationContext'; 
import { AddressProvider } from '../context/AddressContext'; // <-- PRO UX FIX: Connected Global Addresses

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepareApp();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; 
  }

  return (
    <>
      <StatusBar 
        style="light" 
        translucent={true} 
        backgroundColor="transparent" 
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="search" 
          options={{ 
            animation: 'slide_from_bottom', 
            presentation: 'transparentModal' 
          }} 
        />
        <Stack.Screen 
          name="checkout" 
          options={{ 
            animation: 'slide_from_right' 
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <AddressProvider>
            <CartProvider> 
              <FavoriteProvider>
                <NotificationProvider>
                  <RootContent />
                </NotificationProvider>
              </FavoriteProvider>
            </CartProvider>
          </AddressProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}