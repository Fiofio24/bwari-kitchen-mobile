import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';
import api from './lib/api';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

export default function PersonalInfoScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateUserData } = useUser();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/me');
        const user = res.data.user;
        setName(user.fullName);
        setEmail(user.email || '');
        setPhone(user.phoneNumber);
      } catch (err) {
        console.warn('Failed to load profile:', err);
        Alert.alert('Error', 'Could not load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await api.patch('/api/auth/profile', {
        fullName: name,
        email: email.trim() || undefined,
      });
      const updated = res.data.user;
      updateUserData({ name: updated.fullName, email: updated.email });
      Alert.alert('Success', 'Your personal information has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />

        <TopNav 
          title="Personal Info"
          leftIcon="arrow-back"
          onLeftPress={() => router.back()}
          isAbsolute={false} 
          isScrolled={true}
          showDivider={false}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(40) }]}>
          
          <View style={styles.headerSection}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Update Profile
            </Text>
            <Text style={[styles.subText, { color: colors.textMuted }]}>
              Ensure your details are up to date for smooth deliveries and communication.
            </Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Full Name
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F9F9F9', borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={scale(20)} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Email Address
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F9F9F9', borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={scale(20)} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Phone Number
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F9F9F9', borderColor: colors.border, opacity: 0.6 }]}>
                <Ionicons name="call-outline" size={scale(20)} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={phone}
                  editable={false}
                  placeholderTextColor={colors.textMuted}
                />
                <Ionicons name="lock-closed" size={scale(16)} color={colors.textMuted} />
              </View>
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
                Phone number cannot be changed. Contact support if you need to update it.
              </Text>
            </View>

          </View>

        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + scale(20), backgroundColor: isDark ? colors.surface : '#FFF', borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: isSaving ? 0.7 : 1 }]} 
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: scale(20), paddingHorizontal: scale(20) },
  headerSection: { marginBottom: scale(25), paddingHorizontal: scale(5) },
  titleText: { fontSize: scale(24), fontWeight: 'bold', marginBottom: scale(8) },
  subText: { fontSize: scale(14), lineHeight: scale(22) },
  formContainer: { borderWidth: 1, borderRadius: scale(25), padding: scale(20), marginBottom: scale(30), elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.05, shadowRadius: scale(5) },
  inputGroup: { marginBottom: scale(20) },
  inputLabel: { fontSize: scale(13), fontWeight: 'bold', marginBottom: scale(8), marginLeft: scale(5), letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: scale(15), paddingHorizontal: scale(15), height: scale(54) },
  inputIcon: { marginRight: scale(10) },
  textInput: { flex: 1, fontSize: scale(15), fontWeight: '500', height: '100%' },
  helperText: { fontSize: scale(12), marginTop: scale(6), marginLeft: scale(5) },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: scale(20), paddingTop: scale(15), borderTopLeftRadius: scale(30), borderTopRightRadius: scale(30), borderTopWidth: 1, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: scale(-5) }, shadowOpacity: 0.1, shadowRadius: scale(10) },
  saveBtn: { paddingVertical: scale(18), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: scale(4) }, shadowOpacity: 0.3, shadowRadius: scale(5) },
  saveBtnText: { color: '#FFF', fontSize: scale(16), fontWeight: 'bold' },
});