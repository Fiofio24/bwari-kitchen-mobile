import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  TextInput,
  Keyboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phone, email } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  
  // Create an array of refs for the input fields
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Handle countdown timer for Resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value.length > 1 || !/^\d*$/.test(value)) return;

    const newOtpArray = otp.split('');
    newOtpArray[index] = value;
    const newOtp = newOtpArray.join('');
    setOtp(newOtp);

    // Auto-advance to next input
    if (value !== '' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // If we reach the end, dismiss keyboard
    if (newOtp.length === OTP_LENGTH && value !== '') {
       Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace logic to move to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtpArray = otp.split('');
      newOtpArray[index - 1] = '';
      setOtp(newOtpArray.join(''));
    }
  };

  const handleVerify = () => {
    if (otp.length !== OTP_LENGTH) return;
    
    setIsLoading(true);
    
    // Simulate Backend API Call to Supabase for OTP Verification
    setTimeout(() => {
      setIsLoading(false);
      
      // Step 3: Route to Address Setup (Instead of PIN Setup)
      router.replace('/setup-address');
    }, 1500);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    
    // Reset timer and simulate resend
    setResendTimer(30);
    // Add real resend logic here
  };

  // Determine what contact info to show
  const displayContact = phone || email || "your device";

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        
        {/* Header / Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Verification Code</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            We have sent a 6-digit verification code to{"\n"}
            <Text style={{ fontWeight: 'bold', color: colors.text }}>{displayContact}</Text>
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {Array(OTP_LENGTH).fill(0).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => inputRefs.current[index] = ref}
                style={[
                  styles.otpInput,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: otp[index] ? Colors.primary : colors.border,
                    color: colors.text
                  }
                ]}
                maxLength={1}
                keyboardType="number-pad"
                value={otp[index] || ''}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            style={[
              styles.primaryBtn, 
              { backgroundColor: otp.length === OTP_LENGTH ? Colors.primary : colors.border }
            ]} 
            disabled={otp.length !== OTP_LENGTH || isLoading}
            activeOpacity={0.8}
            onPress={handleVerify}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[
                styles.primaryBtnText, 
                { color: otp.length === OTP_LENGTH ? '#FFF' : colors.textMuted }
              ]}>
                Verify Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Logic */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textMuted }]}>
              Didn&apos;t receive the code?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
              <Text style={[
                styles.resendLink, 
                { color: resendTimer > 0 ? colors.textMuted : Colors.primary }
              ]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 30,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});