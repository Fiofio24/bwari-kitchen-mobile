import { useEffect, useState, useRef } from 'react';
import { Platform, View, Text, Animated, Easing } from 'react-native';
import { Stack, useSegments, usePathname } from 'expo-router';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context'; 
import { ThemeProvider, useTheme } from '../context/ThemeContext'; 
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/Colors';

import { CartProvider } from '../context/CartContext';
import { FavoriteProvider } from '../context/FavoriteContext';
import { UserProvider } from '../context/UserContext'; 
import { NotificationProvider } from '../context/NotificationContext'; 
import { AddressProvider } from '../context/AddressContext'; 
import { MenuProvider } from '../context/MenuContext';
import api from './lib/api';

SplashScreen.preventAutoHideAsync();

// THE FIX: Seamless Infinite Marquee that specifically accommodates the Search page
function GlobalClosedTicker({ reason }: { reason: string }) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const { colors } = useTheme();
  
  const marqueeWidth = 750; 

  // Smart sensing: ONLY the search page lacks the TopNav/Primary header.
  const isSearchPage = pathname === '/search';
  const statusBarBgColor = isSearchPage ? colors.background : Colors.primary;

  useEffect(() => {
    translateX.setValue(0);
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -marqueeWidth,
        duration: 15000, 
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [translateX]);

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: statusBarBgColor }}>
      <View style={{ height: 35, overflow: 'hidden', justifyContent: 'center', backgroundColor: '#fee3b7', borderBottomWidth: 1, borderColor: '#FFA000' }}>
        <Animated.View style={{ transform: [{ translateX }], flexDirection: 'row', width: marqueeWidth * 2 }}>
          
          <View style={{ width: marqueeWidth, flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
            <Text style={{ color: '#E65100', fontWeight: 'bold', marginLeft: 8, fontSize: 13, letterSpacing: 0.5 }}>
              ⚠️ KITCHEN IS CURRENTLY CLOSED — {reason.toUpperCase()} ⚠️
            </Text>
          </View>

          <View style={{ width: marqueeWidth, flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
            <Text style={{ color: '#E65100', fontWeight: 'bold', marginLeft: 8, fontSize: 13, letterSpacing: 0.5 }}>
              ⚠️ KITCHEN IS CURRENTLY CLOSED — {reason.toUpperCase()} ⚠️
            </Text>
          </View>

        </Animated.View>
      </View>
    </View>
  );
}

function RootContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [closedReason, setClosedReason] = useState('');

  const router = useSafeRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  const pathname = usePathname();
  const { isDark } = useTheme();

  // Smart Status Bar: Stays white (light) everywhere except the search page in light mode!
  const isSearchPage = pathname === '/search';
  const statusBarStyle = (isSearchPage && !isDark) ? "dark" : "light";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/menu/branch');
        const branchInfo = res.data?.branch;
        
        if (branchInfo) {
          let isTimeValid = true;
          if (branchInfo.openingTime && branchInfo.closingTime) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const [oH, oM] = branchInfo.openingTime.split(':').map(Number);
            const [cH, cM] = branchInfo.closingTime.split(':').map(Number);
            const openMins = oH * 60 + oM;
            const closeMins = cH * 60 + cM;

            if (closeMins < openMins) {
              isTimeValid = currentMins >= openMins || currentMins <= closeMins;
            } else {
              isTimeValid = currentMins >= openMins && currentMins <= closeMins;
            }
          }
          const manualOpen = branchInfo.isOpen !== false;
          
          if (!manualOpen) {
            setIsStoreOpen(false);
            setClosedReason('We are not accepting orders at this moment.');
          } else if (!isTimeValid) {
            setIsStoreOpen(false);
            setClosedReason('We are outside of our regular working hours.');
          } else {
            setIsStoreOpen(true);
          }
        }
      } catch (e) {}
    };
    
    fetchSettings();
    const intId = setInterval(fetchSettings, 10000);
    return () => clearInterval(intId);
  }, []);

  useEffect(() => {
    async function prepareApp() {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        
        if (!token) {
          setInitialRoute('/welcome');
        } else {
          setInitialRoute('/(tabs)');
        }

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
      try {
        SplashScreen.hideAsync();
      } catch (e) {}
      
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
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      
      <StatusBar 
        style={statusBarStyle} 
        translucent={true} 
        backgroundColor="transparent" 
      />
      
      {!isStoreOpen && <GlobalClosedTicker reason={closedReason} />}
      
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: isStoreOpen ? insets.top : 0 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="setup-address" options={{ animation: 'slide_from_right' }} />
          
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          
          <Stack.Screen 
            name="search" 
            options={{ animation: 'slide_from_bottom', presentation: 'transparentModal' }} 
          />
          <Stack.Screen 
            name="checkout" 
            options={{ animation: 'slide_from_right' }} 
          />
        </Stack>
      </SafeAreaInsetsContext.Provider>
    </View>
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