import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 
import { ThemeProvider, useTheme } from '../context/ThemeContext'; 
// 1. Import the Splash Screen tool
import * as SplashScreen from 'expo-splash-screen';

// 2. Tell the OS to keep the splash screen visible until we explicitly hide it!
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { isDark } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Here is where you would load custom fonts, check if the user is logged in, 
        // or fetch initial data from a database.
        
        // For now, let's just simulate a 2-second loading process so you can see it work!
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the state that everything is loaded
        setAppIsReady(true);
      }
    }

    prepareApp();
  }, []);

  // Watch for when the app is ready. When it is, hide the splash screen!
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Don't render the actual app navigation until we are ready
  if (!appIsReady) {
    return null; 
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      
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
        <RootContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}