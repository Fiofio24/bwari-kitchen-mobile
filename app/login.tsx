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
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateUserData } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password || !agreed) return;
    
    setIsLoading(true);
    // Simulate Backend API Call
    setTimeout(() => {
      setIsLoading(false);
      updateUserData({ email });
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: Colors.primary }]}>
        <StatusBar style="light" />
        
        {/* RED HEADER SECTION */}
        <View style={[styles.headerSection, { paddingTop: insets.top }]}>
          <Image 
            source={require('../assets/splash.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        {/* WHITE FORM SECTION (Overlapping with pure upward shadow) */}
        <View style={[styles.formSection, { backgroundColor: colors.background }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          >
            
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
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
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
              {/* Only the checkbox is clickable now */}
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

            {/* SOCIAL LOGIN */}
            <View style={styles.socialSection}>
              <Text style={[styles.socialDividerText, { color: colors.textMuted }]}>
                other ways to sign in
              </Text>
              <View style={styles.socialButtonsRow}>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: isDark ? colors.surface : '#FFF' }]} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: isDark ? colors.surface : '#FFF' }]} activeOpacity={0.8}>
                  <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
              </View>
            </View>

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

          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
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
    width: 200,
    height: 120,
  },
  formSection: {
    flex: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 30,
    marginTop: -30, 
    zIndex: 10,
    elevation: 30, // Android pure shadow
    shadowColor: '#000', // iOS & Web shadow
    shadowOffset: {
      width: 0,
      height: -10, // Upward casting offset
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 25,
    flexGrow: 1,
  },
  inputGroup: {
    marginBottom: 20,
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
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 5,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingHorizontal: 5,
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
    paddingTop: 20,
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