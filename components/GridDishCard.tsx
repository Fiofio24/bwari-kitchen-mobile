import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface GridDishCardProps {
  name: string;
  price: string;
  rating: string;
  category: string;
}

export default function GridDishCard({ name, price, rating, category }: GridDishCardProps) {
  return (
    <View style={styles.cardContainer}>
      
      <View style={styles.imagePlaceholder}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={18} color="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.titleRow}>
        <Text style={styles.dishName}>{category}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>{rating}</Text>
          <Ionicons name="star" size={14} color={Colors.star} />
        </View>
      </View>

      <Text style={styles.subText}>{name}</Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.dishPrice}>{price}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  imagePlaceholder: {
    height: 150,
    backgroundColor: '#EAEAEC',
    borderRadius: 10,
    marginBottom: 10,
    padding: 8,
    alignItems: 'flex-end',
  },
  favoriteButton: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 2,
  },
  subText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 2,
  },
});