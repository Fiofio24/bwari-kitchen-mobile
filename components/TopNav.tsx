// Note: This file requires an Expo/React Native environment to compile correctly.
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

export interface TopNavProps { 
  title?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  centerComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  isScrolled?: boolean; 
  showDivider?: boolean;
  isAbsolute?: boolean; 
}

export default function TopNav({ 
  title,
  leftIcon = "arrow-back",
  onLeftPress,
  centerComponent,
  rightComponent,
  isScrolled = false,
  showDivider = true,
  isAbsolute = true
}: TopNavProps) {
  const insets = useSafeAreaInsets();
  
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const shadowStyle = isScrolled 
    ? Platform.select({ 
        ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } }, 
        android: { elevation: 8 }, 
        web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)' } as any 
      })
    : Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 }, web: { boxShadow: 'none' } as any });

  return (
    <View style={[
      styles.topNavContainer, 
      { paddingTop, paddingBottom }, 
      isAbsolute && styles.absolutePosition,
      shadowStyle
    ]}>
      
      <View style={styles.leftWrapper}>
        {onLeftPress ? (
          <TouchableOpacity onPress={onLeftPress} activeOpacity={0.7} style={styles.iconButton}>
            <Ionicons name={leftIcon} size={28} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>
      
      <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="box-none">
        {centerComponent ? (
          centerComponent
        ) : title ? (
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightWrapper}>
        {rightComponent || <View style={{ width: 28 }} />}
      </View>

      {showDivider && (
        <View style={styles.dividerWrapper}>
          <View style={styles.divider} />
        </View>
      )}
    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  topNavContainer: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  absolutePosition: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  leftWrapper: {
    zIndex: 2,
    minWidth: 40,
    alignItems: 'flex-start',
  },
  rightWrapper: {
    zIndex: 2,
    minWidth: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  centerWrapper: {
    position: 'absolute',
    left: 65, // STRICT BOUNDARY: Prevents overlap with menu/back icon
    right: 65, // STRICT BOUNDARY: Leaves room for cart/notification icons
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: {
    padding: 5,
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dividerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});