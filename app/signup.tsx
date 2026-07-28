import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import HeroHeader from '../components/HeroHeader';
import { useNotifications } from '../context/NotificationContext';
import { useAddresses } from '../context/AddressContext';
import { useFavorites } from '../context/FavoriteContext';
import api from './lib/api';
import * as SecureStore from 'expo-secure-store';

export default function SignupScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateUserData } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { refresh: refreshNotifications } = useNotifications();
  const { refresh: refreshAddresses } = useAddresses();
  const { refresh: refreshFavorites } = useFavorites();

  // Validation now explicitly checks for 8 characters and if passwords match
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const isValid = name.trim() && email.trim() && phone.trim() && isPasswordValid && passwordsMatch && agreed;

  const handleSignup = async () => {
    if (!isValid) return;
    
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/auth/register', {
        fullName: name,
        phoneNumber: phone,
        password,
        email,
      });

      const { token, user } = res.data;

      await SecureStore.setItemAsync('authToken', token);
      updateUserData({ name: user.fullName, email: user.email });
      await Promise.all([refreshNotifications(), refreshAddresses(), refreshFavorites()]);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        
        {/* REUSABLE HERO SECTION */}
        <View style={[{ top: -90 }]}>
          <HeroHeader 
            heightRatio={0.35}
            logoPaddingBottom={35} 
          />
        </View>

        {/* WHITE FORM SECTION (Overlapping) */}
        <View style={[styles.formSection, { backgroundColor: colors.background }]}>
          <ScrollView
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          >

            <Text style={[styles.header, { color: colors.text }]}>
              Create <Text style={{ color: Colors.primary }}>Account</Text> 
            </Text>

            {/* FORM FIELDS */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Full Name
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email Address
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Phone Number
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password
              </Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: isDark ? colors.surface : '#FFF', 
                  borderColor: (password.length > 0 && !isPasswordValid) ? '#D32F2F' : colors.border 
                }
              ]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              {/* Dynamic Password Feedback */}
              {password.length === 0 ? (
                <Text style={[styles.helperText, { color: colors.textMuted }]}>Password must be at least 8 characters</Text>
              ) : !isPasswordValid ? (
                <Text style={styles.errorText}>Password must be at least 8 characters</Text>
              ) : (
                <Text style={styles.successText}>✓ Strong password</Text>
              )}
            </View>

            {/* CONFIRM PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Confirm Password
              </Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: isDark ? colors.surface : '#FFF', 
                  borderColor: (confirmPassword.length > 0 && !passwordsMatch) ? '#D32F2F' : colors.border 
                }
              ]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {/* Show error text if user started typing but it doesn't match */}
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            {/* AGREEMENT CHECKBOX */}
            <View style={styles.agreementRow}>
              <TouchableOpacity 
                style={[
                  styles.checkbox, 
                  { 
                    borderColor: agreed ? Colors.primary : colors.border,
                    backgroundColor: agreed ? Colors.primary : 'transparent' 
                  }
                ]}
                activeOpacity={0.8}
                onPress={() => setAgreed(!agreed)}
              >
                {agreed && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </TouchableOpacity>

              <Text style={[styles.agreementText, { color: colors.textMuted }]}>
                I&apos;ve read and agreed to <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>User Agreement</Text> and <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Privacy Policy</Text>
              </Text>
            </View>
             {errorMessage ? (
              <Text style={[styles.errorText, { marginBottom: 15, textAlign: 'center' }]}>{errorMessage}</Text>
            ) : null}
    
            {/* SIGN UP BUTTON */}
            <TouchableOpacity 
              style={[
                styles.primaryBtn, 
                { backgroundColor: !isValid ? colors.border : Colors.primary }
              ]} 
              disabled={!isValid || isLoading}
              activeOpacity={0.8}
              onPress={handleSignup}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[
                  styles.primaryBtnText, 
                  { color: !isValid ? colors.textMuted : '#FFF' }
                ]}>
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            {/* SOCIAL SIGN UP */}
            {/* <View style={styles.socialSection}>
              <Text style={[styles.socialDividerText, { color: colors.textMuted }]}>
                other ways to sign up
              </Text>
              <View style={styles.socialButtonsRow}>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: isDark ? colors.surface : '#FFF' }]} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: isDark ? colors.surface : '#FFF' }]} activeOpacity={0.8}>
                  <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
              </View>
            </View> */}

            {/* FOOTER LINK */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
                <Text style={[styles.footerLink, { color: Colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// PRO CSS COMPLIANCE
const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  formSection: {
    flex: 1,
    paddingTop: -30,
    marginTop: -200, 
    zIndex: 10,
    elevation: 30, 
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 120,
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 200,
    height: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    // fontWeight: 'bold',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
    fontWeight: '500',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingHorizontal: 5,
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
  socialSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  socialDividerText: {
    fontSize: 12,
    marginBottom: 20,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});