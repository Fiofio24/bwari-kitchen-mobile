import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useCart } from '../context/CartContext'; 
import { scale } from '../constants/Sizes'; 

const { width } = Dimensions.get('window');

const PADDING_HORIZONTAL = scale(10); 
const USABLE_WIDTH = width - (PADDING_HORIZONTAL * 2); 

export default function BottomNav({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme(); 
  const insets = useSafeAreaInsets();
  const { cartItems } = useCart();
  
  const safeBottom = Math.max(insets.bottom, scale(15)); 

  const shadowStyle = isDark 
    ? Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0, borderTopWidth: 1, borderTopColor: colors.border }, web: { boxShadow: 'none' } as any })
    : Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: scale(15), shadowOffset: { width: 0, height: scale(-6) } },
        android: { elevation: 20, shadowColor: '#000', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }, 
        web: { boxShadow: `0px ${scale(-5)}px ${scale(20)}px rgba(0, 0, 0, 0.1)` } as any
      });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const TAB_WIDTH = USABLE_WIDTH / state.routes.length;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * TAB_WIDTH,
      friction: 6, 
      tension: 50, 
      useNativeDriver: true,
    }).start();
  }, [state.index, slideAnim, TAB_WIDTH]);

  const getRouteConfig = (routeName: string) => {
    switch(routeName) {
      case 'index': return { label: 'Home', icon: 'home', outlineIcon: 'home-outline' };
      case 'menu': return { label: 'Menu', icon: 'restaurant', outlineIcon: 'restaurant-outline' };
      // to apply the cart icon on the bottom nav, uncomment the following line and the corresponding <Tabs.Screen name="cart" /> in app/(tabs)/_layout.tsx then move the cart.tsx file to the (tabs) folder.
      // case 'cart': return { label: 'Cart', icon: 'cart', outlineIcon: 'cart-outline' };
      case 'favorite': return { label: 'Favorite', icon: 'heart', outlineIcon: 'heart-outline' };
      case 'profile': return { label: 'Profile', icon: 'person', outlineIcon: 'person-outline' };
      default: return { label: routeName, icon: 'ellipse', outlineIcon: 'ellipse-outline' };
    }
  };

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: safeBottom }, shadowStyle]}>
        <View style={styles.boundaryWall}>
          <View style={styles.paddedInner}>
            <Animated.View style={[styles.animatedPill, { width: TAB_WIDTH, transform: [{ translateX: slideAnim }] }]}>
              <View style={[styles.pillInner, { backgroundColor: colors.primary }]} />
            </Animated.View>

            <View style={styles.iconRow}>
              {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const config = getRouteConfig(route.name);
                const onPress = () => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                };

                return (
                  <TouchableOpacity key={route.key} style={[styles.navItem, { width: TAB_WIDTH }]} activeOpacity={0.8} onPress={onPress}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={isFocused ? config.icon as any : config.outlineIcon as any} size={scale(22)} color={isFocused ? '#FFFFFF' : colors.textMuted} />
                      {route.name === 'cart' && cartItems.length > 0 && (
                        <View style={[styles.badge, isFocused && { borderColor: colors.primary, borderWidth: scale(1.5) }]} />
                      )}
                    </View>
                    {isFocused && <Text style={styles.activeText} numberOfLines={1}>{config.label}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: scale(30), borderTopRightRadius: scale(30), zIndex: 20 },
  boundaryWall: { borderTopLeftRadius: scale(30), borderTopRightRadius: scale(30), overflow: 'hidden' },
  paddedInner: { marginHorizontal: PADDING_HORIZONTAL, position: 'relative' },
  iconRow: { flexDirection: 'row', alignItems: 'center', height: scale(70) },
  animatedPill: { position: 'absolute', height: scale(70), justifyContent: 'center', alignItems: 'center', left: 0, top: 0 },
  pillInner: { width: '90%', height: '70%', borderRadius: scale(30) },
  navItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 1 },
  iconContainer: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: scale(-2),
    right: scale(-4),
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#FF3B30', 
  },
  activeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: scale(13), marginLeft: scale(4) },
});