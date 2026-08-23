import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 
import { ThemeProvider } from '../context/ThemeContext'; 
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

import { CartProvider } from '../context/CartContext';
import { FavoriteProvider } from '../context/FavoriteContext';
import { UserProvider } from '../context/UserContext'; 
import { NotificationProvider } from '../context/NotificationContext'; 
import { AddressProvider } from '../context/AddressContext'; 
import { MenuProvider } from '../context/MenuContext';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  
  const router = useSafeRouter();
  const segments = useSegments();

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Check if a session token is currently saved
        const token = await SecureStore.getItemAsync('authToken');
        
        // 2. Decide the initial route intelligently (Beta Phase Removed)
        if (!token) {
          setInitialRoute('/welcome');
        } else {
          // ROUTE RETURNING USERS DIRECTLY TO HOME
          setInitialRoute('/(tabs)');
        }

        // Simulate minimum loading time for the native splash screen
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
    if (appIsReady && initialRoute) {
      
      // FIX: Wrap this in a try/catch to stop the iOS Expo Go spam!
      try {
        SplashScreen.hideAsync();
      } catch (e) {
        // Silently ignore if the splash screen is already hidden
      }
      
      // FIX: Added a 100ms delay before replacing the route.
      // This prevents the dreaded Android 'getChildDrawingOrder' crash 
      // by giving the native UI thread enough time to mount the <Stack> first.
      setTimeout(() => {
        if (!segments.length) {
          router.replace(initialRoute as any);
        }
      }, 100);
    }
  }, [appIsReady, initialRoute, segments, router]);

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
        {/* Auth Flow */}
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="setup-address" options={{ animation: 'slide_from_right' }} />
        
        {/* Role-Based App Environments */}
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        
        {/* Modals & Sub-pages */}
        <Stack.Screen 
          name="search" 
          options={{ animation: 'slide_from_bottom', presentation: 'transparentModal' }} 
        />
        <Stack.Screen 
          name="checkout" 
          options={{ animation: 'slide_from_right' }} 
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
            <MenuProvider>
              <CartProvider> 
                <FavoriteProvider>
                  <NotificationProvider>
                    <RootContent />
                  </NotificationProvider>
                </FavoriteProvider>
              </CartProvider>
            </MenuProvider>
          </AddressProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}