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
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

export default function SetupAddressScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('Bwari'); // Defaulting to Bwari based on app name!
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [addressType, setAddressType] = useState<'home' | 'office'>('home');
  const [isLoading, setIsLoading] = useState(false);

  // Basic validation: Just ensure they entered a street address
  const isValid = addressLine1.trim().length > 5;

  const handleSaveAddress = () => {
    if (!isValid) return;
    
    setIsLoading(true);
    
    // Simulate Backend API Call saving the address
    setTimeout(() => {
      setIsLoading(false);
      // Route straight to the main app (PIN setup removed)
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleSkip = () => {
    // Let users skip and add it later in the app if they are in a hurry
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(40) }]}
        >
          {/* Icon Header */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="location" size={scale(40)} color={Colors.primary} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Where should we deliver?</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Set your primary delivery address so we can show you the fastest delivery times.
          </Text>

          {/* Address Type Selectors */}
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[
                styles.typeBtn, 
                { 
                  backgroundColor: addressType === 'home' ? Colors.primary : colors.surface,
                  borderColor: addressType === 'home' ? Colors.primary : colors.border
                }
              ]}
              onPress={() => setAddressType('home')}
              activeOpacity={0.7}
            >
              <Ionicons name="home" size={scale(20)} color={addressType === 'home' ? '#FFF' : colors.text} />
              <Text style={[styles.typeText, { color: addressType === 'home' ? '#FFF' : colors.text }]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.typeBtn, 
                { 
                  backgroundColor: addressType === 'office' ? Colors.primary : colors.surface,
                  borderColor: addressType === 'office' ? Colors.primary : colors.border
                }
              ]}
              onPress={() => setAddressType('office')}
              activeOpacity={0.7}
            >
              <Ionicons name="briefcase" size={scale(20)} color={addressType === 'office' ? '#FFF' : colors.text} />
              <Text style={[styles.typeText, { color: addressType === 'office' ? '#FFF' : colors.text }]}>Office</Text>
            </TouchableOpacity>
          </View>

          {/* FORM FIELDS */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Street Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
              <Ionicons name="map-outline" size={scale(20)} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="e.g. 15 Law School Road"
                placeholderTextColor={colors.textMuted}
                value={addressLine1}
                onChangeText={setAddressLine1}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>City / Area</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={scale(20)} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Delivery Instructions (Optional)</Text>
            <View style={[styles.textAreaWrapper, { backgroundColor: isDark ? colors.surface : '#FFF', borderColor: colors.border }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="e.g. Leave at the front desk, ring the bell upon arrival..."
                placeholderTextColor={colors.textMuted}
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity 
            style={[
              styles.primaryBtn, 
              { backgroundColor: !isValid ? colors.border : Colors.primary }
            ]} 
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
            onPress={handleSaveAddress}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[
                styles.primaryBtnText, 
                { color: !isValid ? colors.textMuted : '#FFF' }
              ]}>
                Save & Continue
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    paddingBottom: scale(10),
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
  skipText: {
    fontSize: scale(16),
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: scale(25),
    paddingTop: scale(10),
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
  },
  iconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scale(26),
    fontWeight: 'bold',
    marginBottom: scale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scale(15),
    lineHeight: scale(22),
    textAlign: 'center',
    marginBottom: scale(30),
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(25),
    gap: scale(15),
  },
  typeBtn: {
    flex: 1,
    height: scale(50),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: scale(15),
    gap: scale(8),
  },
  typeText: {
    fontSize: scale(16),
    fontWeight: 'bold',
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
    borderRadius: scale(15),
    paddingHorizontal: scale(15),
    height: scale(56),
  },
  inputIcon: {
    marginRight: scale(10),
  },
  textInput: {
    flex: 1,
    fontSize: scale(15),
    height: '100%',
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: scale(15),
    paddingHorizontal: scale(15),
    paddingTop: scale(15),
    height: scale(100),
  },
  textArea: {
    flex: 1,
    fontSize: scale(15),
  },
  primaryBtn: {
    height: scale(56),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(5),
    marginTop: scale(20),
    marginBottom: scale(10),
  },
  primaryBtnText: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
});