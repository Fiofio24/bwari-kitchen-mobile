import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { Colors } from '../constants/Colors';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface CartBadgeIconProps {
  color?: string;
  size?: number;
  onPress: () => void;
}

export default function CartBadgeIcon({ color = '#FFF', size = scale(26), onPress }: CartBadgeIconProps) {
  const { cartItems } = useCart(); 
  
  // Safely count the total number of packages
  const count = cartItems?.length || 0;

  return (
    <TouchableOpacity style={styles.iconWrapper} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name="cart-outline" size={size} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
    padding: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: scale(-2),
    right: scale(-2),
    backgroundColor: '#FFFFFF', // White background to match notification badge
    borderRadius: scale(10),
    minWidth: scale(16),
    height: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: Colors.primary, // Primary color text
    fontSize: scale(10),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});