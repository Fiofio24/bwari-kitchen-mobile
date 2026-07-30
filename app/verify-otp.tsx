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
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const router = useSafeRouter();
  const { phone, email } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  
  // Create an array of refs for the input fields
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Handle countdown timer for Resend button
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
            <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={scale(40)} color={Colors.primary} />
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
                ref={(ref) => { inputRefs.current[index] = ref; }}
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
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    paddingBottom: scale(20),
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(25),
    paddingTop: scale(20),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: scale(30),
  },
  iconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scale(28),
    fontWeight: 'bold',
    marginBottom: scale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scale(15),
    lineHeight: scale(22),
    textAlign: 'center',
    marginBottom: scale(40),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(40),
    paddingHorizontal: scale(10),
  },
  otpInput: {
    width: scale(45),
    height: scale(55),
    borderWidth: 2,
    borderRadius: scale(12),
    fontSize: scale(24),
    fontWeight: 'bold',
    textAlign: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(3),
  },
  primaryBtn: {
    height: scale(56),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale(5),
    marginBottom: scale(30),
  },
  primaryBtnText: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: scale(14),
  },
  resendLink: {
    fontSize: scale(14),
    fontWeight: 'bold',
  },
});