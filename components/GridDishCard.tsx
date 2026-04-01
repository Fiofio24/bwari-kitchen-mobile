import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // <-- 1. Import the hook

interface GridDishCardProps {
  name: string;
  price: string;
  rating: string;
  category: string;
  image: string; 
  isRectangle?: boolean;
}

export default function GridDishCard({ name, price, rating, category, image, isRectangle }: GridDishCardProps) {
  // 2. Grab your dynamic colors and theme state
  const { colors, isDark } = useTheme();

  return (
    <View style={[
      styles.cardContainer, 
      // 3. Apply dynamic background and shadow
      { backgroundColor: colors.surface, shadowColor: isDark ? '#000' : '#ccc' }
    ]}>
      
      <ImageBackground 
        source={{ uri: image }} 
        style={[
          styles.imagePlaceholder, 
          { aspectRatio: isRectangle ? 1.5 : 1 },
          // 4. Darken the loading placeholder in dark mode
          { backgroundColor: isDark ? colors.border : '#EAEAEC' }
        ]}
        imageStyle={styles.imageRadius}
      >
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={18} color="#000" />
        </TouchableOpacity>
      </ImageBackground>
      
      <View style={styles.titleRow}>
        <Text style={[styles.dishName, { color: colors.text }]}>{category}</Text>
        <View style={styles.ratingRow}>
          <Text style={[styles.ratingText, { color: colors.text }]}>{rating}</Text>
          <Ionicons name="star" size={14} color={colors.star} />
        </View>
      </View>

      <Text style={[styles.subText, { color: colors.textMuted }]}>{name}</Text>
      
      <View style={styles.priceRow}>
        <Text style={[styles.dishPrice, { color: colors.primary }]}>{price}</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    width: '100%',
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  imagePlaceholder: {
    width: '100%',
    marginBottom: 10,
    padding: 8,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  imageRadius: {
    borderRadius: 10,
  },
  favoriteButton: {
    backgroundColor: '#ffffff95',
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
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