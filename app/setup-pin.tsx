import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useUser } from '../context/UserContext';

const PIN_LENGTH = 6;

export default function SetupPinScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userData } = useUser();

  // State management for the two-step process
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string>('');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  
  // Shake animation for mismatch
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Final success handler
  const handleSuccess = useCallback(async (finalPin: string) => {
    // In a real app, you would hash/salt this before saving, 
    // or securely transmit it to your Supabase backend.
    // For now, we store it locally to mimic the unlock flow.
    try {
      await SecureStore.setItemAsync('user_pin', finalPin);
      
      // Give a tiny delay for UX, then route to the main app!
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (e) {
      console.warn("Error saving PIN", e);
    }
  }, [router]);

  // Error shake trigger
  const triggerShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setIsError(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start(() => {
      // If confirm fails, reset back to step 1
      setStep('create');
      setFirstPin('');
      setCurrentPin('');
      setIsError(false);
    });
  }, [shakeAnim]);

  // Handle number pad presses
  const handleKeyPress = (num: string) => {
    if (isError) return; 
    
    if (currentPin.length < PIN_LENGTH) {
      Haptics.selectionAsync();
      setCurrentPin(prev => prev + num);
    }
  };

  // Monitor PIN entry length to auto-advance
  useEffect(() => {
    if (currentPin.length === PIN_LENGTH) {
      if (step === 'create') {
        // Step 1 finished: save first pin and move to confirm step
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFirstPin(currentPin);
        
        // Slight delay so user sees the last dot fill before clearing
        setTimeout(() => {
          setCurrentPin('');
          setStep('confirm');
        }, 300);

      } else if (step === 'confirm') {
        // Step 2 finished: Verify against first pin
        if (currentPin === firstPin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          handleSuccess(currentPin);
        } else {
          triggerShake();
        }
      }
    }
  }, [currentPin, step, firstPin, handleSuccess, triggerShake]);

  const handleDelete = () => {
    if (isError || currentPin.length === 0) return;
    Haptics.selectionAsync();
    setCurrentPin(prev => prev.slice(0, -1));
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary, paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header Section */}
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.welcomeText}>App Security</Text>
        <Text style={styles.nameText}>
          {step === 'create' ? "Create a PIN" : "Confirm PIN"}
        </Text>
      </View>

      {/* Bottom Sheet Section */}
      <View style={[styles.bottomSection, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
        <Text style={[styles.instructionText, { color: isError ? '#D32F2F' : colors.textMuted }]}>
          {isError 
            ? "PINs did not match. Try again." 
            : step === 'create' 
              ? "Create a 6-digit PIN to secure your account" 
              : "Re-enter your 6-digit PIN to confirm"}
        </Text>
        
        {/* Animated PIN Indicators */}
        <Animated.View style={[styles.pinContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {Array(PIN_LENGTH).fill(0).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.pinDot, 
                { 
                  borderColor: isError ? '#D32F2F' : '#FFF', 
                  backgroundColor: currentPin.length > index ? Colors.primary : 'transparent'
                }
              ]} 
            />
          ))}
        </Animated.View>

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
            {/* Empty space for alignment */}
            <View style={styles.actionButton} />

            <TouchableOpacity 
              style={[styles.numButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.7}
            >
              <Text style={[styles.numText, { color: colors.text }]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="backspace-outline" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

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
  iconContainer: {
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
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFD6D6',
    marginBottom: 5,
    fontWeight: '500',
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
    fontSize: 15,
    marginBottom: 25,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 40,
  },
  pinDot: {
    width: 13,
    height: 13,
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
});