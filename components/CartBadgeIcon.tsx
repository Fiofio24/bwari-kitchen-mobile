// Note: This file requires an Expo/React Native environment to compile correctly.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { Colors } from '../constants/Colors';

interface CartBadgeIconProps {
  color?: string;
  size?: number;
  onPress: () => void;
}

export default function CartBadgeIcon({ color = '#FFF', size = 26, onPress }: CartBadgeIconProps) {
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
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF', // White background to match notification badge
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: Colors.primary, // Primary color text
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});