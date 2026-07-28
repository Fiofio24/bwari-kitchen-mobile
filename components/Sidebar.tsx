import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback, 
  Platform, 
  Modal,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; 
import { LinearGradient } from 'expo-linear-gradient'; 
import { useTheme } from '../context/ThemeContext'; 
import { useUser } from '../context/UserContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useSafeRouter } from '../hooks/useSafeRouter'; 
import api from '../app/lib/api'; // <-- Imported API
import * as SecureStore from 'expo-secure-store';
import ActionModal from './ActionModal';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 
const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'];

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export interface SidebarMenuItem {
  name: string;
  icon: string;
  route?: string;
  badge?: string;
}

interface SidebarProps { 
  visible: boolean; 
  onClose: () => void; 
  menuItems?: SidebarMenuItem[]; 
  profileOverride?: {
    name: string;
    email: string;
    avatarUri?: string | null;
  }; 
}

export default function Sidebar({ visible, onClose, menuItems, profileOverride }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const [isRendering, setIsRendering] = useState(visible);
  
  // NEW: State for the Sign Out Modal
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  
  // NEW: State to hold the dynamic order count
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  
  const { colors, mode, setThemeMode, isDark } = useTheme();
  const { userData, resetToDefault } = useUser(); 
  const insets = useSafeAreaInsets();
  const router = useSafeRouter(); 
  
  const safeTop = Platform.OS === 'web' ? 50 : insets.top + 20;

  const profileToDisplay = profileOverride || userData;

  // NEW: Fetch active orders silently every time the sidebar opens
  useEffect(() => {
    if (visible) {
      const fetchActiveOrders = async () => {
        try {
          const res = await api.get('/api/orders?limit=20');
          const orders = res.data.orders || [];
          const count = orders.filter((o: any) => ACTIVE_STATUSES.includes(o.status)).length;
          setActiveOrderCount(count);
        } catch (err) {
          // Silent fail to preserve UX
        }
      };
      fetchActiveOrders();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      slideAnim.setValue(-SIDEBAR_WIDTH);
      fadeAnim.setValue(0);
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { 
            toValue: 0, 
            duration: 300, 
            useNativeDriver: true 
          }),
          Animated.timing(fadeAnim, { 
            toValue: 1, 
            duration: 300, 
            useNativeDriver: true 
          })
        ]).start();
      }, 50);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { 
          toValue: -SIDEBAR_WIDTH, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(fadeAnim, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        })
      ]).start(() => setIsRendering(false));
    }
  }, [visible, slideAnim, fadeAnim]);

  // NEW: Replaced the hardcoded '4' with our dynamic state
  const defaultMenuItems: SidebarMenuItem[] = [
    { name: 'Account & Settings', icon: 'person-outline', route: '/profile' },
    { name: 'My Orders', icon: 'bag-handle-outline', route: '/my-orders', badge: activeOrderCount > 0 ? activeOrderCount.toString() : undefined },
    { name: 'Saved Addresses', icon: 'location-outline', route: '/saved-addresses' },
    { name: 'Offers & Promo', icon: 'pricetag-outline', route: '/promo', badge: 'NEW' },
    { name: 'Help & Support', icon: 'chatbubbles-outline', route: '/help' },
  ];

  const itemsToRender = menuItems || defaultMenuItems;

  // NEW: Dedicated, bulletproof navigation handlers that instantly kill the Modal
  const executeNavigation = (route: string) => {
    setIsRendering(false); // Instantly vaporize the Modal!
    onClose(); // Update parent state
    
    // Wait just 50ms for React to clear the UI tree, then route safely
    setTimeout(() => {
      router.push(route as any);
    }, 50);
  };

  const executeLogout = async () => {
    setIsSignOutModalVisible(false); // Close the sign out modal
    setIsRendering(false); // Instantly vaporize the Sidebar!
    onClose();
    
    await SecureStore.deleteItemAsync('authToken');
    resetToDefault();
    
    setTimeout(() => {
      router.replace('/welcome');
    }, 50);
  };

  if (!isRendering) return null;

  return (
    <Modal 
      visible={isRendering} 
      transparent={true} 
      animationType="none" 
      onRequestClose={onClose} 
      statusBarTranslucent={true}
    >
      <View style={[StyleSheet.absoluteFill, styles.absoluteOverlay]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <AnimatedBlurView 
            intensity={20} 
            tint="dark" 
            experimentalBlurMethod="dimezisBlurView" 
            style={[
              StyleSheet.absoluteFill, 
              { 
                opacity: fadeAnim, 
                backgroundColor: 'rgba(0,0,0,0.4)' 
              }
            ]} 
          />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.sidebarContainer, 
            { 
              backgroundColor: colors.background, 
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: safeTop + 10 }]}
          >
            <View style={styles.brandContainer}>
              <Image 
                source={require('../assets/images/Icon&logo/BK_logo1-w.png')} 
                style={styles.brandLogo} 
                resizeMode="contain" 
              />
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTextMain}>BWARI</Text>
                <Text style={styles.brandTextSub}>KITCHEN®</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <TouchableOpacity
              onPress={() => {
                if (!profileOverride) {
                  executeNavigation('/profile');
                }
              }}
              activeOpacity={profileOverride ? 1 : 0.7}
            >
              <View style={[styles.bodyProfileSection, { borderBottomColor: colors.border }]}>
                <View style={[styles.profileCircle, { backgroundColor: isDark ? colors.surface : '#EAEAEC' }]}>
                  {profileToDisplay.avatarUri ? (
                    <Image source={{ uri: profileToDisplay.avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={36} color={colors.primary} />
                  )}
                </View>
                
                <View style={styles.bodyProfileText}>
                  <Text style={[styles.bodyUserName, { color: colors.text }]}>{profileToDisplay.name}</Text>
                  <Text style={[styles.bodyUserEmail, { color: colors.textMuted }]} numberOfLines={1}>{profileToDisplay.email}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.themeSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
              <View style={styles.themeRow}>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'system' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('system')}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color={mode === 'system' ? '#FFF' : colors.text} />
                  <Text style={[styles.themeBtnText, { color: mode === 'system' ? '#FFF' : colors.text }]}>System</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'light' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('light')}
                >
                  <Ionicons name="sunny-outline" size={20} color={mode === 'light' ? '#FFF' : colors.text} />
                  <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : colors.text }]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'dark' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('dark')}
                >
                  <Ionicons name="moon-outline" size={20} color={mode === 'dark' ? '#FFF' : colors.text} />
                  <Text style={[styles.themeBtnText, { color: mode === 'dark' ? '#FFF' : colors.text }]}>Dark</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.menuItemsContainer}>
              {itemsToRender.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.menuItem, { borderBottomColor: colors.border }]} 
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.route) {
                      executeNavigation(item.route);
                    } else {
                      onClose();
                    }
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFEEEE' }]}>
                    <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{item.name}</Text>
                  
                  {item.badge && (
                    <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}

                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.versionContainer}>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>Bwari Kitchen v2.4.0</Text>
              <Text style={[styles.legalText, { color: colors.textMuted }]}>© 2026 fioTecz Studio</Text>
            </View>
          </ScrollView>
          
          <View style={[
            styles.logoutWrapper, 
            { 
              borderTopColor: colors.border,
              // FIX: This ensures the button perfectly adapts to the device's navigation bar
              paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 25 
            }
          ]}>
            <TouchableOpacity 
              style={styles.logoutBtn} 
              activeOpacity={0.8}
              onPress={() => setIsSignOutModalVisible(true)} // NEW: Trigger custom modal
            >
              <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
              <Text style={styles.logoutText}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Render the confirmation modal on top of the Sidebar */}
        <ActionModal 
          visible={isSignOutModalVisible} 
          onClose={() => setIsSignOutModalVisible(false)} 
          onConfirm={executeLogout} 
          title="Sign Out"
          message="Are you sure you want to sign out of Bwari Kitchen?"
          iconName="log-out-outline"
          confirmText="Yes"
          cancelText="No"
        />

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  absoluteOverlay: { 
    zIndex: 1000, 
    elevation: 1000,
  },
  sidebarContainer: { 
    width: SIDEBAR_WIDTH, 
    height: '100%', 
    borderTopRightRadius: 30, 
    borderBottomRightRadius: 30, 
    overflow: 'hidden', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: 10,
  },
  header: { 
    paddingBottom: 25, 
    paddingHorizontal: 20,
    borderBottomRightRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 85,
    height: 56,
    marginRight: 10,
    borderRadius: 8,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTextMain: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: -4,
  },
  brandTextSub: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: { 
    padding: 5, 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  bodyProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
  },
  profileCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bodyProfileText: {
    flex: 1,
    justifyContent: 'center',
  },
  bodyUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bodyUserEmail: {
    fontSize: 14,
  },
  themeSection: { 
    paddingTop: 25, 
    paddingHorizontal: 20,
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    letterSpacing: 1,
  },
  themeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(150, 150, 150, 0.1)', 
    borderRadius: 20, 
    padding: 5,
  },
  themeBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    borderRadius: 15,
  },
  themeBtnText: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginLeft: 5,
  },
  menuItemsContainer: { 
    paddingTop: 20, 
    paddingHorizontal: 20,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
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
  menuItemText: { 
    fontSize: 16, 
    fontWeight: '600',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  chevron: { 
    marginLeft: 'auto',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  legalText: {
    fontSize: 10,
    marginTop: 4,
  },
  logoutWrapper: {
    paddingTop: 15,
    borderTopWidth: 1,
  },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(211, 47, 47, 0.1)', 
    marginHorizontal: 20, 
    paddingVertical: 15, 
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.3)',
  },
  logoutText: { 
    color: '#D32F2F', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 10,
  },
});