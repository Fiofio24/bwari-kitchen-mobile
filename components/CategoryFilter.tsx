import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext'; 
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface CategoryFilterProps {
  category: string;
  isActive: boolean;
  onPress: () => void;
}

export default function CategoryFilter({ category, isActive, onPress }: CategoryFilterProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>   
        <TouchableOpacity 
          style={[
            styles.pill, 
            { backgroundColor: isActive ? colors.primary : (isDark ? colors.border : '#EAEAEC') },
            isActive ? styles.activePill : null
          ]} 
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.pillText, 
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
    marginRight: scale(10), 
    marginTop: scale(10),
    marginBottom: scale(20),
  },
  pill: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(20),
    borderRadius: scale(20),
  },
  activePill: {
    paddingHorizontal: scale(25),
  },
  pillText: {
    fontWeight: '600',
    fontSize: scale(14),
  },
  activePillText: {
    fontWeight: 'bold',
  },
});