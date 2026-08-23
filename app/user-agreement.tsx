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

export default function UserAgreementScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="User Agreement"
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
          Welcome to Bwari Kitchen. By downloading, accessing, or using our mobile application, you agree to be bound by these Terms of Service (Agreement). Please read them carefully.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Account Registration</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You must create an account to place orders. You agree to provide accurate, complete, and current information during registration. You are responsible for maintaining the confidentiality of your account credentials, including your PIN and password.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Orders and Payments</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          All orders are subject to availability and acceptance by Bwari Kitchen. Prices are displayed in Nigerian Naira (₦) and include applicable taxes unless otherwise stated. Payment must be made securely through our approved gateways (e.g., Paystack, Bank Transfer). Cash on delivery is not supported.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Delivery & Fulfillment</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We strive to deliver orders within the estimated time frame, but external factors (traffic, weather) may cause delays. For security, riders may require a Delivery Code to hand over your food. You must ensure you are available at the provided delivery address to receive your order.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Cancellations and Refunds</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Orders can only be canceled while in the &rdquo;Pending&rdquo; status. Once food preparation begins, orders cannot be canceled or refunded. If you receive a wrong or severely damaged order, please contact Support within 30 minutes of delivery for a resolution.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. User Conduct</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You agree not to use the app for any fraudulent or unlawful purposes. Abuse of the promotion system, harassment of delivery riders, or repeated false claims may result in immediate suspension or deletion of your account.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Termination</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We reserve the right to suspend or terminate your access to the app at our sole discretion, without notice, for conduct that we believe violates this Agreement or is harmful to other users, our business, or third parties.
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