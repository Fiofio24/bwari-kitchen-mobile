import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../components/TopNav';
import { scale } from '../constants/Sizes'; 

export default function PrivacyPolicyScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Privacy Policy"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(40) }]}
      >
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
          Last Updated: August 2026
        </Text>

        <Text style={[styles.paragraph, { color: colors.text }]}>
          At Bwari Kitchen, we are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data when you use our mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={{ fontWeight: 'bold' }}>Personal Data:</Text> We collect information you provide directly, such as your name, email address, phone number, and delivery addresses.{"\n"}
          <Text style={{ fontWeight: 'bold' }}>Location Data:</Text> With your permission, we collect precise geolocation data to accurately deliver your orders.{"\n"}
          <Text style={{ fontWeight: 'bold' }}>Device Data:</Text> We may collect information about your device, including device ID, OS version, and push notification tokens.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. How We Use Your Data</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use your information to:{"\n"}
          • Process and deliver your food orders.{"\n"}
          • Communicate with you regarding order updates or support.{"\n"}
          • Improve our app&apos;s performance and user experience.{"\n"}
          • Send promotional offers (if you have opted-in via Notification Preferences).
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Data Sharing & Third Parties</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We do not sell your personal data. We may share necessary information with:{"\n"}
          • <Text style={{ fontWeight: 'bold' }}>Delivery Riders:</Text> To ensure they can locate you and drop off your food.{"\n"}
          • <Text style={{ fontWeight: 'bold' }}>Payment Processors:</Text> Gateways like Paystack require basic details to securely process your transactions.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Data Security</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, loss, or destruction. Passwords and PINs are securely hashed.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Your Privacy Rights</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You have the right to access, update, or delete your personal data. You can delete your account entirely from the &rdquo;Account Settings&rdquo; section in the app, which will permanently remove your data from our active databases.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: scale(20),
    paddingHorizontal: scale(25),
  },
  lastUpdated: {
    fontSize: scale(12),
    fontWeight: 'bold',
    marginBottom: scale(20),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    marginTop: scale(20),
    marginBottom: scale(10),
  },
  paragraph: {
    fontSize: scale(14),
    lineHeight: scale(22),
    marginBottom: scale(10),
    opacity: 0.9,
  }
});