import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE
// import { Colors } from '../constants/Colors';

export default function HomeIcon({ color = '#FFF', size = scale(26), onPress }: any) {

  return (
    <TouchableOpacity style={styles.iconWrapper} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name="home-outline" size={size} color={color} />
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
});