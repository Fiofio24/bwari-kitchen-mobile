import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Animated, Easing, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface TopNavProps {
  address: string;
  onAddressChange: (newAddress: string) => void;
  cartCount: number;
  notificationCount: number;
  onOpenMenu: () => void; 
  isScrolled: boolean; 
}

export default function TopNav({ address, onAddressChange, cartCount, notificationCount, onOpenMenu, isScrolled }: TopNavProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [isVisible, setIsVisible] = useState(false);
  const [inputText, setInputText] = useState(address);
  
  // 1. THE FIX: Local state for an instant visual update!
  const [displayAddress, setDisplayAddress] = useState(address);

  // Keep local state synced if the parent changes it externally
  useEffect(() => {
    setDisplayAddress(address);
  }, [address]);

  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(500)).current; 
  
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;

  const shadowStyle = isScrolled 
    ? Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
        android: { elevation: 8 },
        web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)' } as any 
      })
    : Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
        web: { boxShadow: 'none' } as any
      });

  const openModal = () => {
    setIsVisible(true);
    slideAnim.setValue(500);
    fadeAnim.setValue(0);
    setInputText(displayAddress); // Reset input to current address when opening
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.poly(4)), useNativeDriver: true })
      ]).start();
    }, 50);
  };

  const closeModal = (onCloseComplete?: () => void) => {
    Keyboard.dismiss(); 
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 500, duration: 250, useNativeDriver: true })
    ]).start(() => {
      setIsVisible(false); 
      if (onCloseComplete) {
        // 2. THE FIX: A tiny 50ms buffer lets Android clear the Modal from memory 
        // completely before running the heavy parent state update. No more glitching!
        setTimeout(() => onCloseComplete(), 50);
      }
    });
  };

  const handleSaveAddress = () => {
    if (inputText.trim().length > 0) {
      setDisplayAddress(inputText); // INSTANT visual update in the header!
      closeModal(() => onAddressChange(inputText)); // Delayed parent update
    } else {
      closeModal();
    }
  };

  const handleSelectQuickAddress = (quickAddress: string) => {
    setInputText(quickAddress);
    setDisplayAddress(quickAddress); // INSTANT visual update in the header!
    closeModal(() => onAddressChange(quickAddress)); // Delayed parent update
  };

  return (
    <>
      <View style={[styles.topNavContainer, { paddingTop }, shadowStyle]}>
        
        <TouchableOpacity onPress={onOpenMenu} activeOpacity={0.7}>
          <Ionicons name="menu" size={32} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.locationContainer} onPress={openModal} activeOpacity={0.8}>
          <Text style={styles.deliverToText}>Deliver to</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={14} color="#FFC107" />
            {/* 3. Render the instantly-updating local state instead of the slow parent state */}
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
              {displayAddress.length > 18 ? displayAddress.substring(0, 18) + '...' : displayAddress}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#FFF" style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerIcons}>
          <View style={styles.iconWrapper}>
            <Ionicons name="cart-outline" size={26} color="#FFF" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          </View>
          <View style={[styles.iconWrapper, styles.bellIcon]}>
            <Ionicons name="notifications-outline" size={26} color="#FFF" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dividerWrapper}>
          <View style={styles.divider} />
        </View>
      </View>

      <Modal
        animationType="none" 
        transparent={true}
        visible={isVisible}
        onRequestClose={() => closeModal()}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={() => closeModal()}>
          <AnimatedBlurView 
            intensity={20} 
            tint="dark" 
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.2)' }]} 
          />
        </TouchableWithoutFeedback>

        <View style={styles.modalContentWrapper} pointerEvents="box-none">
          <Animated.View 
            style={[
              styles.modalSheet, 
              { 
                backgroundColor: colors.background, 
                paddingBottom: insets.bottom + 20,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delivery Address</Text>
              <TouchableOpacity onPress={() => closeModal()}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <TextInput 
                style={[styles.input, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Enter new delivery address..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: Colors.primary }]} onPress={handleSaveAddress} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Confirm Location</Text>
            </TouchableOpacity>

            <Text style={[styles.savedTitle, { color: colors.textMuted }]}>Saved Addresses</Text>
            
            <TouchableOpacity style={[styles.quickAddressRow, { borderBottomColor: colors.border }]} onPress={() => handleSelectQuickAddress("Home: No 6 Kuje St")}>
              <Ionicons name="home" size={20} color={colors.textMuted} />
              <Text style={[styles.quickAddressText, { color: colors.text }]}>Home: No 6 Kuje St</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickAddressRow, { borderBottomColor: colors.border }]} onPress={() => handleSelectQuickAddress("Work: Central Business Dist")}>
              <Ionicons name="briefcase" size={20} color={colors.textMuted} />
              <Text style={[styles.quickAddressText, { color: colors.text }]}>Work: Central Business Dist</Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ... (Keep all your existing styles exactly the same!) ...
  topNavContainer: { 
    backgroundColor: Colors.primary, 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 15, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    zIndex: 10, 
  },
  locationContainer: { 
    alignItems: 'center', 
    maxWidth: '50%', 
  },
  deliverToText: { color: '#FFCCCC', fontSize: 12, },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, },
  addressText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, marginLeft: 4, },
  chevronIcon: { marginLeft: 4, },
  headerIcons: { flexDirection: 'row', alignItems: 'center', },
  iconWrapper: { position: 'relative', },
  bellIcon: { marginLeft: 15, },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FFFFFF', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', },
  dividerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', zIndex: 100, },
  divider: { width: '90%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.25)', },
  modalContentWrapper: { flex: 1, justifyContent: 'flex-end', },
  modalSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 25, minHeight: 350, },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, },
  modalTitle: { fontSize: 20, fontWeight: 'bold', },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, height: 55, marginBottom: 20, },
  input: { flex: 1, marginLeft: 10, fontSize: 16, },
  saveButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 30, },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', },
  savedTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, },
  quickAddressRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, },
  quickAddressText: { fontSize: 16, marginLeft: 15, },
});