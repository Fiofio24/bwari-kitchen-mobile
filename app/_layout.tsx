import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 
// Removed useTheme from the import since we don't need it in this file anymore
import { ThemeProvider } from '../context/ThemeContext'; 
import * as SplashScreen from 'expo-splash-screen';
import { CartProvider } from '../context/CartContext';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  // Removed the unused `const { isDark } = useTheme();` line here
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
      {/* FORCE the status bar to be translucent and have light icons! */}
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="search" 
          options={{ 
            animation: 'slide_from_bottom',
            presentation: 'transparentModal' 
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
        {/* THE BRAIN: Wrapping the entire app! */}
        <CartProvider> 
          <RootContent />
        </CartProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}