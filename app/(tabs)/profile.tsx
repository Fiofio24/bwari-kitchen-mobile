import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Platform, 
  Switch,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import Sidebar from '../../components/Sidebar';

const USER_DATA = {
  name: "Obansa Seriff",
  phone: "+234 812 345 6789",
  email: "seriff.dev@uplay.com",
  walletBalance: 12500,
  ordersCount: 24,
  points: 450,
  referralCode: "BWARI-SERIFF-99"
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const onShareReferral = async () => {
    try {
      await Share.share({
        message: `Use my code ${USER_DATA.referralCode} to get ₦1,000 off your first meal at Bwari Kitchen! 🥘`,
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const ProfileMenuItem = ({ icon, label, subLabel, onPress, isDestructive, rightElement }: any) => (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        { borderBottomColor: colors.border }
      ]} 
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[
        styles.iconBox, 
        { backgroundColor: isDestructive ? '#FFEBEE' : (isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5') }
      ]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isDestructive ? '#D32F2F' : colors.primary} 
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[
          styles.menuLabel, 
          { color: isDestructive ? '#D32F2F' : colors.text }
        ]}>
          {label}
        </Text>
        {subLabel && (
          <Text style={[
            styles.menuSubLabel, 
            { color: colors.textMuted }
          ]}>
            {subLabel}
          </Text>
        )}
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.background }
    ]}>
      <StatusBar style="light" />

      {/* HEADER WITH TRUE CENTERING */}
      <View style={[
        styles.header, 
        { paddingTop, paddingBottom }
      ]}>
        <TouchableOpacity 
          onPress={() => setIsSidebarOpen(true)} 
          style={[styles.iconButton, styles.sideIcon]}
        >
          <Ionicons name="menu-outline" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View 
          style={[
            styles.centerWrapper, 
            { top: paddingTop, bottom: paddingBottom }
          ]} 
          pointerEvents="none"
        >
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        <TouchableOpacity style={styles.sideIcon} onPress={() => {}}>
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: 140 }
        ]}
      >
        {/* USER INFO CARD */}
        <View style={[
          styles.profileCard, 
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}>
          <View style={styles.profileHeader}>
            <View style={[
              styles.avatarContainer, 
              { borderColor: colors.primary }
            ]}>
              <View style={[
                styles.avatarInner, 
                { backgroundColor: colors.border }
              ]}>
                <Ionicons name="person" size={40} color={colors.primary} />
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={[
                styles.userName, 
                { color: colors.text }
              ]}>
                {USER_DATA.name}
              </Text>
              <Text style={[
                styles.userEmail, 
                { color: colors.textMuted }
              ]}>
                {USER_DATA.email}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[
              styles.statItem, 
              { borderRightWidth: 1, borderRightColor: colors.border }
            ]}>
              <Text style={[
                styles.statValue, 
                { color: colors.text }
              ]}>
                {USER_DATA.ordersCount}
              </Text>
              <Text style={[
                styles.statLabel, 
                { color: colors.textMuted }
              ]}>
                Orders
              </Text>
            </View>
            <View style={[
              styles.statItem, 
              { borderRightWidth: 1, borderRightColor: colors.border }
            ]}>
              <Text style={[
                styles.statValue, 
                { color: colors.text }
              ]}>
                ₦{USER_DATA.walletBalance.toLocaleString()}
              </Text>
              <Text style={[
                styles.statLabel, 
                { color: colors.textMuted }
              ]}>
                Wallet
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue, 
                { color: colors.text }
              ]}>
                {USER_DATA.points}
              </Text>
              <Text style={[
                styles.statLabel, 
                { color: colors.textMuted }
              ]}>
                Points
              </Text>
            </View>
          </View>
        </View>

        {/* PROMOTIONAL SECTION (REFERRAL) */}
        <TouchableOpacity 
          style={[styles.referralCard, { backgroundColor: isDark ? colors.surface : '#FFF9E6', borderColor: '#FFD700' }]} 
          activeOpacity={0.9}
          onPress={onShareReferral}
        >
          <View style={styles.referralIconBox}>
            <Ionicons name="gift" size={30} color="#FFD700" />
          </View>
          <View style={styles.referralTextContainer}>
            <Text style={[styles.referralTitle, { color: colors.text }]}>Refer & Earn ₦1,000</Text>
            <Text style={[styles.referralSub, { color: colors.textMuted }]}>Invite friends to get free meals!</Text>
          </View>
          <Ionicons name="share-social-outline" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* ACCOUNT SETTINGS */}
        <Text style={[
          styles.sectionTitle, 
          { color: colors.textMuted }
        ]}>
          ACCOUNT SETTINGS
        </Text>
        <View style={[
          styles.menuBox, 
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}>
          <ProfileMenuItem 
            icon="person-outline" 
            label="Personal Information" 
          />
          <ProfileMenuItem 
            icon="wallet-outline" 
            label="Wallet & Vouchers" 
            subLabel="Check your active coupons"
          />
          <ProfileMenuItem 
            icon="location-outline" 
            label="Saved Addresses" 
          />
        </View>

        {/* SECURITY & PREFERENCES */}
        <Text style={[
          styles.sectionTitle, 
          { color: colors.textMuted }
        ]}>
          SECURITY & APP
        </Text>
        <View style={[
          styles.menuBox, 
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}>
          <ProfileMenuItem 
            icon={isDark ? "moon" : "sunny-outline"} 
            label="Dark Mode" 
            rightElement={
              <Switch 
                value={isDark} 
                onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            }
          />
          <ProfileMenuItem 
            icon="finger-print-outline" 
            label="Biometric Login" 
            rightElement={
              <Switch 
                value={isBiometricEnabled} 
                onValueChange={setIsBiometricEnabled}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            }
          />
          <ProfileMenuItem 
            icon="notifications-outline" 
            label="Notification Preferences" 
          />
        </View>

        {/* SUPPORT & LEGAL */}
        <Text style={[
          styles.sectionTitle, 
          { color: colors.textMuted }
        ]}>
          SUPPORT & LEGAL
        </Text>
        <View style={[
          styles.menuBox, 
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}>
          <ProfileMenuItem icon="help-buoy-outline" label="Help Center" />
          <ProfileMenuItem icon="document-text-outline" label="Terms & Conditions" />
          <ProfileMenuItem 
            icon="trash-outline" 
            label="Delete Account" 
            isDestructive={true} 
          />
          <ProfileMenuItem 
            icon="log-out-outline" 
            label="Sign Out" 
            isDestructive={true} 
          />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: colors.border }]}>
            <Ionicons name="logo-instagram" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: colors.border }]}>
            <Ionicons name="logo-twitter" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: colors.border }]}>
            <Ionicons name="logo-facebook" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Version 2.4.0 (Build 102)
        </Text>
      </ScrollView>

      <Sidebar 
        visible={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    backgroundColor: Colors.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    zIndex: 10 
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
    padding: 5 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  scrollContent: { 
    paddingTop: 20 
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    paddingTop: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  referralCard: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  referralIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
  },
  referralTextContainer: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  referralSub: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 25,
    marginBottom: 10,
    letterSpacing: 1,
  },
  menuBox: {
    marginHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 25,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 30,
  },
});