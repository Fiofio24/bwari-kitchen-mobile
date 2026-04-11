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
import { COMBO_PACKAGES, CATEGORIES } from '../../constants/menuData';

const USER_PROFILE = { name: "User", notificationCount: 1 };

export default function HomeScreen() {
  const router = useRouter(); 
  const { cartCount, addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("No 6 Kuje Street...");
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const insets = useSafeAreaInsets();
  const shadowTripwire = 100 + insets.top; 
  const { colors, isDark } = useTheme();
  const toastAnim = useRef(new Animated.Value(-100)).current;
  
  const { width } = useWindowDimensions();
  const MAX_GRID_WIDTH = 200; 
  const GRID_PADDING = 20; 
  const GRID_GAP = 15;     
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const NUM_COLUMNS = Math.max(2, Math.ceil(AVAILABLE_WIDTH / (MAX_GRID_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchRealData = new Promise(resolve => setTimeout(resolve, 1500)); 
      await fetchRealData;
    } finally {
      setRefreshing(false); 
    }
  }, []);

  const filteredDishes = activeCategory === 'All' ? COMBO_PACKAGES : COMBO_PACKAGES.filter(dish => dish.category === activeCategory);

  const handleScroll = (event: any) => setIsScrolled(event.nativeEvent.contentOffset.y > shadowTripwire);

  const handleAddToCart = (comboPackage: any) => {
    const newItem: any = { 
      id: `cart_pkg_${Date.now()}`, 
      name: comboPackage.name, 
      category: comboPackage.category,
      price: comboPackage.price, 
      quantity: 1, 
      image: comboPackage.image, 
      isAvailable: true,
      subItems: comboPackage.subItems || [] 
    };
    addToCart(newItem);

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
                <GridDishCard category={dish.category} name={dish.name} price={`₦${dish.price.toLocaleString()}`} rating={dish.rating} image={dish.image} onAdd={() => handleAddToCart(dish)} />
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginHorizontal: 20 },
  seeMoreText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  scrollContainer: { flexDirection: 'row', paddingLeft: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingHorizontal: 20, paddingBottom: 20, marginTop: 5 },
  emptyText: { width: '100%', textAlign: 'center', marginTop: 20 },
  toastContainer: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, zIndex: 100, justifyContent: 'center', gap: 10 },
  toastText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});