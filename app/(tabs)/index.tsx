import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native'; 
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import TopNav from '../../components/TopNav';
import GreetingSection from '../../components/GreetingSection';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import GridDishCard from '../../components/GridDishCard';
import PromoSlider from '../../components/PromoSlider';
import BottomNav from '../../components/BottomNav';
import Sidebar from '../../components/Sidebar';
import DraggableOrderButton from '../../components/DraggableOrderButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
// 1. Import the Brain!
import { useCart } from '../../context/CartContext';

const CATEGORIES = ['All', 'Rice', 'Swallow', 'Drink', 'Protein'];

const USER_PROFILE = {
  name: "User",
  // We deleted cartCount from here because the Context handles it now!
  notificationCount: 1,
};

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

const DUMMY_DISHES = [
  { id: '1', category: 'Rice', name: 'Party Jollof', price: '₦2,000', rating: '5.0', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop' },
  { id: '2', category: 'Swallow', name: 'Semo & Egusi', price: '₦1,000', rating: '4.5', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop' },
  { id: '3', category: 'Rice', name: 'Special Rice', price: '₦3,000', rating: '4.5', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop' },
  { id: '4', category: 'Drink', name: 'Coca Cola', price: '₦500', rating: '3.0', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop' },
  { id: '5', category: 'Protein', name: 'Grilled Turkey', price: '₦4,000', rating: '4.8', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop' },
  { id: '6', category: 'Swallow', name: 'Amala & Ewedu', price: '₦1,500', rating: '4.7', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
  { id: '7', category: 'Swallow', name: 'Eba & Ewedu', price: '₦1,500', rating: '4.7', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },
  { id: '8', category: 'Rice', name: 'Fried Rice', price: '₦2,000', rating: '5.0', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=800&auto=format&fit=crop' },
];

export default function HomeScreen() {
  const router = useRouter(); 
  
  // 2. Extract the variables we need from the Context
  const { cartCount, addToCart } = useCart();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("No 6 Kuje Street...");
  const [isScrolled, setIsScrolled] = useState(false);
  
  const insets = useSafeAreaInsets();
  const shadowTripwire = 120 + insets.top; 
  const { colors } = useTheme();
  
  const { width } = useWindowDimensions();
  const MAX_SLIDER_WIDTH = 280; 
  const SLIDER_CARD_WIDTH = Math.min(width * 0.75, MAX_SLIDER_WIDTH);
  const MAX_GRID_WIDTH = 200; 
  const GRID_PADDING = 20; 
  const GRID_GAP = 15;     
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const NUM_COLUMNS = Math.max(2, Math.ceil(AVAILABLE_WIDTH / (MAX_GRID_WIDTH + GRID_GAP)));
  const CARD_WIDTH = (AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

  const getMealTime = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) return 'Breakfast';
    if (currentHour >= 12 && currentHour < 17) return 'Lunch';
    return 'Dinner';
  };

  const currentMealTitle = getMealTime();
  let currentMealDishes = BREAKFAST_DISHES;
  if (currentMealTitle === 'Lunch') currentMealDishes = LUNCH_DISHES;
  else if (currentMealTitle === 'Dinner') currentMealDishes = DINNER_DISHES;

  const filteredDishes = activeCategory === 'All' 
    ? DUMMY_DISHES 
    : DUMMY_DISHES.filter(dish => dish.category === activeCategory);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setIsScrolled(offsetY > shadowTripwire);
  };

  // 3. Helper function to format data and send it to the cart!
  const handleAddToCart = (dish: any) => {
    const numericPrice = parseInt(dish.price.replace(/[₦,]/g, ''), 10);
    
    addToCart({
      id: dish.id,
      name: `${dish.category} Package`, // e.g., "Rice Package"
      contents: dish.name,              // e.g., "Party Jollof & Chicken"
      price: numericPrice,
      quantity: 1,
      image: dish.image
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16} 
      >
        
        <View style={styles.topLayoutContainer}>
          <GreetingSection userName={USER_PROFILE.name} />
          <View style={styles.searchBarWrapper}>
            <SearchBar onPress={() => router.push('/search')} />
          </View>
        </View>

        <PromoSlider />

        <View style={styles.bodyContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{currentMealTitle} For You</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breakfastScroll} snapToInterval={SLIDER_CARD_WIDTH + 15} decelerationRate="fast">
            {currentMealDishes.map((dish) => (
              <View style={[styles.grid1, { width: SLIDER_CARD_WIDTH }]} key={dish.id}>
                {/* 4. Pass the add function to the card */}
                <GridDishCard 
                  category={dish.category} 
                  name={dish.name} 
                  price={dish.price} 
                  rating={dish.rating} 
                  image={dish.image} 
                  isRectangle 
                  onAdd={() => handleAddToCart(dish)} 
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Others</Text>
          <TouchableOpacity><Text style={styles.seeMoreText}>See More</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          {CATEGORIES.map((category) => (
            <CategoryFilter key={category} category={category} isActive={activeCategory === category} onPress={() => setActiveCategory(category)} />
          ))}
        </ScrollView>

        <View style={styles.gridContainer}>
          {filteredDishes.length > 0 ? (
            filteredDishes.map((dish) => (
              <View style={[styles.grid, { width: CARD_WIDTH }]} key={dish.id}>
                {/* 5. Pass the add function to the card */}
                <GridDishCard 
                  category={dish.category} 
                  name={dish.name} 
                  price={dish.price} 
                  rating={dish.rating} 
                  image={dish.image} 
                  onAdd={() => handleAddToCart(dish)} 
                />
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>This category is not available in kitchen.</Text>
          )}
        </View>

      </ScrollView>

      <TopNav 
        address={currentAddress}
        onAddressChange={setCurrentAddress}
        cartCount={cartCount} // 6. Badge now updates automatically!
        notificationCount={USER_PROFILE.notificationCount}
        onOpenMenu={() => setIsSidebarOpen(true)}
        isScrolled={isScrolled} 
      />

      <BottomNav activeTab="Home" />
      <DraggableOrderButton onPress={() => console.log('Order Button Tapped!')} />
      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  topLayoutContainer: { marginBottom: 20, zIndex: 5, },
  searchBarWrapper: { paddingHorizontal: 10, marginTop: 10, zIndex: 1, },
  bodyContainer: { paddingTop: 10, },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderLeftWidth: 3.5, borderLeftColor: Colors.primary, paddingLeft: 5, },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginHorizontal: 25, },
  seeMoreText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14, },
  breakfastScroll: { paddingLeft: 20, },
  scrollContainer: { flexDirection: 'row', marginHorizontal: 15, },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingHorizontal: 20, paddingBottom: 20, marginTop: 5, },
  grid: {  }, 
  grid1: { marginRight: 15, },
  emptyText: { width: '100%', textAlign: 'center', marginTop: 20 } 
});