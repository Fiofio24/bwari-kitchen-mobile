import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import TopNav from '../components/TopNav';

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // State for preference toggles
  const [prefs, setPrefs] = useState({
    orderUpdates: true,
    deliveryAlerts: true,
    promotions: false,
    newMenu: true,
    emailNotifications: true, // <-- Added Email preference for the backend
    sound: true,
    vibration: true,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderToggleRow = (title: string, description: string, key: keyof typeof prefs, icon: string) => (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.prefTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.prefDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: 'rgba(211, 47, 47, 0.5)' }}
        thumbColor={prefs[key] ? Colors.primary : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => togglePref(key)}
        value={prefs[key]}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNav 
        title="Notification Preferences"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION: ORDERS & DELIVERY */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          ORDERS & DELIVERY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderToggleRow("Order Updates", "Get notified when your order is accepted and prepared.", "orderUpdates", "restaurant-outline")}
          {renderToggleRow("Delivery Alerts", "Live tracking updates when your food is on the way.", "deliveryAlerts", "bicycle-outline")}
        </View>

        {/* SECTION: DISCOVERY */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          DISCOVERY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderToggleRow("Promotions & Offers", "Exclusive discounts, coupons, and flash sales.", "promotions", "pricetag-outline")}
          {renderToggleRow("New Menu Items", "Be the first to know when we add new dishes.", "newMenu", "sparkles-outline")}
        </View>

        {/* SECTION: COMMUNICATION CHANNELS */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          COMMUNICATION CHANNELS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderToggleRow("Email Notifications", "Receive order receipts and important updates via email.", "emailNotifications", "mail-outline")}
        </View>

        {/* SECTION: SYSTEM */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          SYSTEM
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderToggleRow("Sound", "Play a sound when a notification arrives.", "sound", "volume-high-outline")}
          {renderToggleRow("Vibration", "Vibrate phone for important alerts.", "vibration", "phone-portrait-outline")}
        </View>

      </ScrollView>
    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 25,
    marginLeft: 5,
    letterSpacing: 1.5,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  prefTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  prefDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
});