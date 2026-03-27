import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { Colors } from '../constants/Colors';

interface CategoryFilterProps {
  category: string;
}

export default function CategoryFilter({ category }: CategoryFilterProps) {
  return (
    <View style={styles.container}>   
        <TouchableOpacity style={styles.pill}>
          <Text style={styles.pillText}>{category}</Text>
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
    // marginRight: 10,
  },
  pillText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
  },
});