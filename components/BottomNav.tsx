import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 

interface BottomNavProps {
  activeTab?: string; 
}

export default function BottomNav({ activeTab = 'Home' }: BottomNavProps) {
  const { colors, isDark } = useTheme(); 

  const shadowStyle = isDark 
    ? { elevation: 0 } 
    : Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
        android: { elevation: 15, shadowColor: '#000' } 
      });

  const navItems = [
    { name: 'Home', icon: 'home', outlineIcon: 'home-outline' },
    { name: 'Menu', icon: 'restaurant', outlineIcon: 'restaurant-outline' },
    { name: 'Favorite', icon: 'heart', outlineIcon: 'heart-outline' },
    { name: 'Profile', icon: 'person', outlineIcon: 'person-outline' },
  ];

  return (
    <View style={[
      styles.container, 
      // The Fix: Syncing background and border radius!
      { backgroundColor: colors.surface, borderRadius: 30 },
      shadowStyle
    ]}>
      {navItems.map((item) => {
        const isActive = activeTab === item.name;
        
        return (
          <TouchableOpacity 
            key={item.name} 
            style={[styles.navItem, isActive && { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isActive ? item.icon as any : item.outlineIcon as any} 
              size={24} 
              color={isActive ? '#FFFFFF' : colors.textMuted} 
            />
            
            {isActive && (
              <Text style={styles.activeText}>{item.name}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    zIndex: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
});