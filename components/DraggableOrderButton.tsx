import React, { useRef, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext'; 

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EDGE_PADDING = 20; 

interface DraggableOrderButtonProps {
  onPress: () => void;
}

export default function DraggableOrderButton({ onPress }: DraggableOrderButtonProps) {
  const pan = useRef(
    new Animated.ValueXY({ 
      x: width - BUTTON_SIZE - EDGE_PADDING, 
      y: height - 250 
    })
  ).current;

  const glowAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme(); 

  const shadowStyle = isDark 
    ? { elevation: 0 } 
    : Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
        android: { elevation: 10, shadowColor: '#000' }
      });

  useEffect(() => {
    const startPulse = () => {
      glowAnim.setValue(0); 
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1500, 
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          startPulse();
        }
      });
    };

    startPulse(); 
  }, [glowAnim]);

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7], 
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0, 0], 
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 }); 
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false } 
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset(); 

        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        if (isTap) {
          onPress(); 
        }

        const releaseX = (pan.x as any)._value;
        let releaseY = (pan.y as any)._value;

        const isLeftHalf = releaseX + (BUTTON_SIZE / 2) < width / 2;
        const snapX = isLeftHalf ? EDGE_PADDING : width - BUTTON_SIZE - EDGE_PADDING;

        const MIN_Y = 120; 
        const MAX_Y = height - 150; 
        if (releaseY < MIN_Y) releaseY = MIN_Y;
        if (releaseY > MAX_Y) releaseY = MAX_Y;

        Animated.spring(pan, {
          toValue: { x: snapX, y: releaseY },
          friction: 6, 
          tension: 40,
          useNativeDriver: false, 
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
    >
      <Animated.View 
        style={[
          styles.halo,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          }
        ]} 
      />

      <TouchableOpacity 
        style={[
          styles.button,
          // The Fix: Syncing the red background with the round edge
          { backgroundColor: Colors.primary, borderRadius: BUTTON_SIZE / 2 },
          shadowStyle
        ]} 
        activeOpacity={0.8}
        disabled={true} 
      >
        <Ionicons name="receipt" size={26} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  draggableContainer: {
    position: 'absolute',
    zIndex: 50, 
    justifyContent: 'center',
    alignItems: 'center', 
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  halo: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary, 
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});