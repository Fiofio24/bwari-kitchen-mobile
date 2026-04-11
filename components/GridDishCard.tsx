import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 
import { Colors } from '../constants/Colors';

interface GridDishCardProps {
  name: string;
  price: string;
  rating: string;
  category: string;
  image: string; 
  isRectangle?: boolean;
  isFavorite?: boolean; // Added to support favorite state
  onAdd?: () => void;
  onToggleFavorite?: () => void; // Added to handle heart clicks
}

export default function GridDishCard({ name, price, rating, category, image, isRectangle, isFavorite, onAdd, onToggleFavorite }: GridDishCardProps) {
  const { colors, isDark } = useTheme();

  const shadowStyle = isDark 
    ? Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 }, web: { boxShadow: 'none' } as any })
    : Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
        android: { elevation: 4, shadowColor: '#000' },
        web: { boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)' } as any 
      });

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderRadius: 15 }, shadowStyle]}>
      <View style={[styles.imagePlaceholder, { aspectRatio: isRectangle ? 1.5 : 1 }, { backgroundColor: isDark ? colors.border : '#EAEAEC' }]}>
        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8} onPress={onToggleFavorite}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={18} 
            color={isFavorite ? Colors.primary : "#000"} 
          />
        </TouchableOpacity>

      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.dishName, { color: colors.text }]}>{category}</Text>
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingText, { color: colors.text }]}>{rating}</Text>
            <Ionicons name="star" size={14} color={colors.star} />
          </View>
        </View>
        <Text style={[styles.subText, { color: colors.textMuted }]} numberOfLines={1}>{name}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.dishPrice, { color: colors.primary }]}>{price}</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} activeOpacity={0.8} onPress={onAdd}>
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { borderRadius: 15, marginBottom: 15, width: '100%' },
  imagePlaceholder: { width: '100%', padding: 10, alignItems: 'flex-end', justifyContent: 'flex-start', borderTopLeftRadius: 15, borderTopRightRadius: 15, overflow: 'hidden' },
  contentContainer: { padding: 12, paddingTop: 10 },
  favoriteButton: { backgroundColor: '#ffffff95', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2, zIndex: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishName: { fontWeight: 'bold', fontSize: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontWeight: 'bold', fontSize: 12, marginRight: 2 },
  subText: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishPrice: { fontWeight: 'bold', fontSize: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12, marginLeft: 2 },
});