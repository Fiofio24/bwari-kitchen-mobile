import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, TextInput, TouchableWithoutFeedback, Animated, Easing, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const SAVED_ADDRESSES = [
  { id: '1', title: 'Home', address: 'No 6 Kuje St', icon: 'home' },
  { id: '2', title: 'Work', address: 'Central Business Dist', icon: 'briefcase' },
  { id: '3', title: 'School', address: 'Bwari Campus', icon: 'school' },
  { id: '4', title: 'Gym', address: 'Wuse Zone 5', icon: 'barbell' },
  { id: '5', title: 'Friend', address: 'Gwarinpa Estate', icon: 'people' },
];

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
  const router = useRouter(); 
  
  const [isVisible, setIsVisible] = useState(false);
  const [inputText, setInputText] = useState(''); 
  const [displayAddress, setDisplayAddress] = useState(address);

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
    setInputText(''); 
    
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
        setTimeout(() => onCloseComplete(), 50);
      }
    });
  };

  const handleSaveCustomAddress = () => {
    if (inputText.trim().length > 0) {
      setDisplayAddress(inputText); 
      closeModal(() => onAddressChange(inputText)); 
    }
  };

  const handleSelectAddress = (fullAddressText: string) => {
    setDisplayAddress(fullAddressText); 
    closeModal(() => onAddressChange(fullAddressText)); 
  };

  const handleManageAddresses = () => {
    closeModal(() => {
      console.log("Routing to /profile/addresses");
    });
  };

  const filteredAddresses = SAVED_ADDRESSES.filter(item => 
    item.title.toLowerCase().includes(inputText.toLowerCase()) || 
    item.address.toLowerCase().includes(inputText.toLowerCase())
  );

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
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
              {displayAddress}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#FFF" style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerIcons}>
          
          <TouchableOpacity 
            style={styles.iconWrapper} 
            activeOpacity={0.7} 
            onPress={() => {
              closeModal(); 
              router.push('/cart');
            }}
          >
            <Ionicons name="cart-outline" size={26} color="#FFF" />
            
            {/* THE FIX: Only render the badge if cartCount is greater than 0! */}
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
            
          </TouchableOpacity>

          <View style={[styles.iconWrapper, styles.bellIcon]}>
            <Ionicons name="notifications-outline" size={26} color="#FFF" />
            
            {/* You can do the same for notifications if you want! */}
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
            
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

        {/* THE NEW FEATURE: Floating Current Address Box */}
        <Animated.View 
          style={[
            styles.floatingAddressBox, 
            { 
              opacity: fadeAnim, 
              top: insets.top + 20, 
              backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
              borderColor: colors.border
            }
          ]}
          pointerEvents="none" // Ensures taps go right through it to close the modal!
        >
          <Text style={[styles.floatingLabel, { color: colors.textMuted }]}>Current Delivery Address</Text>
          <View style={styles.floatingAddressRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            {/* We use the RAW `address` prop here to show exactly what is currently active */}
            <Text style={[styles.floatingAddressText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {address}
            </Text>
          </View>
        </Animated.View>

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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Quick Settings</Text>
              <TouchableOpacity onPress={() => closeModal()}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput 
                style={[styles.input, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Search saved addresses..."
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
              />
              {inputText.length > 0 && filteredAddresses.length === 0 && (
                <TouchableOpacity onPress={handleSaveCustomAddress} style={styles.miniSaveBtn}>
                  <Text style={styles.miniSaveText}>Save Custom</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 250 }}>
              
              {inputText.length === 0 && (
                <TouchableOpacity style={styles.currentLocationBtn} onPress={() => handleSelectAddress("Current GPS Location")} activeOpacity={0.7}>
                  <Ionicons name="locate" size={22} color={Colors.primary} />
                  <Text style={[styles.currentLocationText, { color: Colors.primary }]}>Use Current Location</Text>
                </TouchableOpacity>
              )}

              {inputText.length === 0 && (
                <Text style={[styles.savedTitle, { color: colors.textMuted }]}>Saved Addresses</Text>
              )}

              {filteredAddresses.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.quickAddressRow, { borderBottomColor: colors.border }]} 
                  onPress={() => handleSelectAddress(`${item.title}: ${item.address}`)}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(150,150,150,0.1)' }]}>
                    <Ionicons name={item.icon as any} size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.addressTextStack}>
                    <Text style={[styles.quickAddressTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.quickAddressDetail, { color: colors.textMuted }]}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {inputText.length > 0 && filteredAddresses.length === 0 && (
                <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                  No saved addresses match &quot;{inputText}&quot;.
                </Text>
              )}
              
            </ScrollView>

            <TouchableOpacity style={[styles.manageBtn, { borderTopColor: colors.border }]} onPress={handleManageAddresses} activeOpacity={0.7}>
              <Text style={[styles.manageBtnText, { color: colors.text }]}>Manage Addresses</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topNavContainer: { backgroundColor: Colors.primary, position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, zIndex: 10, },
  locationContainer: { alignItems: 'center', maxWidth: '50%', },
  deliverToText: { color: '#FFCCCC', fontSize: 12, },
  addressRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 2, 
    maxWidth: '100%',
  },
  addressText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 14, 
    marginLeft: 4,
    flexShrink: 1, 
  },
  chevronIcon: { marginLeft: 4, },
  headerIcons: { flexDirection: 'row', alignItems: 'center', },
  iconWrapper: { position: 'relative', },
  bellIcon: { marginLeft: 15, },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FFFFFF', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', },
  dividerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', zIndex: 100, },
  divider: { width: '90%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.25)', },
  
  // Floating Address Box Styles
  floatingAddressBox: { position: 'absolute', alignSelf: 'center', width: '85%', padding: 15, borderRadius: 20, borderWidth: 1, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, zIndex: 50 },
  floatingLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  floatingAddressRow: { flexDirection: 'row', alignItems: 'center' },
  floatingAddressText: { fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
  
  modalContentWrapper: { flex: 1, justifyContent: 'flex-end', },
  modalSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 25, },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, },
  modalTitle: { fontSize: 20, fontWeight: 'bold', },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, height: 50, marginBottom: 15, },
  input: { flex: 1, marginLeft: 10, fontSize: 16, },
  miniSaveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 15, paddingVertical: 6, borderRadius: 10, },
  miniSaveText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  currentLocationBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 20, },
  currentLocationText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10, },
  
  savedTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, letterSpacing: 0.5 },
  quickAddressRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', },
  addressTextStack: { marginLeft: 15, justifyContent: 'center' },
  quickAddressTitle: { fontSize: 16, fontWeight: 'bold' },
  quickAddressDetail: { fontSize: 12, marginTop: 2 },
  
  noResultsText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  
  manageBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, marginTop: 5, borderTopWidth: 1, },
  manageBtnText: { fontSize: 16, fontWeight: 'bold' },
});