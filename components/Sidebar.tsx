import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false); 
      });
    }
  }, [visible, slideAnim]); // <-- Added slideAnim here to clear the ESLint warning!

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
          <View style={styles.backgroundDim} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
          
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={styles.profileCircle}>
                <Ionicons name="person" size={30} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.userName}>User</Text>
                <Text style={styles.userEmail}>No 6 Kuje Street...</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItemsContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} activeOpacity={0.7}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.menuItemText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={styles.chevron} />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: Colors.background,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomRightRadius: 30,
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
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 5,
    borderRadius: 15,
  },
  menuItemsContainer: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  chevron: {
    marginLeft: 'auto',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});