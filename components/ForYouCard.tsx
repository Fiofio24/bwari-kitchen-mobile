import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter'; // <-- Added to allow routing to Details
import GridDishCard from './GridDishCard';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoriteContext'; 
import { useMenu } from '../context/MenuContext';

interface ForYouCardProps { onAddToCart: (dish: any) => void; }

const MAX_SLIDER_WIDTH = 280; 

export default function ForYouCard({ onAddToCart }: ForYouCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { toggleFavorite, isFavorite } = useFavorites(); 
  const router = useSafeRouter(); 
  
  const { packages, findItem } = useMenu();

  const normalizedPackages = packages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    category: pkg.items[0]?.menuItem.category.name || 'Combo',
    price: pkg.totalPrice,
    image: pkg.imageUrl || undefined,
    isAvailable: true,
    subItems: pkg.items.map(i => ({
      id: i.menuItem.id,
      qty: i.quantity,
      name: i.menuItem.name,
    })),
  }));

  const getMealTime = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) return 'Breakfast';
    if (currentHour >= 12 && currentHour < 17) return 'Lunch';
    return 'Dinner';
  };

  const [mealTime, setMealTime] = useState(getMealTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setMealTime(getMealTime());
    }, 60000); 
    return () => clearInterval(interval);
  }, []);

  const getBreakfastDishes = () => normalizedPackages.filter(item => ['Rice', 'Swallow', 'Snacks'].includes(item.category)).slice(0, 3);
  const getLunchDishes = () => normalizedPackages.filter(item => ['Rice', 'Swallow', 'Drinks'].includes(item.category)).reverse().slice(0, 3);
  const getDinnerDishes = () => normalizedPackages.filter(item => ['Rice', 'Swallow'].includes(item.category)).slice(1, 4);

  let currentDishes = getBreakfastDishes();
  if (mealTime === 'Lunch') currentDishes = getLunchDishes();
  else if (mealTime === 'Dinner') currentDishes = getDinnerDishes();

  const SLIDER_CARD_WIDTH = Math.min(width * 0.75, MAX_SLIDER_WIDTH);

  const isComboAvailable = (combo: any) => {
    if (!combo.subItems || combo.subItems.length === 0) return combo.isAvailable !== false;
    return !combo.subItems.some((sub: any) => {
      const dbItem = findItem(sub.id);
      return dbItem?.isAvailable === false;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{mealTime} For You</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea} snapToInterval={SLIDER_CARD_WIDTH + 15} decelerationRate="fast">
        {currentDishes.map((dish) => {
          const isAvail = isComboAvailable(dish);
          return (
            <View style={[styles.cardWrapper, { width: SLIDER_CARD_WIDTH }]} key={dish.id}>
              <GridDishCard 
                category={dish.category} 
                name={dish.name} 
                price={`₦${dish.price.toLocaleString()}`} 
                rating="4.8" 
                image={dish.image} 
                isRectangle 
                isAvailable={isAvail} 
                isFavorite={isFavorite(dish.id)} 
                onToggleFavorite={() => toggleFavorite(dish)} 
                // PRO UX FIX: Tapping routes to details page!
                onPress={() => router.push({ pathname: '/details', params: { id: dish.id } })}
                onAdd={() => onAddToCart(dish)} 
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
    paddingLeft: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  scrollArea: {
    paddingLeft: 20,
  },
  cardWrapper: {
    marginRight: 15,
  }
});