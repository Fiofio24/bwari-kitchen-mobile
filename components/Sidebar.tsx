import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- Imported safe area hook

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [showModal, setShowModal] = useState(visible);
  
  const { colors, mode, setThemeMode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Dynamic top spacing
  const safeTop = Platform.OS === 'web' ? 50 : insets.top + 20;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 300, useNativeDriver: true })
      .start(() => setShowModal(false));
    }
  }, [visible, slideAnim]);

  const menuItems = [
    { name: 'Profile', icon: 'person-outline' },
    { name: 'My Orders', icon: 'receipt-outline' },
    { name: 'Offers & Promo', icon: 'pricetag-outline' },
    { name: 'Privacy Policy', icon: 'shield-checkmark-outline' },
    { name: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <Modal visible={showModal} transparent={true} animationType="none">
      <View style={styles.overlay}>
        
        <TouchableWithoutFeedback onPress={onClose}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sidebarContainer, { backgroundColor: colors.background, transform: [{ translateX: slideAnim }] }]}>
          
          {/* Apply dynamic paddingTop here! */}
          <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: safeTop }]}>
            <View style={styles.profileInfo}>
              <View style={styles.profileCircle}>
                <Ionicons name="person" size={30} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.userName}>User</Text>
                <Text style={styles.userEmail}>No 6 Kuje Street...</Text>
              </View>
            </View>
            
            {/* Apply dynamic top positioning for the close button here! */}
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { top: safeTop - 10 }]}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.themeSection}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
            <View style={styles.themeRow}>
              
              <TouchableOpacity style={[styles.themeBtn, mode === 'system' && { backgroundColor: colors.primary }]} onPress={() => setThemeMode('system')}>
                <Ionicons name="phone-portrait-outline" size={20} color={mode === 'system' ? '#FFF' : colors.text} />
                <Text style={[styles.themeBtnText, { color: mode === 'system' ? '#FFF' : colors.text }]}>System</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.themeBtn, mode === 'light' && { backgroundColor: colors.primary }]} onPress={() => setThemeMode('light')}>
                <Ionicons name="sunny-outline" size={20} color={mode === 'light' ? '#FFF' : colors.text} />
                <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : colors.text }]}>Light</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.themeBtn, mode === 'dark' && { backgroundColor: colors.primary }]} onPress={() => setThemeMode('dark')}>
                <Ionicons name="moon-outline" size={20} color={mode === 'dark' ? '#FFF' : colors.text} />
                <Text style={[styles.themeBtnText, { color: mode === 'dark' ? '#FFF' : colors.text }]}>Dark</Text>
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.menuItemsContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.menuItem, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFEEEE' }]}>
                  <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={22} color="#FFF" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

// Compact styling with fixed tops removed!
const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  sidebarContainer: { width: SIDEBAR_WIDTH, height: '100%', borderTopRightRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  header: { paddingBottom: 30, paddingHorizontal: 20, borderBottomRightRadius: 30 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userName: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  userEmail: { color: '#FFCCCC', fontSize: 14, marginTop: 2 },
  closeBtn: { position: 'absolute', right: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15 },
  themeSection: { paddingTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(150, 150, 150, 0.1)', borderRadius: 20, padding: 5 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 15 },
  themeBtnText: { fontSize: 14, fontWeight: '600', marginLeft: 5 },
  menuItemsContainer: { paddingTop: 20, paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { fontSize: 16, fontWeight: '600' },
  chevron: { marginLeft: 'auto' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E53935', marginHorizontal: 20, marginTop: 'auto', marginBottom: 40, paddingVertical: 15, borderRadius: 25 },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});