import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import TopNav from '../components/TopNav';
import api from './lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE
import HomeIcon from '../components/HomeIcon';

const DEVICE_PREFS_KEY = '@bwari_kitchen_device_prefs';

interface ServerPrefs {
  notifyOrderUpdates: boolean;
  notifyDeliveryAlerts: boolean;
  notifyPromotions: boolean;
  notifyNewMenu: boolean;
  notifyEmail: boolean;
}

interface DevicePrefs {
  sound: boolean;
  vibration: boolean;
}

export default function NotificationPreferencesScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();

  const [serverPrefs, setServerPrefs] = useState<ServerPrefs>({
    notifyOrderUpdates: true,
    notifyDeliveryAlerts: true,
    notifyPromotions: false,
    notifyNewMenu: true,
    notifyEmail: true,
  });
  const [devicePrefs, setDevicePrefs] = useState<DevicePrefs>({ sound: true, vibration: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/notifications/preferences');
        setServerPrefs(res.data.preferences);
      } catch (err) {
        console.warn('Failed to load preferences:', err);
      }
      try {
        const saved = await AsyncStorage.getItem(DEVICE_PREFS_KEY);
        if (saved) setDevicePrefs(JSON.parse(saved));
      } catch (err) {
        console.warn('Failed to load device preferences:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleServerPref = async (key: keyof ServerPrefs) => {
    const updated = { ...serverPrefs, [key]: !serverPrefs[key] };
    setServerPrefs(updated);
    try {
      await api.patch('/api/notifications/preferences', { [key]: updated[key] });
    } catch (err) {
      console.warn('Failed to update preference:', err);
      setServerPrefs(serverPrefs); // revert on failure
    }
  };

  const toggleDevicePref = async (key: keyof DevicePrefs) => {
    const updated = { ...devicePrefs, [key]: !devicePrefs[key] };
    setDevicePrefs(updated);
    await AsyncStorage.setItem(DEVICE_PREFS_KEY, JSON.stringify(updated));
  };

  const renderServerToggleRow = (title: string, description: string, key: keyof ServerPrefs, icon: string) => (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
        <Ionicons name={icon as any} size={scale(20)} color={Colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.prefTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.prefDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: 'rgba(211, 47, 47, 0.5)' }}
        thumbColor={serverPrefs[key] ? Colors.primary : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => toggleServerPref(key)}
        value={serverPrefs[key]}
      />
    </View>
  );

  const renderDeviceToggleRow = (title: string, description: string, key: keyof DevicePrefs, icon: string) => (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
        <Ionicons name={icon as any} size={scale(20)} color={Colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.prefTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.prefDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: 'rgba(211, 47, 47, 0.5)' }}
        thumbColor={devicePrefs[key] ? Colors.primary : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => toggleDevicePref(key)}
        value={devicePrefs[key]}
      />
    </View>
  );

  // if (loading) {
  //   return (
  //     <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
  //       <TopNav title="Notification Preferences" leftIcon="arrow-back" onLeftPress={() => router.back()} isAbsolute={false} isScrolled={true} />
  //       <ActivityIndicator color={Colors.primary} size="large" />
  //     </View>
  //   );
  // }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNav 
        title="Notification Preferences"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <View style={styles.headerRight}>
            <HomeIcon onPress={() => router.push('/(tabs)')} />
          </View>
        }
        isAbsolute={false} 
        isScrolled={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORDERS & DELIVERY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderServerToggleRow("Order Updates", "Get notified when your order is accepted and prepared.", "notifyOrderUpdates", "restaurant-outline")}
          {renderServerToggleRow("Delivery Alerts", "Live tracking updates when your food is on the way.", "notifyDeliveryAlerts", "bicycle-outline")}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DISCOVERY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderServerToggleRow("Promotions & Offers", "Exclusive discounts, coupons, and flash sales.", "notifyPromotions", "pricetag-outline")}
          {renderServerToggleRow("New Menu Items", "Be the first to know when we add new dishes.", "notifyNewMenu", "sparkles-outline")}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COMMUNICATION CHANNELS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderServerToggleRow("Email Notifications", "Receive order receipts and important updates via email.", "notifyEmail", "mail-outline")}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SYSTEM</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderDeviceToggleRow("Sound", "Play a sound when a notification arrives.", "sound", "volume-high-outline")}
          {renderDeviceToggleRow("Vibration", "Vibrate phone for important alerts.", "vibration", "phone-portrait-outline")}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { 
    flexDirection: 'row', 
    gap: scale(10), 
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: scale(20), paddingTop: scale(10), paddingBottom: scale(40) },
  sectionTitle: { fontSize: scale(12), fontWeight: 'bold', marginBottom: scale(12), marginTop: scale(25), marginLeft: scale(5), letterSpacing: 1.5 },
  card: { borderRadius: scale(20), borderWidth: 1, overflow: 'hidden' },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(16), paddingHorizontal: scale(15), borderBottomWidth: StyleSheet.hairlineWidth },
  iconContainer: { width: scale(40), height: scale(40), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  textContainer: { flex: 1, paddingRight: scale(10) },
  prefTitle: { fontSize: scale(16), fontWeight: '600', marginBottom: scale(4) },
  prefDescription: { fontSize: scale(12), lineHeight: scale(18) },
});