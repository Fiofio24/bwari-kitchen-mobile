import React, { useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext'; 
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import Sidebar from '../../components/Sidebar';
import { useRouter } from 'expo-router'; 
import TopNav from '../../components/TopNav';

export default function ProfileScreen() {
  const { colors, isDark, setThemeMode } = useTheme();
  const { userData, updateAvatar } = useUser(); 
  const router = useRouter(); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);

  const userStats = { ordersCount: 24, points: 450, referralCode: "BWARI-SERIFF-99" };

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
        <Ionicons name={icon} size={22} color={isDestructive ? '#D32F2F' : colors.primary} />
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
      {rightElement ? rightElement : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
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
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        }
        isAbsolute={false} 
        isScrolled={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}>
        
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
              <View style={[styles.avatarInner, { backgroundColor: colors.border }]}>
                {userData.avatarUri ? (
                  <Image source={{ uri: userData.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={colors.primary} />
                )}
              </View>
              <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={handlePickImage}>
                <Ionicons name="camera" size={14} color="#FFF" />
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
              <Text style={[styles.statValue, { color: colors.text }]}>{userStats.ordersCount}</Text>
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
            <Ionicons name="gift" size={30} color="#FFD700" />
          </View>
          <View style={styles.referralTextContainer}>
            <Text style={[styles.referralTitle, { color: colors.text }]}>
              Refer & Earn ₦1,000
            </Text>
            <Text style={[styles.referralSub, { color: colors.textMuted }]}>
              Invite friends to get free meals!
            </Text>
          </View>
          <Ionicons name="share-social-outline" size={24} color={colors.primary} />
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
          <ProfileMenuItem 
            icon="card-outline" 
            label="Payment Methods" 
            subLabel="Manage cards" 
            onPress={() => router.push('/payment-methods')} 
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
            icon="finger-print-outline" 
            label="Biometric Login" 
            rightElement={<Switch value={isBiometricEnabled} onValueChange={setIsBiometricEnabled} trackColor={{ false: '#767577', true: colors.primary }} />} 
          />
          <ProfileMenuItem 
            icon="notifications-outline" 
            label="Notification Preferences" 
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
        </View>
        <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 2.4.0 (Build 102)</Text>
      </ScrollView>
      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  iconButton: { 
    padding: 5,
  },
  scrollContent: { 
    paddingTop: 20,
  },
  profileCard: { 
    marginHorizontal: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { 
      width: 0, 
      height: 4 
    }, 
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
    width: 26, 
    height: 26, 
    borderRadius: 13, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#FFF',
    zIndex: 5,
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