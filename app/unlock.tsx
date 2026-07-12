import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Alert
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

// FIX: Removed unused 'width' variable

// Mock function - In reality, you'd compare this to the securely stored PIN
const VALID_PIN = '1234'; 

export default function UnlockScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userData } = useUser();

  const [pin, setPin] = useState<string>('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // FIX: Wrapped handleSuccess in useCallback to safely use it in useEffect
  const handleSuccess = useCallback(() => {
    // Here you would retrieve the JWT from SecureStore and set it in your API headers
    router.replace('/(tabs)');
  }, [router]);

  // FIX: Wrapped handleBiometricAuth in useCallback
  const handleBiometricAuth = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Bwari Kitchen',
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      handleSuccess();
    }
  }, [handleSuccess]);

  // Check if the device supports FaceID / Fingerprint
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
      
      // Auto-prompt biometrics on load if supported
      if (compatible && enrolled) {
        handleBiometricAuth();
      }
    })();
  // FIX: Added handleBiometricAuth to dependencies
  }, [handleBiometricAuth]);

  // Monitor PIN entry
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === VALID_PIN) {
        handleSuccess();
      } else {
        Alert.alert("Incorrect PIN", "Please try again.", [{ text: "OK", onPress: () => setPin('') }]);
      }
    }
  // FIX: Added handleSuccess to dependencies
  }, [pin, handleSuccess]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogout = async () => {
    // Clear the secure store and go back to welcome
    await SecureStore.deleteItemAsync('user_token');
    router.replace('/welcome');
  };

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
        <Text style={[styles.instructionText, { color: colors.text }]}>Enter your 4-digit PIN</Text>
        
        {/* PIN Indicators */}
        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View 
              key={index} 
              style={[
                styles.pinDot, 
                { 
                  borderColor: isDark ? colors.border : '#CCC',
                  backgroundColor: pin.length > index ? Colors.primary : 'transparent'
                }
              ]} 
            />
          ))}
        </View>

        {/* Number Pad */}
        <View style={styles.numpadContainer}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numpadRow}>
              {row.map((num) => (
                <TouchableOpacity 
                  key={num} 
                  style={[styles.numButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleKeyPress(num)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.numText, { color: colors.text }]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          
          <View style={styles.numpadRow}>
            {/* Biometric Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleBiometricAuth}
              disabled={!isBiometricSupported}
            >
              {isBiometricSupported && <Ionicons name="finger-print" size={32} color={colors.text} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.numButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.7}
            >
              <Text style={[styles.numText, { color: colors.text }]}>0</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="backspace-outline" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

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
    gap: 20,
    marginBottom: 40,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
});