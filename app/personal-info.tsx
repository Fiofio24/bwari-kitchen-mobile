// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve module resolution errors (cache bust).
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userData, updateUserData } = useUser();
  
  const [name, setName] = useState(userData.name);
  const [email, setEmail] = useState(userData.email);
  const [phone, setPhone] = useState('+234 800 000 0000'); // Mock initial phone number
  const [isSaving, setIsSaving] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and Email cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call to save data
    setTimeout(() => {
      updateUserData({ name, email });
      setIsSaving(false);
      Alert.alert('Success', 'Your personal information has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />

        {/* HEADER */}
        <View style={[styles.header, { paddingTop, paddingBottom }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, styles.sideIcon]}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="none">
            <Text style={styles.headerTitle}>Personal Info</Text>
          </View>
          <View style={styles.sideIcon} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          
          <View style={styles.headerSection}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Update Profile
            </Text>
            <Text style={[styles.subText, { color: colors.textMuted }]}>
              Ensure your details are up to date for smooth deliveries and communication.
            </Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            {/* FULL NAME INPUT */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Full Name
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F9F9F9', borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Email Address
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F9F9F9', borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
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

            {/* PHONE INPUT */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Phone Number
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F9F9F9', borderColor: colors.border }]}>
                <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

          </View>

        </ScrollView>

        {/* BOTTOM SAVE BUTTON */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20, backgroundColor: isDark ? colors.surface : '#FFF', borderTopColor: colors.border }]}>
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

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  sideIcon: {
    zIndex: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: {
    padding: 5,
    marginLeft: -5,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    lineHeight: 22,
  },
  formContainer: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: -5 
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  saveBtn: {
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});