import React, { useRef, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EDGE_PADDING = 20; 

interface DraggableOrderButtonProps {
  onPress: () => void;
}

export default function DraggableOrderButton({ onPress }: DraggableOrderButtonProps) {
  // 1. Pan animation for dragging (Existing)
  const pan = useRef(
    new Animated.ValueXY({ 
      x: width - BUTTON_SIZE - EDGE_PADDING, 
      y: height - 250 
    })
  ).current;

  // 2. Glow animation for the "alive" pulse (NEW)
  const glowAnim = useRef(new Animated.Value(0)).current;

// 3. Start the continuous radar pulse loop (Bulletproof recursive method)
  useEffect(() => {
    const startPulse = () => {
      glowAnim.setValue(0); // Force reset to center
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1500, 
        useNativeDriver: true,
      }).start(({ finished }) => {
        // The exact millisecond the animation finishes, start it again!
        if (finished) {
          startPulse();
        }
      });
    };

    startPulse(); // Kick off the infinite loop
  }, [glowAnim]);

  // Interpolate the glow to continuously shoot outwards
  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7], // Starts at normal size, explodes outward to over double its size!
  });

  // Interpolate the opacity to fade out completely as it expands
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0, 0], // Starts visible, fades to 0% right before it hits max size
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
      {/* 4. The Glowing Halo Layer (Placed behind the button) */}
      <Animated.View 
        style={[
          styles.halo,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          }
        ]} 
      />

      {/* The Actual Button */}
      <TouchableOpacity 
        style={styles.button} 
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
    alignItems: 'center', // Ensures the halo and button are perfectly centered
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  halo: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary, // Uses your red theme color for the glow
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    borderWidth: 2,
    borderColor: '#d30000', 
  },
});