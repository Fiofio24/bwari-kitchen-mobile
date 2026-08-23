import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Switch, 
  Share, 
  Image, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext'; 
import { useAddresses } from '../../context/AddressContext'; 
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import Sidebar from '../../components/Sidebar';
import { useSafeRouter } from '../../hooks/useSafeRouter'; 
import TopNav from '../../components/TopNav';
import * as SecureStore from 'expo-secure-store';
import ActionModal from '../../components/ActionModal';
import { scale } from '../../constants/Sizes'; 
import api from '../../app/lib/api';

export default function ProfileScreen() {
  const { colors, isDark, setThemeMode } = useTheme();
  const { userData, updateAvatar, resetToDefault } = useUser(); 
  const { setActiveAddress } = useAddresses() as any; 
  const router = useSafeRouter(); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);
  
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);

  const userStats = { points: 450, referralCode: "BWARI-SERIFF-99" };

  // FIX: useFocusEffect ensures the number updates every time you open the profile tab!
  useFocusEffect(
    useCallback(() => {
      const fetchOrdersCount = async () => {
        try {
          // Fetch a larger list to accurately count history
          const res = await api.get('/api/orders?limit=100'); 
          const ordersList = res.data.orders || [];
          
          // Filter out pending, cancelled, and refunded orders
          const completedOrders = ordersList.filter((order: any) => {
            const status = order.status?.toLowerCase() || '';
            return !['pending', 'cancelled', 'refunded'].includes(status);
          });

          setTotalOrders(completedOrders.length);
        } catch (e) {
          console.warn('Failed to load order count', e);
        }
      };
      
      fetchOrdersCount();
    }, [])
  );

  const onShareReferral = async () => {
    try {
      await Share.share({
        message: `Use my code ${userStats.referralCode} to get ₦1,000 off your first meal at Bwari Kitchen! 🥘`,
      });
    } catch (error) { 
      console.warn(error); 
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      if (Platform.OS === 'web') {
        window.alert("You've refused to allow this app to access your photos!");
      } else {
        Alert.alert("Permission Required", "You need to allow access to your photos to change your avatar.");
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.5,   
    });

    if (!result.canceled) {
      updateAvatar(result.assets[0].uri); 
    }
  };

  const ProfileMenuItem = ({ icon, label, subLabel, onPress, isDestructive, rightElement }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomColor: colors.border }]} 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: isDestructive ? '#FFEBEE' : (isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5') }]}>
        <Ionicons name={icon} size={scale(22)} color={isDestructive ? '#D32F2F' : colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, { color: isDestructive ? '#D32F2F' : colors.text }]}>
          {label}
        </Text>
        {subLabel && (
          <Text style={[styles.menuSubLabel, { color: colors.textMuted }]}>
            {subLabel}
          </Text>
        )}
      </View>
      {rightElement ? rightElement : <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Account"
        leftIcon="menu-outline"
        onLeftPress={() => setIsSidebarOpen(true)}
        rightComponent={
          <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
            <Ionicons name="settings-outline" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
        }
        isAbsolute={false} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: scale(140) }]}>
        
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
              <View style={[styles.avatarInner, { backgroundColor: colors.border }]}>
                {userData.avatarUri ? (
                  <Image source={{ uri: userData.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={scale(40)} color={colors.primary} />
                )}
              </View>
              <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={handlePickImage}>
                <Ionicons name="camera" size={scale(14)} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{userData.name}</Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>{userData.email}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}
              onPress={() => router.push('/my-orders')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>{totalOrders}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Orders</Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{userStats.points}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Loyalty Points</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.referralCard, 
            { backgroundColor: isDark ? colors.surface : '#FFF9E6', borderColor: '#FFD700' }
          ]} 
          activeOpacity={0.9} 
          onPress={onShareReferral}
        >
          <View style={styles.referralIconBox}>
            <Ionicons name="gift" size={scale(30)} color="#FFD700" />
          </View>
          <View style={styles.referralTextContainer}>
            <Text style={[styles.referralTitle, { color: colors.text }]}>
              Refer & Earn ₦1,000
            </Text>
            <Text style={[styles.referralSub, { color: colors.textMuted }]}>
              Invite friends to get free meals!
            </Text>
          </View>
          <Ionicons name="share-social-outline" size={scale(24)} color={colors.primary} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT SETTINGS</Text>
        <View style={[styles.menuBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProfileMenuItem 
            icon="person-outline" 
            label="Personal Information" 
            onPress={() => router.push('/personal-info')} 
          />
          <ProfileMenuItem 
            icon="location-outline" 
            label="Saved Addresses" 
            onPress={() => router.push('/saved-addresses')} 
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SECURITY & APP</Text>
        <View style={[styles.menuBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProfileMenuItem 
            icon={isDark ? "moon" : "sunny-outline"} 
            label="Dark Mode" 
            rightElement={<Switch value={isDark} onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')} trackColor={{ false: '#767577', true: colors.primary }} />} 
          />
          <ProfileMenuItem 
            icon="notifications-outline" 
            label="Notification Preferences" 
            onPress={() => router.push('/notification-preferences')} 
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPPORT & LEGAL</Text>
        <View style={[styles.menuBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProfileMenuItem 
            icon="help-buoy-outline" 
            label="Help Center" 
            onPress={() => router.push('/help')} 
          />
          <ProfileMenuItem 
            icon="document-text-outline" 
            label="Terms & Conditions" 
          />
          <ProfileMenuItem 
            icon="trash-outline" 
            label="Delete Account" 
            isDestructive={true} 
            onPress={() => setIsDeleteModalVisible(true)}
          />
          <ProfileMenuItem 
            icon="log-out-outline" 
            label="Sign Out" 
            isDestructive={true} 
            onPress={() => setIsSignOutModalVisible(true)}
          />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: colors.border }]}>
            <Ionicons name="logo-instagram" size={scale(20)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: colors.border }]}>
            <Ionicons name="logo-twitter" size={scale(20)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 2.4.0 (Build 102)</Text>
      </ScrollView>

      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <ActionModal 
        visible={isSignOutModalVisible} 
        onClose={() => setIsSignOutModalVisible(false)} 
        onConfirm={async () => {
          setIsSignOutModalVisible(false);
          await SecureStore.deleteItemAsync('authToken'); 
          resetToDefault(); 
          if (setActiveAddress) setActiveAddress(null); 
          router.replace('/welcome'); 
        }} 
        title="Sign Out"
        message="Are you sure you want to sign out of Bwari Kitchen?"
        iconName="log-out-outline"
        confirmText="Sign Out"
        cancelText="Cancel"
      />

      <ActionModal 
        visible={isDeleteModalVisible} 
        onClose={() => setIsDeleteModalVisible(false)} 
        onConfirm={async () => {
          setIsDeleteModalVisible(false);
          await SecureStore.deleteItemAsync('authToken'); 
          resetToDefault(); 
          if (setActiveAddress) setActiveAddress(null); 
          router.replace('/welcome'); 
        }} 
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone."
        iconName="trash-outline"
        confirmText="Delete"
        cancelText="Cancel"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  iconButton: { 
    padding: scale(5),
  },
  scrollContent: { 
    paddingTop: scale(20),
  },
  profileCard: { 
    marginHorizontal: scale(20), 
    borderRadius: scale(25), 
    borderWidth: 1, 
    padding: scale(20), 
    marginBottom: scale(20), 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: scale(4) }, 
    shadowOpacity: 0.1, 
    shadowRadius: scale(10),
  },
  profileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scale(20),
  },
  avatarContainer: { 
    width: scale(80), 
    height: scale(80), 
    borderRadius: scale(40), 
    borderWidth: scale(3), 
    padding: scale(3),
  },
  avatarInner: { 
    flex: 1, 
    borderRadius: scale(40), 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: Colors.primary, 
    width: scale(26), 
    height: scale(26), 
    borderRadius: scale(13), 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: scale(2), 
    borderColor: '#FFF',
    zIndex: 5,
  },
  userInfo: { 
    marginLeft: scale(15), 
    flex: 1,
  },
  userName: { 
    fontSize: scale(20), 
    fontWeight: 'bold',
  },
  userEmail: { 
    fontSize: scale(14), 
    marginTop: scale(2),
  },
  statsRow: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(150,150,150,0.1)', 
    paddingTop: scale(15),
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center',
  },
  statValue: { 
    fontSize: scale(16), 
    fontWeight: 'bold',
  },
  statLabel: { 
    fontSize: scale(12), 
    marginTop: scale(2),
  },
  referralCard: { 
    marginHorizontal: scale(20), 
    padding: scale(15), 
    borderRadius: scale(20), 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scale(25),
  },
  referralIconBox: { 
    width: scale(50), 
    height: scale(50), 
    borderRadius: scale(25), 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: scale(15), 
    elevation: 2,
  },
  referralTextContainer: { 
    flex: 1,
  },
  referralTitle: { 
    fontSize: scale(16), 
    fontWeight: 'bold',
  },
  referralSub: { 
    fontSize: scale(12),
  },
  sectionTitle: { 
    fontSize: scale(12), 
    fontWeight: 'bold', 
    marginHorizontal: scale(25), 
    marginBottom: scale(10), 
    letterSpacing: 1,
  },
  menuBox: { 
    marginHorizontal: scale(20), 
    borderRadius: scale(25), 
    borderWidth: 1, 
    marginBottom: scale(25), 
    overflow: 'hidden',
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: scale(15), 
    borderBottomWidth: 1,
  },
  iconBox: { 
    width: scale(40), 
    height: scale(40), 
    borderRadius: scale(12), 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: scale(15),
  },
  menuTextContainer: { 
    flex: 1,
  },
  menuLabel: { 
    fontSize: scale(16), 
    fontWeight: '600',
  },
  menuSubLabel: { 
    fontSize: scale(12), 
    marginTop: scale(2),
  },
  socialRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: scale(15), 
    marginBottom: scale(20),
  },
  socialIcon: { 
    width: scale(40), 
    height: scale(40), 
    borderRadius: scale(20), 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  versionText: { 
    textAlign: 'center', 
    fontSize: scale(11), 
    marginBottom: scale(30),
  },
});