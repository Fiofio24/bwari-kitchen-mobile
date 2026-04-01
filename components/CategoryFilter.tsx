import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // <-- 1. Import the hook

interface CategoryFilterProps {
  category: string;
  isActive: boolean;
  onPress: () => void;
}

export default function CategoryFilter({ category, isActive, onPress }: CategoryFilterProps) {
  // 2. Grab your dynamic colors and the isDark boolean
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>   
        <TouchableOpacity 
          style={[
            styles.pill, 
            // 3. Dynamic Background Logic
            { backgroundColor: isActive ? colors.primary : (isDark ? colors.border : '#EAEAEC') },
            isActive ? styles.activePill : null
          ]} 
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.pillText, 
            // 4. Dynamic Text Logic
            { color: isActive ? '#FFFFFF' : colors.text },
            isActive ? styles.activePillText : null
          ]}>
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
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activePill: {
    paddingHorizontal: 25,
  },
  pillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  activePillText: {
    fontWeight: 'bold',
  },
});