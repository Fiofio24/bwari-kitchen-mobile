import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';

// 1. We MUST declare isActive and onPress here so the component knows to accept them
interface CategoryFilterProps {
  category: string;
  isActive: boolean;
  onPress: () => void;
}

export default function CategoryFilter({ category, isActive, onPress }: CategoryFilterProps) {
  return (
    <View style={styles.container}>   
        <TouchableOpacity 
          // 2. Using ternary operator for bulletproof styling
          style={[styles.pill, isActive ? styles.activePill : null]} 
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, isActive ? styles.activePillText : null]}>
            {category}
          </Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  pill: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAEAEC',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activePill: {
    backgroundColor: Colors.primary, // Red background
    paddingHorizontal: 25,
  },
  pillText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
  },
  activePillText: {
    color: '#FFFFFF', // White text when active
    fontWeight: 'bold',
  },
});