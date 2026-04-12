import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoriteContext'; 
import GridDishCard from '../../components/GridDishCard';
import Sidebar from '../../components/Sidebar';
import CartBadgeIcon from '../../components/CartBadgeIcon';

export default function FavoriteScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const { width } = useWindowDimensions();
  const GRID_PADDING = 20;
  const GRID_GAP = 15;
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const NUM_COLUMNS = 2;
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const bottomNavHeight = 70 + Math.max(insets.bottom, 15);
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const handleAddToCart = (dish: any) => {
    const newItem: any = {
      id: dish.id, // FIXED: Replaced `cart_pkg_${Date.now()}` with actual ID to allow stacking
      name: dish.name,
      category: dish.category,
      price: dish.price,
      quantity: 1,
      image: dish.image,
      isAvailable: true,
      subItems: dish.subItems || []
    };
    addToCart(newItem);

    Animated.sequence([
      Animated.spring(toastAnim, { toValue: insets.top + 10, useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop, paddingBottom }]}>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={[styles.iconButton, styles.sideIcon]}>
          <Ionicons name="menu-outline" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="none">
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>

        <View style={[styles.headerRight, styles.sideIcon]}>
          <CartBadgeIcon onPress={() => router.push('/cart')} />
        </View>
      </View>

      {favorites.length > 0 ? (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 20 }]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {favorites.length} {favorites.length === 1 ? 'Item' : 'Items'} Saved
            </Text>
          </View>

          <View style={styles.gridContainer}>
            {favorites.map((dish) => (
              <View style={{ width: CARD_WIDTH }} key={dish.id}>
                <GridDishCard 
                  category={dish.category} 
                  name={dish.name} 
                  price={`₦${dish.price.toLocaleString()}`} 
                  rating={dish.rating} 
                  image={dish.image} 
                  isFavorite={isFavorite(dish.id)} 
                  onToggleFavorite={() => toggleFavorite(dish)}
                  onAdd={() => handleAddToCart(dish)} 
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.surface : '#FFEEEE' }]}>
            <Ionicons name="heart" size={80} color={isDark ? colors.textMuted : '#FFCCCC'} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorites Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            You haven&apos;t added any meals to your favorites. Tap the heart icon on any meal to save it for later!
          </Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/menu')} activeOpacity={0.8}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={styles.toastText}>Added to cart!</Text>
      </Animated.View>

      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  header: { 
    backgroundColor: Colors.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    zIndex: 10, 
  },
  sideIcon: {
    zIndex: 2,
    minWidth: 40,
  },
  centerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: { 
    padding: 5,
    marginLeft: -5,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF',
  },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scrollContent: { 
    paddingTop: 15,
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 15,
  },
  resultCount: { 
    fontSize: 14, 
    fontWeight: 'bold',
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15, 
    paddingHorizontal: 20,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40, 
    paddingBottom: 50,
  },
  iconCircle: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center',
  },
  emptySubtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 35,
  },
  browseBtn: { 
    backgroundColor: Colors.primary, 
    paddingVertical: 16, 
    paddingHorizontal: 35, 
    borderRadius: 30,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  browseBtnText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  toastContainer: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 30, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    zIndex: 100, 
    justifyContent: 'center', 
    gap: 10,
  },
  toastText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold',
  }
});