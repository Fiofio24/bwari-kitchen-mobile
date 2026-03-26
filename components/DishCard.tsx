import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface DishCardProps {
  name: string;
  price: string;
}

export default function DishCard({ name, price }: DishCardProps) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.imagePlaceholder} />
      <Text style={styles.dishName}>{name}</Text>
      <Text style={styles.dishPrice}>{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 10,
    marginRight: 15,
    width: 160,
    elevation: 3,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#EAEAEC',
    borderRadius: 10,
    marginBottom: 10,
  },
  dishName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  dishPrice: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: 5,
  },
});