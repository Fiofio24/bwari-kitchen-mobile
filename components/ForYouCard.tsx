import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import GridDishCard from './GridDishCard';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoriteContext'; // <-- Imported Favorites Context
import { getBreakfastDishes, getLunchDishes, getDinnerDishes } from '../constants/menuData';

interface ForYouCardProps { onAddToCart: (dish: any) => void; }

const MAX_SLIDER_WIDTH = 280; 

export default function ForYouCard({ onAddToCart }: ForYouCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { toggleFavorite, isFavorite } = useFavorites(); // <-- Extracted Favorite Hooks
  
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

  let currentDishes = getBreakfastDishes();
  if (mealTime === 'Lunch') currentDishes = getLunchDishes();
  else if (mealTime === 'Dinner') currentDishes = getDinnerDishes();
  
  const SLIDER_CARD_WIDTH = Math.min(width * 0.75, MAX_SLIDER_WIDTH);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{mealTime} For You</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea} snapToInterval={SLIDER_CARD_WIDTH + 15} decelerationRate="fast">
        {currentDishes.map((dish) => (
          <View style={[styles.cardWrapper, { width: SLIDER_CARD_WIDTH }]} key={dish.id}>
            <GridDishCard 
              category={dish.category} 
              name={dish.name} 
              price={`₦${dish.price.toLocaleString()}`} 
              rating="4.8" 
              image={dish.image} 
              isRectangle 
              isFavorite={isFavorite(dish.id)} // <-- Bound to Context
              onToggleFavorite={() => toggleFavorite(dish)} // <-- Bound to Context
              onAdd={() => onAddToCart(dish)} 
            />
          </View>
        ))}
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