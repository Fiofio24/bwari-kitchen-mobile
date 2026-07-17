import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useUser } from '../context/UserContext';
import api from './lib/api';

const VALID_PIN = '123456'; 

export default function UnlockScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userData } = useUser();

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
      setIsChecking(false);
    } catch (err) {
      goToLogin();
    }
  }, [goToLogin]);

  const handleBiometricAuth = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Bwari Kitchen',
    });
    if (result.success) {
      goToApp();
    }
  }, [goToApp]);

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
             <Ionicons name="person" size={40} color={Colors.primary} />
           )}
        </View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{userData.name.split(' ')[0]}</Text>
      </View>

      <View style={[styles.bottomSection, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
        {isBiometricSupported ? (
          <>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Use biometrics to continue
            </Text>
            <TouchableOpacity 
              style={[styles.numButton, { backgroundColor: colors.surface, borderColor: colors.border, alignSelf: 'center', marginBottom: 30 }]}
              onPress={handleBiometricAuth}
              activeOpacity={0.7}
            >
              <Ionicons name="finger-print" size={40} color={colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: Colors.primary, marginBottom: 20 }]}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFD6D6',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bottomSection: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 35,
    paddingHorizontal: 30,
    alignItems: 'center',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 40,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  numpadContainer: {
    width: '100%',
    maxWidth: 350,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numButton: {
    width: 75,
    height: 75,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  numText: {
    fontSize: 28,
    fontWeight: '600',
  },
  actionButton: {
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: 10,
    padding: 10,
  },
  logoutText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});