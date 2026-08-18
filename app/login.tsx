import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Platform, 
  ActivityIndicator,
  Dimensions
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
import { scale } from '../constants/Sizes'; 
import SafeKeyboardWrapper from '../components/SafeKeyboardWrapper';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateUserData } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { refresh: refreshNotifications } = useNotifications();
  const { refresh: refreshAddresses } = useAddresses();
  const { refresh: refreshFavorites } = useFavorites();

  const handleLogin = async () => {
    if (!email || !password || !agreed) return;

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      await SecureStore.setItemAsync('authToken', token);
      updateUserData({ name: user.fullName, email: user.email });
      await Promise.all([refreshNotifications(), refreshAddresses(), refreshFavorites()]);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* REUSABLE HERO SECTION */}
      <HeroHeader 
        heightRatio={0.35}
        logoPaddingBottom={scale(35)} 
      />

      {/* WHITE FORM SECTION (Overlapping) */}
      <View style={[styles.formSection, { backgroundColor: colors.background }]}>
        <SafeKeyboardWrapper
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(40) }]}
        >
          <Text style={[styles.header, { color: colors.text }]}>
            Welcome <Text style={{ color: Colors.primary }}>Back</Text> 
          </Text>

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Password
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={scale(20)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.forgotPasswordBtn} activeOpacity={0.7}>
              <Text style={[styles.forgotPasswordText, { color: colors.textMuted }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
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
              {agreed && <Ionicons name="checkmark" size={scale(14)} color="#FFF" />}
            </TouchableOpacity>

            <Text style={[styles.agreementText, { color: colors.textMuted }]}>
              I&apos;ve read and agreed to <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>User Agreement</Text> and <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Privacy Policy</Text>
            </Text>
          </View>

          {errorMessage ? (
            <Text style={{ color: '#D32F2F', fontSize: scale(12), marginBottom: scale(15), textAlign: 'center', fontWeight: '500' }}>{errorMessage}</Text>
          ) : null}
          
          {/* SIGN IN BUTTON */}
          <TouchableOpacity 
            style={[
              styles.primaryBtn, 
              { backgroundColor: (!email || !password || !agreed) ? colors.border : Colors.primary }
            ]} 
            disabled={!email || !password || !agreed || isLoading}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[
                styles.primaryBtnText, 
                { color: (!email || !password || !agreed) ? colors.textMuted : '#FFF' }
              ]}>
                Sign in
              </Text>
            )}
          </TouchableOpacity>

          {/* FOOTER LINK */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Don&apos;t have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: Colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

        </SafeKeyboardWrapper>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoImage: {
    width: scale(300),
    height: scale(220),
  },
  formSection: {
    flex: 1,
    paddingTop: scale(-30),
    marginTop: scale(-100), 
    zIndex: 10,
    elevation: 30, 
  },
  scrollContent: {
    paddingHorizontal: scale(25),
    paddingTop: scale(120),
    flexGrow: 1,
  },
  header: {
    fontSize: scale(28),
    marginBottom: scale(30),
  },
  inputGroup: {
    marginBottom: scale(20),
  },
  inputLabel: {
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(10),
    marginLeft: scale(5),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(30),
    paddingHorizontal: scale(20),
    height: scale(56),
  },
  textInput: {
    flex: 1,
    fontSize: scale(15),
    height: '100%',
  },
  eyeIcon: {
    padding: scale(5),
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: scale(10),
    marginRight: scale(5),
  },
  forgotPasswordText: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale(30),
    paddingHorizontal: scale(5),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(6),
    borderWidth: scale(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
    marginTop: scale(2),
  },
  agreementText: {
    flex: 1,
    fontSize: scale(12),
    lineHeight: scale(18),
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
  socialSection: {
    alignItems: 'center',
    marginBottom: scale(30),
  },
  socialDividerText: {
    fontSize: scale(12),
    marginBottom: scale(20),
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(20),
  },
  socialBtn: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: scale(20),
  },
  footerText: {
    fontSize: scale(14),
  },
  footerLink: {
    fontSize: scale(14),
    fontWeight: 'bold',
    marginLeft: scale(5),
  },
});