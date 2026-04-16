// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering another fresh build to resolve module resolution errors (cache bust - help page linked v2).
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
import { useRouter } from 'expo-router'; 

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface SidebarProps { 
  visible: boolean; 
  onClose: () => void; 
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const [isRendering, setIsRendering] = useState(visible);
  
  const { colors, mode, setThemeMode, isDark } = useTheme();
  const { userData } = useUser(); 
  const insets = useSafeAreaInsets();
  const router = useRouter(); 
  
  const safeTop = Platform.OS === 'web' ? 50 : insets.top + 20;

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

  const menuItems = [
    { name: 'Account & Settings', icon: 'person-outline', route: '/profile' },
    { name: 'My Orders', icon: 'bag-handle-outline', route: '/my-orders' },
    { name: 'Saved Addresses', icon: 'location-outline', route: null },
    { name: 'Payment Methods', icon: 'card-outline', route: null },
    { name: 'Offers & Promo', icon: 'pricetag-outline', route: '/promo', badge: 'NEW' },
    { name: 'Help & Support', icon: 'chatbubbles-outline', route: '/help' },
  ];

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
            colors={[colors.primary, '#B71C1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: safeTop }]}
          >
            <View style={styles.profileInfo}>
              <View style={styles.profileCircle}>
                {userData.avatarUri ? (
                   <Image source={{ uri: userData.avatarUri }} style={styles.avatarImage} />
                ) : (
                   <Ionicons name="person" size={30} color={colors.primary} />
                )}
              </View>
              
              <View>
                <Text style={styles.userName}>{userData.name}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{userData.email}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { top: safeTop - 10 }]}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                  <Ionicons 
                    name="phone-portrait-outline" 
                    size={20} 
                    color={mode === 'system' ? '#FFF' : colors.text} 
                  />
                  <Text style={[styles.themeBtnText, { color: mode === 'system' ? '#FFF' : colors.text }]}>
                    System
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'light' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('light')}
                >
                  <Ionicons 
                    name="sunny-outline" 
                    size={20} 
                    color={mode === 'light' ? '#FFF' : colors.text} 
                  />
                  <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : colors.text }]}>
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.themeBtn, 
                    mode === 'dark' && { backgroundColor: colors.primary }
                  ]} 
                  onPress={() => setThemeMode('dark')}
                >
                  <Ionicons 
                    name="moon-outline" 
                    size={20} 
                    color={mode === 'dark' ? '#FFF' : colors.text} 
                  />
                  <Text style={[styles.themeBtnText, { color: mode === 'dark' ? '#FFF' : colors.text }]}>
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.menuItemsContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.menuItem, { borderBottomColor: colors.border }]} 
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    if (item.route) {
                      router.push(item.route as any);
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
          
          <View style={[styles.logoutWrapper, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
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
    paddingBottom: 35, 
    paddingHorizontal: 20,
    borderBottomRightRadius: 40,
  },
  profileInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  profileCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FFF', 
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
  userName: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold',
  },
  userEmail: { 
    color: '#FFCCCC', 
    fontSize: 14, 
    marginTop: 2,
    maxWidth: 150,
  },
  closeBtn: { 
    position: 'absolute', 
    right: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    padding: 5, 
    borderRadius: 15,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  themeSection: { 
    paddingTop: 30, 
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
    marginRight: 10,
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
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