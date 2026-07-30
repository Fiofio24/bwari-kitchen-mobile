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
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

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
  
  // Applied scaling dynamically to all layout heights and paddings
  const paddingTop = Platform.OS === 'web' ? scale(50) : insets.top + scale(10);
  const paddingBottom = scale(15);

  const shadowStyle = isScrolled 
    ? Platform.select({ 
        ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: scale(5), shadowOffset: { width: 0, height: scale(4) } }, 
        android: { elevation: 8 }, 
        web: { boxShadow: `0px ${scale(4)}px ${scale(10)}px rgba(0, 0, 0, 0.3)` } as any 
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
            {/* Dynamic icon sizing */}
            <Ionicons name={leftIcon} size={scale(28)} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: scale(28) }} />
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
        {rightComponent || <View style={{ width: scale(28) }} />}
      </View>

      {showDivider && (
        <View style={styles.dividerWrapper}>
          <View style={styles.divider} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topNavContainer: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
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
    minWidth: scale(40),
    alignItems: 'flex-start',
  },
  rightWrapper: {
    zIndex: 2,
    minWidth: scale(40),
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  centerWrapper: {
    position: 'absolute',
    left: scale(65), 
    right: scale(65), 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: {
    padding: scale(5),
    marginLeft: scale(-5),
  },
  headerTitle: {
    fontSize: scale(20),
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