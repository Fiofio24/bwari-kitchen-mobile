import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface BottomNavProps {
  activeTab?: string; // Tells the nav which icon to highlight
}

export default function BottomNav({ activeTab = 'Home' }: BottomNavProps) {
  
  // Array of our navigation items to map through
  const navItems = [
    { name: 'Home', icon: 'home', outlineIcon: 'home-outline' },
    { name: 'Menu', icon: 'restaurant', outlineIcon: 'restaurant-outline' },
    { name: 'Favorite', icon: 'heart', outlineIcon: 'heart-outline' },
    { name: 'Profile', icon: 'person', outlineIcon: 'person-outline' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeTab === item.name;
        
        return (
          <TouchableOpacity 
            key={item.name} 
            style={[styles.navItem, isActive && styles.activeNavItem]}
            activeOpacity={0.8}
          >
            <Ionicons 
              // Cast to any to satisfy TypeScript for dynamic icon names
              name={isActive ? item.icon as any : item.outlineIcon as any} 
              size={24} 
              color={isActive ? '#FFFFFF' : Colors.textMuted} 
            />
            
            {/* Only show the text if this specific tab is active */}
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
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
  activeNavItem: {
    backgroundColor: Colors.primary, // Red pill background for active state
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
});