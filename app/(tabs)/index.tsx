import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Animated, RefreshControl } from 'react-native'; 
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import GreetingSection from '../../components/GreetingSection';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import GridDishCard from '../../components/GridDishCard';
import PromoSlider from '../../components/PromoSlider';
import Sidebar from '../../components/Sidebar';
import ForYouCard from '../../components/ForYouCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const CATEGORIES = ['All', 'Rice', 'Swallow', 'Drink', 'Protein'];
const USER_PROFILE = { name: "User", notificationCount: 1 };

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
  const { cartCount, addToCart } = useCart();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("No 6 Kuje Street...");
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const insets = useSafeAreaInsets();
  const shadowTripwire = 120 + insets.top; 
  const { colors, isDark } = useTheme();
  const toastAnim = useRef(new Animated.Value(-100)).current;
  
  const { width } = useWindowDimensions();
  const MAX_GRID_WIDTH = 200; 
  const GRID_PADDING = 20; 
  const GRID_GAP = 15;     
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const NUM_COLUMNS = Math.max(2, Math.ceil(AVAILABLE_WIDTH / (MAX_GRID_WIDTH + GRID_GAP)));
  const CARD_WIDTH = (AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const timeoutFallback = new Promise((_, reject) => setTimeout(() => reject(new Error("Network timeout")), 10000));
      const fetchRealData = new Promise(resolve => setTimeout(resolve, 1500)); 
      await Promise.race([fetchRealData, timeoutFallback]);
    } catch (error) {
      console.warn("Refresh failed:", error);
    } finally {
      setRefreshing(false); 
    }
  }, []);

  const filteredDishes = activeCategory === 'All' ? DUMMY_DISHES : DUMMY_DISHES.filter(dish => dish.category === activeCategory);

  const handleScroll = (event: any) => {
    setIsScrolled(event.nativeEvent.contentOffset.y > shadowTripwire);
  };

  const handleAddToCart = (dish: any) => {
    const numericPrice = parseInt(dish.price.replace(/[₦,]/g, ''), 10);
    addToCart({ id: dish.id, name: dish.category, contents: dish.name, price: numericPrice, quantity: 1, image: dish.image });

    Animated.sequence([
      Animated.spring(toastAnim, { toValue: insets.top + 20, useNativeDriver: true, friction: 6 }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressBackgroundColor={isDark ? colors.surface : '#FFF'} progressViewOffset={insets.top + 60} />}
      >
        <View style={styles.topLayoutContainer}>
          <GreetingSection userName={USER_PROFILE.name} />
          <View style={styles.searchBarWrapper}>
            <SearchBar onPress={() => router.push('/search')} />
          </View>
        </View>

        <PromoSlider />

        <ForYouCard onAddToCart={handleAddToCart} />

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
              <View style={{ width: CARD_WIDTH }} key={dish.id}>
                <GridDishCard category={dish.category} name={dish.name} price={dish.price} rating={dish.rating} image={dish.image} onAdd={() => handleAddToCart(dish)} />
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>This category is not available in kitchen.</Text>
          )}
        </View>
      </ScrollView>

      <TopNav address={currentAddress} onAddressChange={setCurrentAddress} cartCount={cartCount} notificationCount={USER_PROFILE.notificationCount} onOpenMenu={() => setIsSidebarOpen(true)} isScrolled={isScrolled} />

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={styles.toastText}>Successfully added to cart!</Text>
      </Animated.View>
   
      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  topLayoutContainer: { marginBottom: 20, zIndex: 5 },
  searchBarWrapper: { paddingHorizontal: 20, marginTop: 10, zIndex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderLeftWidth: 3.5, borderLeftColor: Colors.primary, paddingLeft: 5 },
  // THE FIX: Changed from 25 to 20
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginHorizontal: 20 },
  seeMoreText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  // THE FIX: Changed from marginHorizontal 15 to paddingLeft 20
  scrollContainer: { flexDirection: 'row', paddingLeft: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingHorizontal: 20, paddingBottom: 20, marginTop: 5 },
  emptyText: { width: '100%', textAlign: 'center', marginTop: 20 },
  toastContainer: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, zIndex: 100, justifyContent: 'center', gap: 10 },
  toastText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});