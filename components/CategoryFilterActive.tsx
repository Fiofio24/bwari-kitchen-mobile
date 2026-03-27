import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface CategoryFilterProps {
  category: string;
}

export default function CategoryFilter({ category }: CategoryFilterProps) {
  return (
    <View style={styles.container}>   
      {/* Horizontal Filter Pills */}
      
        
        {/* Active Pill (All) */}
        <View style={[styles.pill, styles.activePill]}>
          <Text style={styles.activePillText}>{category}</Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // paddingLeft: 20,
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
    // marginRight: 10,
  },
  activePill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 25,
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});