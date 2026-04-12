import React, { useRef, useEffect } from 'react';
import { 
  Animated, 
  PanResponder, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext'; 
import { useRouter } from 'expo-router'; // <-- Added Router

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EDGE_PADDING = 20; 

/**
 * A professional, floating action button that users can drag across the screen.
 * Tapping this button now intelligently routes directly to the 'My Orders' page.
 */
export default function DraggableOrderButton() {
  const router = useRouter(); // <-- Initialized Router
  
  const pan = useRef(new Animated.ValueXY({ 
    x: width - BUTTON_SIZE - EDGE_PADDING, 
    y: height - 250 
  })).current;
  
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme(); 

  const shadowStyle = isDark 
    ? Platform.select({ 
        ios: { shadowOpacity: 0 }, 
        android: { elevation: 0 }, 
        web: { boxShadow: 'none' } as any 
      })
    : Platform.select({
        ios: { 
          shadowColor: '#000', 
          shadowOpacity: 0.3, 
          shadowRadius: 10, 
          shadowOffset: { width: 0, height: 5 } 
        },
        android: { 
          elevation: 10, 
          shadowColor: '#000' 
        },
        web: { 
          boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.3)' 
        } as any
      });

  // Pulse effect animation
  useEffect(() => {
    const startPulse = () => {
      glowAnim.setValue(0); 
      Animated.timing(glowAnim, { 
        toValue: 1, 
        duration: 1500, 
        useNativeDriver: true 
      }).start(({ finished }) => { 
        if (finished) startPulse(); 
      });
    };
    startPulse(); 
  }, [glowAnim]);

  const glowScale = glowAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [1, 1.7] 
  });
  
  const glowOpacity = glowAnim.interpolate({ 
    inputRange: [0, 0.8, 1], 
    outputRange: [0.6, 0, 0] 
  });

  // Draggable logic with snapping to edges
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ 
          x: (pan.x as any)._value, 
          y: (pan.y as any)._value 
        });
        pan.setValue({ x: 0, y: 0 }); 
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }], 
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset(); 
        
        // Detect if it was a quick tap rather than a drag
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        
        // ROUTE DIRECTLY TO MY ORDERS IF TAPPED
        if (isTap) {
          router.push('/my-orders');
        }

        const releaseX = (pan.x as any)._value;
        let releaseY = (pan.y as any)._value;

        // Determine which side to snap to
        const isLeftHalf = releaseX + (BUTTON_SIZE / 2) < width / 2;
        const snapX = isLeftHalf ? EDGE_PADDING : width - BUTTON_SIZE - EDGE_PADDING;

        // Constrain Y position so it doesn't fly off screen
        const MIN_Y = 120; 
        const MAX_Y = height - 150; 
        if (releaseY < MIN_Y) releaseY = MIN_Y;
        if (releaseY > MAX_Y) releaseY = MAX_Y;

        Animated.spring(pan, { 
          toValue: { x: snapX, y: releaseY }, 
          friction: 6, 
          tension: 40, 
          useNativeDriver: false 
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View 
      {...panResponder.panHandlers} 
      style={[
        styles.draggableContainer, 
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
      ]}
    >
      <Animated.View 
        style={[
          styles.halo, 
          { transform: [{ scale: glowScale }], opacity: glowOpacity }
        ]} 
      />
      {/* The actual TouchableOpacity needs to have disabled={true} 
        so the PanResponder can reliably catch the tap events above it 
      */}
      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: Colors.primary, borderRadius: BUTTON_SIZE / 2 }, 
          shadowStyle
        ]} 
        activeOpacity={0.8} 
        disabled={true}
      >
        <Ionicons name="bag-handle" size={26} color="#FFF" />
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
    height: BUTTON_SIZE 
  },
  halo: { 
    position: 'absolute', 
    width: BUTTON_SIZE, 
    height: BUTTON_SIZE, 
    borderRadius: BUTTON_SIZE / 2, 
    backgroundColor: Colors.primary 
  },
  button: { 
    width: BUTTON_SIZE, 
    height: BUTTON_SIZE, 
    borderRadius: BUTTON_SIZE / 2, 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});