import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 
import { ThemeProvider } from '../context/ThemeContext'; 
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CartProvider } from '../context/CartContext';
import { FavoriteProvider } from '../context/FavoriteContext';
import { UserProvider } from '../context/UserContext'; 
import { NotificationProvider } from '../context/NotificationContext'; 
import { AddressProvider } from '../context/AddressContext'; 

SplashScreen.preventAutoHideAsync();

const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) { console.warn("Storage Error:", e); }
    return null;
  }
};

function RootContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Check if a user session is currently saved in local storage
        const savedUser = await safeStorage.getItem('@bwari_kitchen_user_v2');
        
        // 2. Decide the initial route based on auth status
        if (!savedUser) {
          setInitialRoute('/welcome');
        } else {
          // ROUTE RETURNING USERS TO THE UNLOCK SCREEN!
          setInitialRoute('/unlock');
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
      SplashScreen.hideAsync();
      
      if (segments.length === 0) {
        router.replace(initialRoute as any);
      }
    }
  }, [appIsReady, initialRoute, segments]);

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
        <Stack.Screen name="unlock" options={{ animation: 'fade' }} />
        
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
        <Stack.Screen 
          name="test-notifications" 
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