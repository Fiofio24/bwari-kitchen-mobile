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
import api from '../app/lib/api'; 
import * as SecureStore from 'expo-secure-store';
import ActionModal from './ActionModal';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

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
  
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  
  const { colors, mode, setThemeMode, isDark } = useTheme();
  const { userData, resetToDefault } = useUser(); 
  const insets = useSafeAreaInsets();
  const router = useSafeRouter(); 
  
  const safeTop = Platform.OS === 'web' ? scale(50) : insets.top + scale(20);

  const profileToDisplay = profileOverride || userData;

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

  const defaultMenuItems: SidebarMenuItem[] = [
    { name: 'Account & Settings', icon: 'person-outline', route: '/profile' },
    { name: 'My Orders', icon: 'bag-handle-outline', route: '/my-orders', badge: activeOrderCount > 0 ? activeOrderCount.toString() : undefined },
    { name: 'Saved Addresses', icon: 'location-outline', route: '/saved-addresses' },
    { name: 'Offers & Promo', icon: 'pricetag-outline', route: '/promo', badge: 'NEW' },
    { name: 'Help & Support', icon: 'chatbubbles-outline', route: '/help' },
  ];

  const itemsToRender = menuItems || defaultMenuItems;

  const executeNavigation = (route: string) => {
    setIsRendering(false); 
    onClose(); 
    setTimeout(() => {
      router.push(route as any);
    }, 50);
  };

  const executeLogout = async () => {
    setIsSignOutModalVisible(false); 
    setIsRendering(false); 
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
            style={[styles.header, { paddingTop: safeTop + scale(10) }]}
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
              <Ionicons name="close" size={scale(26)} color="#FFF" />
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
                    <Ionicons name="person" size={scale(36)} color={colors.primary} />
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
                  <Ionicons name="phone-portrait-outline" size={scale(20)} color={mode === 'system' ? '#FFF' : colors.text} />
                  <Text style={[styles.themeBtnText, { color: mode === 'system' ? '#FFF' : colors.text }]}>System</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'light' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('light')}
                >
                  <Ionicons name="sunny-outline" size={scale(20)} color={mode === 'light' ? '#FFF' : colors.text} />
                  <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : colors.text }]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'dark' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('dark')}
                >
                  <Ionicons name="moon-outline" size={scale(20)} color={mode === 'dark' ? '#FFF' : colors.text} />
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
                    <Ionicons name={item.icon as any} size={scale(22)} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{item.name}</Text>
                  
                  {item.badge && (
                    <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}

                  <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} style={styles.chevron} />
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
              paddingBottom: insets.bottom > 0 ? insets.bottom + scale(10) : scale(25) 
            }
          ]}>
            <TouchableOpacity 
              style={styles.logoutBtn} 
              activeOpacity={0.8}
              onPress={() => setIsSignOutModalVisible(true)} 
            >
              <Ionicons name="log-out-outline" size={scale(22)} color="#D32F2F" />
              <Text style={styles.logoutText}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
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
    borderTopRightRadius: scale(30), 
    borderBottomRightRadius: scale(30), 
    overflow: 'hidden', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: scale(10),
  },
  header: { 
    paddingBottom: scale(25), 
    paddingHorizontal: scale(20),
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
    width: scale(85),
    height: scale(56),
    marginRight: scale(10),
    borderRadius: scale(8),
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTextMain: {
    color: '#FFF',
    fontSize: scale(28),
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: scale(-4),
  },
  brandTextSub: {
    color: '#FFF',
    fontSize: scale(13),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: { 
    padding: scale(5), 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scale(20),
  },
  bodyProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(25),
    borderBottomWidth: 1,
  },
  profileCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
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
    fontSize: scale(20),
    fontWeight: 'bold',
    marginBottom: scale(4),
  },
  bodyUserEmail: {
    fontSize: scale(14),
  },
  themeSection: { 
    paddingTop: scale(25), 
    paddingHorizontal: scale(20),
  },
  sectionTitle: { 
    fontSize: scale(12), 
    fontWeight: 'bold', 
    marginBottom: scale(15), 
    letterSpacing: 1,
  },
  themeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(150, 150, 150, 0.1)', 
    borderRadius: scale(20), 
    padding: scale(5),
  },
  themeBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: scale(10), 
    borderRadius: scale(15),
  },
  themeBtnText: { 
    fontSize: scale(14), 
    fontWeight: '600', 
    marginLeft: scale(5),
  },
  menuItemsContainer: { 
    paddingTop: scale(20), 
    paddingHorizontal: scale(20),
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: scale(15), 
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
  menuItemText: { 
    fontSize: scale(16), 
    fontWeight: '600',
  },
  badgeContainer: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(10),
    marginLeft: scale(10),
  },
  badgeText: {
    color: '#FFF',
    fontSize: scale(10),
    fontWeight: '900',
  },
  chevron: { 
    marginLeft: 'auto',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: scale(40),
    marginBottom: scale(20),
  },
  versionText: {
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  legalText: {
    fontSize: scale(10),
    marginTop: scale(4),
  },
  logoutWrapper: {
    paddingTop: scale(15),
    borderTopWidth: 1,
  },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(211, 47, 47, 0.1)', 
    marginHorizontal: scale(20), 
    paddingVertical: scale(15), 
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.3)',
  },
  logoutText: { 
    color: '#D32F2F', 
    fontWeight: 'bold', 
    fontSize: scale(16), 
    marginLeft: scale(10),
  },
});