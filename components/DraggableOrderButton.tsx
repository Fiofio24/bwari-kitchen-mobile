import React, { useRef, useEffect, useState } from 'react';
import { 
  Animated, 
  PanResponder, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Platform,
  DeviceEventEmitter,
  View,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext'; 
import { useSafeRouter } from '../hooks/useSafeRouter'; 
import api from '../app/lib/api'; 
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = scale(60);
const EDGE_PADDING = scale(20); 

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'];

export default function DraggableOrderButton() {
  const router = useSafeRouter(); 
  const { isDark, colors } = useTheme(); 
  
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const hasActiveOrders = activeOrderCount > 0;

  const pan = useRef(new Animated.ValueXY({ 
    x: width - BUTTON_SIZE - EDGE_PADDING, 
    y: height - scale(250) 
  })).current;
  
  const glowAnim = useRef(new Animated.Value(0)).current;

  // BACKGROUND CHECK LOGIC
  useEffect(() => {
    let isMounted = true;

    const checkActiveOrders = async () => {
      try {
        const res = await api.get('/api/orders?limit=10');
        const orders = res.data.orders || [];
        const activeCount = orders.filter((o: any) => ACTIVE_STATUSES.includes(o.status)).length;
        if (isMounted) setActiveOrderCount(activeCount);
      } catch (err) {
        // Silent fail for background checking
      }
    };

    checkActiveOrders(); 
    
    const interval = setInterval(checkActiveOrders, 15000);
    const subscription = DeviceEventEmitter.addListener('ORDER_PLACED', checkActiveOrders);

    return () => {
      isMounted = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

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
          shadowRadius: scale(10), 
          shadowOffset: { width: 0, height: scale(5) } 
        },
        android: { 
          elevation: 4, 
          shadowColor: '#000' 
        },
        web: { 
          boxShadow: `0px ${scale(5)}px ${scale(15)}px rgba(0, 0, 0, 0.3)` 
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
    if (hasActiveOrders) {
      startPulse(); 
    }
  }, [glowAnim, hasActiveOrders]);

  const glowScale = glowAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [1, 1.7] 
  });
  
  const glowOpacity = glowAnim.interpolate({ 
    inputRange: [0, 0.8, 1], 
    outputRange: [0.6, 0, 0] 
  });

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
        
        // Use scaled distance to determine a tap vs swipe
        const isTap = Math.abs(gestureState.dx) < scale(5) && Math.abs(gestureState.dy) < scale(5);
        if (isTap) router.push('/my-orders');

        const releaseX = (pan.x as any)._value;
        let releaseY = (pan.y as any)._value;

        const isLeftHalf = releaseX + (BUTTON_SIZE / 2) < width / 2;
        const snapX = isLeftHalf ? EDGE_PADDING : width - BUTTON_SIZE - EDGE_PADDING;

        const MIN_Y = scale(120); 
        const MAX_Y = height - scale(150); 
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
      {hasActiveOrders && (
        <Animated.View 
          style={[
            styles.halo, 
            { transform: [{ scale: glowScale }], opacity: glowOpacity }
          ]} 
        />
      )}
      
      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: hasActiveOrders ? Colors.primary : colors.surface }, 
          shadowStyle
        ]} 
        activeOpacity={0.8} 
        disabled={true}
      >
        <Ionicons 
          name={hasActiveOrders ? "bag-handle" : "bag-handle-outline"} 
          size={scale(26)} 
          color={hasActiveOrders ? "#FFF" : colors.text} 
        />

        {hasActiveOrders && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {activeOrderCount > 99 ? '99+' : activeOrderCount}
            </Text>
          </View>
        )}
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
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)', 
  },
  badgeContainer: {
    position: 'absolute',
    top: scale(-2),
    right: scale(-2),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    minWidth: scale(22),
    height: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
  },
  badgeText: {
    color: Colors.primary,
    fontSize: scale(12),
    fontWeight: '900',
    textAlign: 'center',
  },
});