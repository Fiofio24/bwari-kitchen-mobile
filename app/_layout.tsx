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

// This prevents the splash screen from hiding automatically 
// until we are sure the app is ready.
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Pre-load fonts or API data here if needed
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
      // Hide the splash screen once everything is loaded
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
          <CartProvider> 
            <FavoriteProvider>
              <RootContent />
            </FavoriteProvider>
          </CartProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}