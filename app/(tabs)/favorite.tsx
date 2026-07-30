import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  useWindowDimensions, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useSafeRouter } from '../../hooks/useSafeRouter';
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
import { useMenu } from '../../context/MenuContext';
import TopNav from '../../components/TopNav';
import { scale } from '../../constants/Sizes'; // <-- IMPORTED MASTER SCALE

export default function FavoriteScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  
  const { favorites, toggleFavorite, isFavorite, refresh, loading } = useFavorites();
  const { findItem } = useMenu();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 
  const toastAnim = useRef(new Animated.Value(-scale(100))).current;

  const { width } = useWindowDimensions();
  const GRID_PADDING = scale(20);
  const GRID_GAP = scale(15);
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  
  const MAX_GRID_WIDTH = scale(200); 
  const NUM_COLUMNS = Math.max(2, Math.ceil(AVAILABLE_WIDTH / (MAX_GRID_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const bottomNavHeight = scale(70) + Math.max(insets.bottom, scale(15));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error("Error refreshing favorites:", error);
    } finally {
      setRefreshing(false); 
    }
  }, [refresh]);

  const handleAddToCart = (dish: any) => {
    const newItem: any = {
      id: dish.id, 
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
      Animated.spring(toastAnim, { toValue: insets.top + scale(10), useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -scale(100), duration: 300, useNativeDriver: true })
    ]).start();
  };

  const checkAvailability = (dish: any) => {
    if (dish.subItems && dish.subItems.length > 0) {
      return !dish.subItems.some((sub: any) => {
        const dbItem = findItem(sub.id);
        return dbItem?.isAvailable === false;
      });
    }
    const dbItem = findItem(dish.id);
    return dbItem ? dbItem.isAvailable !== false : true;
  };

  const headerRightComponent = (
    <View style={styles.headerRight}>
      <CartBadgeIcon onPress={() => router.push('/cart')} />
    </View>
  );

  if (loading && favorites.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Favorites"
        leftIcon="menu-outline"
        onLeftPress={() => setIsSidebarOpen(true)}
        rightComponent={headerRightComponent}
        isAbsolute={false} 
        isScrolled={true}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          favorites.length > 0 ? styles.scrollContent : { flexGrow: 1, justifyContent: 'center' },
          { paddingBottom: bottomNavHeight + scale(20) }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
            colors={[Colors.primary]} 
            progressBackgroundColor={isDark ? colors.surface : '#FFF'} 
          />
        }
      >
        {favorites.length > 0 ? (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.resultCount, { color: colors.textMuted }]}>
                {favorites.length} {favorites.length === 1 ? 'Item' : 'Items'} Saved
              </Text>
            </View>

            <View style={[styles.gridContainer, { gap: GRID_GAP }]}>
              {favorites.map((dish) => {
                const isAvail = checkAvailability(dish);
                return (
                  <View style={{ width: CARD_WIDTH }} key={dish.id}>
                    <GridDishCard 
                      category={dish.category} 
                      name={dish.name} 
                      price={`₦${dish.price.toLocaleString()}`} 
                      rating={dish.rating} 
                      image={dish.image} 
                      isAvailable={isAvail} 
                      isFavorite={isFavorite(dish.id)} 
                      onToggleFavorite={() => toggleFavorite(dish)}
                      onPress={() => router.push({ pathname: '/details', params: { id: dish.id } })}
                      onAdd={() => handleAddToCart(dish)} 
                    />
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.surface : '#FFEEEE' }]}>
              <Ionicons name="heart" size={scale(80)} color={isDark ? colors.textMuted : '#FFCCCC'} />
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
      </ScrollView>

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}>
        <Ionicons name="checkmark-circle" size={scale(24)} color="#4CAF50" />
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
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scrollContent: { 
    paddingTop: scale(15),
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: scale(20), 
    marginBottom: scale(15),
  },
  resultCount: { 
    fontSize: scale(14), 
    fontWeight: 'bold',
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: scale(20),
  },
  emptyContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: scale(40), 
    paddingBottom: scale(50),
  },
  iconCircle: { 
    width: scale(140), 
    height: scale(140), 
    borderRadius: scale(70), 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: scale(20),
  },
  emptyTitle: { 
    fontSize: scale(24), 
    fontWeight: 'bold', 
    marginBottom: scale(10), 
    textAlign: 'center',
  },
  emptySubtitle: { 
    fontSize: scale(16), 
    textAlign: 'center', 
    lineHeight: scale(24), 
    marginBottom: scale(35),
  },
  browseBtn: { 
    backgroundColor: Colors.primary, 
    paddingVertical: scale(16), 
    paddingHorizontal: scale(35), 
    borderRadius: scale(30),
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(5),
  },
  browseBtnText: { 
    color: '#FFF', 
    fontSize: scale(18), 
    fontWeight: 'bold',
  },
  toastContainer: { 
    position: 'absolute', 
    left: scale(20), 
    right: scale(20), 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: scale(14), 
    paddingHorizontal: scale(20), 
    borderRadius: scale(30), 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: scale(5) }, 
    shadowOpacity: 0.3, 
    shadowRadius: scale(8), 
    zIndex: 100, 
    justifyContent: 'center', 
    gap: scale(10),
  },
  toastText: { 
    color: '#FFF', 
    fontSize: scale(16), 
    fontWeight: 'bold',
  }
});