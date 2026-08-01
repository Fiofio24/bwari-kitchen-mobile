import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  useWindowDimensions, 
  Animated, 
  RefreshControl,
  Platform,
  BackHandler,
  PanResponder
} from 'react-native'; 
import { Colors } from '../../constants/Colors';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '../../hooks/useSafeRouter';
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
import { useFavorites } from '../../context/FavoriteContext'; 
import { useMenu } from '../../context/MenuContext'; 

import CartBadgeIcon from '../../components/CartBadgeIcon';
import AddressSelectorModal from '../../components/AddressSelectorModal';
import FeedbackExitModal from '../../components/FeedbackExitModal';
import { useNotifications } from '../../context/NotificationContext';
import { useAddresses } from '../../context/AddressContext';
import { scale } from '../../constants/Sizes'; // <-- IMPORTED MASTER SCALE

const USER_PROFILE = { name: "User" };

export default function HomeScreen() {
  const router = useSafeRouter(); 
  const { addToCart } = useCart(); 
  const { toggleFavorite, isFavorite } = useFavorites(); 
  const { unreadCount } = useNotifications();
  const { activeAddress } = useAddresses();
  
  const { packages, categories, findItem, loading, refresh } = useMenu();
  const CATEGORIES = ['All', ...categories.map(c => c.name)];
  
  const normalizedPackages = packages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    category: pkg.items[0]?.menuItem.category.name || 'Combo',
    price: pkg.totalPrice,
    image: pkg.imageUrl || require('../../assets/images/custom-plate.png'),
    rating: '4.8',
    isAvailable: true,
    subItems: pkg.items.map(i => ({
      id: i.menuItem.id,
      qty: i.quantity,
      name: i.menuItem.name,
    })),
  }));

  const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  
  const insets = useSafeAreaInsets();
  const shadowTripwire = scale(100) + insets.top; 
  const { colors, isDark } = useTheme();
  const toastAnim = useRef(new Animated.Value(-scale(100))).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (e, gestureState) => {
        if (Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20) {
          Animated.timing(toastAnim, {
            toValue: -scale(100),
            duration: 200,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;
  
  const { width } = useWindowDimensions();
  const MAX_GRID_WIDTH = scale(200); 
  const GRID_PADDING = scale(20); 
  const GRID_GAP = scale(15);     
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const NUM_COLUMNS = Math.max(2, Math.ceil(AVAILABLE_WIDTH / (MAX_GRID_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Show Feedback Modal instead of exiting instantly
        setIsExitModalVisible(true);
        return true; 
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false); 
    }
  }, [refresh]);

  const filteredDishes = activeCategory === 'All' 
    ? normalizedPackages 
    : normalizedPackages.filter(dish => dish.category === activeCategory);

  const handleScroll = (event: any) => setIsScrolled(event.nativeEvent.contentOffset.y > shadowTripwire);

  const handleAddToCart = (comboPackage: any) => {
    const newItem: any = { 
      id: comboPackage.id, 
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
      Animated.spring(toastAnim, { toValue: insets.top + scale(20), useNativeDriver: true, friction: 6 }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: -scale(100), duration: 300, useNativeDriver: true })
    ]).start();
  };

  const isComboAvailable = (combo: any) => {
    if (!combo.subItems || combo.subItems.length === 0) return combo.isAvailable !== false;
    return !combo.subItems.some((sub: any) => {
      const dbItem = findItem(sub.id);
      // Treat deleted items (!dbItem) the same as sold out items
      return !dbItem || dbItem.isAvailable === false;
    });
  };

  if (loading && packages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: scale(100) }}
        onScroll={handleScroll}
        scrollEventThrottle={16} 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
            colors={[Colors.primary]} 
            progressBackgroundColor={isDark ? colors.surface : '#FFF'} 
            progressViewOffset={insets.top + scale(60)} 
          />
        }
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
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          {CATEGORIES.map((category) => (
            <CategoryFilter 
              key={category} 
              category={category} 
              isActive={activeCategory === category} 
              onPress={() => setActiveCategory(category)} 
            />
          ))}
        </ScrollView>

        <View style={styles.gridContainer}>
          {filteredDishes.length > 0 ? (
            filteredDishes.map((dish) => {
              const isAvail = isComboAvailable(dish);
              return (
                <View style={{ width: CARD_WIDTH }} key={dish.id}>
                  <GridDishCard 
                    category={dish.category} 
                    name={dish.name} 
                    price={`₦${dish.price.toLocaleString()}`} 
                    rating={dish.rating} 
                    image={dish.image} 
                    isFavorite={isFavorite(dish.id)} 
                    isAvailable={isAvail} 
                    onToggleFavorite={() => toggleFavorite(dish)} 
                    onPress={() => router.push({ pathname: '/details', params: { id: dish.id } })}
                    onAdd={() => handleAddToCart(dish)} 
                  />
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              This category is not available in kitchen.
            </Text>
          )}
        </View>
      </ScrollView>

      <TopNav 
        leftIcon="menu"
        onLeftPress={() => setIsSidebarOpen(true)}
        isScrolled={isScrolled}
        isAbsolute={true}
        centerComponent={
          <TouchableOpacity style={styles.locationContainer} onPress={() => setIsAddressModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.deliverToText}>Deliver to</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={scale(14)} color="#FFC107" />
              <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
                {(activeAddress as any)?.address || "Select Location"}
              </Text>
              <Ionicons name="chevron-down" size={scale(14)} color="#FFF" style={styles.chevronIcon} />
            </View>
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerIcons}>
            <CartBadgeIcon onPress={() => router.push('/cart')} />
            <TouchableOpacity 
              style={[styles.iconWrapper, styles.bellIcon]}
              activeOpacity={0.7}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={scale(26)} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <Animated.View 
        {...panResponder.panHandlers}
        style={[styles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}
      >
        <Ionicons name="checkmark-circle" size={scale(24)} color="#4CAF50" />
        <Text style={styles.toastText}>Successfully added to cart!</Text>
      </Animated.View>
   
      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <AddressSelectorModal 
        visible={isAddressModalVisible} 
        onClose={() => setIsAddressModalVisible(false)} 
      />

      <FeedbackExitModal 
        visible={isExitModalVisible} 
        onClose={() => setIsExitModalVisible(false)} 
        onExit={() => BackHandler.exitApp()} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: scale(20),
  },
  topLayoutContainer: {
    marginBottom: scale(20),
    zIndex: 5,
    marginTop: Platform.OS === 'web' ? scale(80) : scale(50), 
  },
  searchBarWrapper: {
    paddingHorizontal: scale(20),
    marginTop: scale(10),
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(15),
    borderLeftWidth: scale(3.5),
    borderLeftColor: Colors.primary,
    paddingLeft: scale(5),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(20),
    marginHorizontal: scale(20),
  },
  seeMoreText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  scrollContainer: {
    flexDirection: 'row',
    paddingLeft: scale(20),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(15),
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    marginTop: scale(5),
  },
  emptyText: {
    width: '100%',
    textAlign: 'center',
    marginTop: scale(20),
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
  },
  
  locationContainer: {
    alignItems: 'center',
    width: '70%', 
  },
  deliverToText: {
    color: '#FFCCCC',
    fontSize: scale(12),
    textAlign: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(2),
    maxWidth: '100%',
  },
  addressText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(14),
    marginLeft: scale(4),
    flexShrink: 1, 
  },
  chevronIcon: {
    marginLeft: scale(4),
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    padding: scale(4),
  },
  bellIcon: {
    marginLeft: scale(10),
  },
  badge: {
    position: 'absolute',
    top: scale(-2),
    right: scale(-2),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(10),
    minWidth: scale(16),
    height: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: scale(10),
    fontWeight: 'bold',
  },
});