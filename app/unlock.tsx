import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useUser } from '../context/UserContext';
import api from './lib/api';
import { useNotifications } from '../context/NotificationContext';
import { useAddresses } from '../context/AddressContext';
import { useFavorites } from '../context/FavoriteContext';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

export default function UnlockScreen() {
  const router = useSafeRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userData } = useUser();

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { refresh: refreshNotifications } = useNotifications();
  const { refresh: refreshAddresses } = useAddresses();
  const { refresh: refreshFavorites } = useFavorites();

  // THE POINT OF NO RETURN: Force app exit if they press the hardware back button here
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true; // Prevents default back navigation
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const goToApp = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const goToLogin = useCallback(async () => {
    await SecureStore.deleteItemAsync('authToken');
    router.replace('/login');
  }, [router]);

  // Confirm the stored token is still valid against the real backend
  const validateSession = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        goToLogin();
        return;
      }
      await api.get('/api/auth/me');
      await Promise.all([refreshNotifications(), refreshAddresses(), refreshFavorites()]);
      setIsChecking(false);
    } catch (_err) {
      goToLogin();
    }
  }, [goToLogin, refreshNotifications, refreshAddresses, refreshFavorites]);

  const handleBiometricAuth = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Bwari Kitchen',
    });
    if (result.success) {
      await Promise.all([refreshNotifications(), refreshAddresses(), refreshFavorites()]);
      goToApp();
    }
  }, [goToApp, refreshNotifications, refreshAddresses, refreshFavorites]);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
      await validateSession();
    })();
  }, [validateSession]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    router.replace('/welcome');
  };

  if (isChecking) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator color="#FFF" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary, paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.topSection}>
        <View style={styles.avatarContainer}>
           {userData.avatarUri ? (
             <Image source={{ uri: userData.avatarUri }} style={styles.avatarImage} />
           ) : (
             <Ionicons name="person" size={scale(40)} color={Colors.primary} />
           )}
        </View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{userData.name.split(' ')[0]}</Text>
      </View>

      <View style={[styles.bottomSection, { backgroundColor: colors.background, paddingBottom: insets.bottom + scale(20) }]}>
        {isBiometricSupported ? (
          <>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Use biometrics to continue
            </Text>
            <TouchableOpacity 
              style={[styles.numButton, { backgroundColor: colors.surface, borderColor: colors.border, alignSelf: 'center', marginBottom: scale(30) }]}
              onPress={handleBiometricAuth}
              activeOpacity={0.7}
            >
              <Ionicons name="finger-print" size={scale(40)} color={colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: Colors.primary, marginBottom: scale(20) }]}
            onPress={goToApp}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Not you? Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(15),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(5),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  welcomeText: {
    fontSize: scale(16),
    color: '#FFD6D6',
    marginBottom: scale(5),
  },
  nameText: {
    fontSize: scale(28),
    fontWeight: 'bold',
    color: '#FFF',
  },
  bottomSection: {
    borderTopLeftRadius: scale(40),
    borderTopRightRadius: scale(40),
    paddingTop: scale(35),
    paddingHorizontal: scale(30),
    alignItems: 'center',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(-10) },
    shadowOpacity: 0.2,
    shadowRadius: scale(20),
  },
  instructionText: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(20),
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(15),
    marginBottom: scale(40),
  },
  pinDot: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: scale(2),
  },
  numpadContainer: {
    width: '100%',
    maxWidth: scale(350),
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(20),
  },
  numButton: {
    width: scale(75),
    height: scale(75),
    borderRadius: scale(38),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(3),
  },
  numText: {
    fontSize: scale(28),
    fontWeight: '600',
  },
  actionButton: {
    width: scale(75),
    height: scale(75),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: scale(10),
    padding: scale(10),
  },
  logoutText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: scale(15),
  },
  primaryBtn: {
    height: scale(56),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
});