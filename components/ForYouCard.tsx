import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import GridDishCard from './GridDishCard';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const BREAKFAST_DISHES = [
  { id: 'b1', category: 'Rice', name: 'Party Jollof', price: '₦2,000', rating: '5.0', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop' },
  { id: 'b2', category: 'Swallow', name: 'Semo & Ogbono', price: '₦2,500', rating: '4.8', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop' },
  { id: 'b3', category: 'Protein', name: 'Peppered Snail', price: '₦3,000', rating: '4.9', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },
];

const LUNCH_DISHES = [
  { id: 'l1', category: 'Rice', name: 'Jollof & Chicken', price: '₦3,500', rating: '4.9', image: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?q=80&w=800&auto=format&fit=crop' },
  { id: 'l2', category: 'Swallow', name: 'Pounded Yam & Egusi', price: '₦4,000', rating: '5.0', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop' },
  { id: 'l3', category: 'Drink', name: 'Chilled Zobo', price: '₦800', rating: '4.7', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop' },
];

const DINNER_DISHES = [
  { id: 'd1', category: 'Protein', name: 'Grilled Catfish', price: '₦6,000', rating: '4.8', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop' },
  { id: 'd2', category: 'Rice', name: 'Fried Rice & Turkey', price: '₦4,500', rating: '4.6', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=800&auto=format&fit=crop' },
  { id: 'd3', category: 'Swallow', name: 'Amala & Ewedu', price: '₦3,000', rating: '4.9', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
];

interface ForYouCardProps {
  onAddToCart: (dish: any) => void;
}

export default function ForYouCard({ onAddToCart }: ForYouCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  
  const getMealTime = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) return 'Breakfast';
    if (currentHour >= 12 && currentHour < 17) return 'Lunch';
    return 'Dinner';
  };

  const [mealTime] = useState(getMealTime());

  let currentDishes = BREAKFAST_DISHES;
  if (mealTime === 'Lunch') currentDishes = LUNCH_DISHES;
  else if (mealTime === 'Dinner') currentDishes = DINNER_DISHES;
  
  const MAX_SLIDER_WIDTH = 280; 
  const SLIDER_CARD_WIDTH = Math.min(width * 0.75, MAX_SLIDER_WIDTH);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{mealTime} For You</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea} snapToInterval={SLIDER_CARD_WIDTH + 15} decelerationRate="fast">
        {currentDishes.map((dish) => (
          <View style={[styles.cardWrapper, { width: SLIDER_CARD_WIDTH }]} key={dish.id}>
            <GridDishCard category={dish.category} name={dish.name} price={dish.price} rating={dish.rating} image={dish.image} isRectangle onAdd={() => onAddToCart(dish)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 10, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderLeftWidth: 3.5, borderLeftColor: Colors.primary, paddingLeft: 5 },
  // THE FIX: Enforced strict 20px padding horizontally
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginHorizontal: 20 },
  scrollArea: { paddingLeft: 20 },
  cardWrapper: { marginRight: 15 }
});