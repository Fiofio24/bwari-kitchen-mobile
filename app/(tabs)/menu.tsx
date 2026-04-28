import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  useWindowDimensions,
  RefreshControl,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../../context/CartContext';
import Sidebar from '../../components/Sidebar';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import ForYouCard from '../../components/ForYouCard';
import { MENU_ITEMS, parseCompositeKey } from '../../constants/menuData';
import CartBadgeIcon from '../../components/CartBadgeIcon';
import GridDishCard from '../../components/GridDishCard';
import TopNav from '../../components/TopNav';
import ItemVariantModal from '../../components/ItemVariantModal';

const MENU_CATEGORIES = ['All', 'Drinks', 'Snacks','Swallow', 'Soup', 'Protein', 'Sides', 'Yam & Beans', 'Pasta', 'Rice'];

export const CUSTOM_PACKAGE_IMAGE = require('../../assets/images/custom-plate.png');

export default function MenuScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { addToCart } = useCart();
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const floatingButtonAnim = useRef(new Animated.Value(0)).current;

  const [activeCategory, setActiveCategory] = useState('All');
  
  // customPlate now stores composite keys! e.g., 'r3::1 Scoop / Half::0.5' -> quantity
  const [customPlate, setCustomPlate] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false); 
  
  const [variantModalItem, setVariantModalItem] = useState<any>(null);

  const { width } = useWindowDimensions();
  const GRID_PADDING = 20; 
  const GRID_GAP = 10; 
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  
  const MIN_CARD_WIDTH = 105; 
  const NUM_COLUMNS = Math.max(3, Math.floor((AVAILABLE_WIDTH + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const filteredItems = MENU_ITEMS.filter(item => item.category === activeCategory || activeCategory === 'All');
  const bottomNavHeight = 70 + Math.max(insets.bottom, 15);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchRealData = new Promise(resolve => setTimeout(resolve, 1500)); 
      await fetchRealData;
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false); 
    }
  }, []);

  const handleCardPress = (item: any) => {
    if (item.variants && item.variants.length > 0) {
      setVariantModalItem(item);
    } else {
      // If it doesn't have variants, just add it directly using a standard base key
      const compositeKey = `${item.id}::Base::1`;
      setCustomPlate(prev => ({ ...prev, [compositeKey]: (prev[compositeKey] || 0) + 1 }));
    }
  };

  const handleAddVariant = (compositeKey: string) => {
    setCustomPlate(prev => ({ ...prev, [compositeKey]: (prev[compositeKey] || 0) + 1 }));
    setVariantModalItem(null);
  };

  const increaseQuantity = (compositeKey: string) => setCustomPlate(prev => ({ ...prev, [compositeKey]: (prev[compositeKey] || 0) + 1 }));
  const decreaseQuantity = (compositeKey: string) => {
    setCustomPlate(prev => {
      const current = prev[compositeKey] || 0;
      if (current <= 1) return prev; 
      return { ...prev, [compositeKey]: current - 1 };
    });
  };
  const removeItem = (compositeKey: string) => {
    setCustomPlate(prev => { 
      const newState = { ...prev }; 
      delete newState[compositeKey]; 
      return newState; 
    });
  };
  const clearAll = () => setCustomPlate({});

  // 🪄 THE MAGIC REVEAL: Parsing the composite keys back into rich objects!
  const selectedItemsList = Object.keys(customPlate).map(compositeKey => {
    const { id, variantLabel, multiplier } = parseCompositeKey(compositeKey);
    const dbItem = MENU_ITEMS.find(m => m.id === id);
    const basePrice = dbItem?.price || 0;
    
    // Helper function (add this outside or inside the component)
    // const roundUpToNearest50 = (price: number) => {
    //   if (price % 50 === 0) return price; 
    //   return Math.ceil(price / 50) * 50;
    // };

    // ... inside selectedItemsList map ...
    // let finalPrice = Math.round(basePrice * multiplier);
    // finalPrice = roundUpToNearest50(finalPrice);

    // Round Up Prices To Nearest 100
    const roundUpToNearest100 = (price: number) => {
      if (price % 100 === 0) return price; 
      return Math.ceil(price / 100) * 100;
    };

    // ... inside selectedItemsList map ...
    let finalPrice = Math.round(basePrice * multiplier);
    finalPrice = roundUpToNearest100(finalPrice);

    // If you don't update those files locally, the Modal will correctly show ₦650, but the receipt will charge ₦633! Do you want me to generate the diffs for those files to make it easier for you to copy and paste?
    
    // If it's a variant, append the label to the name so the Kitchen knows!
    const finalName = variantLabel && variantLabel !== 'Base' 
      ? `${dbItem?.name} (${variantLabel})` 
      : (dbItem?.name || 'Unknown Item');

    return {
      compositeKey,
      id,
      name: finalName,
      price: finalPrice,
      qty: customPlate[compositeKey],
      isAvailable: dbItem?.isAvailable !== false,
    };
  });

  const plateTotal = selectedItemsList.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isPackageEmpty = selectedItemsList.length === 0;

  useEffect(() => {
    Animated.spring(floatingButtonAnim, {
      toValue: isPackageEmpty ? 0 : 1, 
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isPackageEmpty, floatingButtonAnim]);

  const handleAddCustomPlateToCart = () => {
    if (isPackageEmpty) return;

    const subItemsArray = selectedItemsList.map(item => ({
      compositeKey: item.compositeKey,
      id: item.id,
      name: item.name,
      qty: item.qty, 
      price: item.price
    }));

    const uniquePackageId = 'custom_' + selectedItemsList.map(i => `${i.compositeKey}_${i.qty}`).sort().join('-');

    const newItem: any = { 
      id: uniquePackageId, 
      name: 'Custom Package', 
      category: 'Custom Plate',
      price: plateTotal, 
      quantity: 1, 
      image: CUSTOM_PACKAGE_IMAGE, 
      isAvailable: true,
      subItems: subItemsArray 
    };
    
    addToCart(newItem);

    Animated.sequence([
      Animated.spring(toastAnim, { toValue: insets.top + 10, useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();

    setCustomPlate({});
  };

  const handleAddForYou = (comboPackage: any) => {
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
      Animated.spring(toastAnim, { toValue: insets.top + 10, useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  }

  return (
    <View style={[menuStyles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Menu"
        leftIcon="menu-outline"
        onLeftPress={() => setIsSidebarOpen(true)}
        rightComponent={
          <View style={menuStyles.headerRight}>
            <TouchableOpacity style={menuStyles.iconButton}>
              <Ionicons name="help-circle-outline" size={26} color="#FFF" />
            </TouchableOpacity>
            <CartBadgeIcon onPress={() => router.push('/cart')} />
          </View>
        }
        isAbsolute={false} 
        isScrolled={true}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[menuStyles.scrollContent, { paddingBottom: bottomNavHeight + 90 }]}
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
        
        <View style={menuStyles.titlesWrapper}>
          <Text style={[menuStyles.specialsText, { color: colors.textMuted }]}>Specials</Text>
          <Text style={[menuStyles.mainTitle, { color: Colors.primary }]}>Made Just For You</Text>
        </View>

        <View style={menuStyles.searchContainer}>
           <SearchBar onPress={() => router.push('/search')} />
        </View>

        {isPackageEmpty ? (
          <View style={[menuStyles.emptyBox, { borderColor: isDark ? colors.border : '#FFCCCC', backgroundColor: isDark ? 'rgba(255,0,0,0.05)' : '#FFF0F0' }]}>
            <Image 
              source={require('../../assets/images/Icon&logo/empty-package.png')}
              style={[menuStyles.emptyPackageIcon, { tintColor: Colors.primary }]}
              resizeMode="contain"
            />
            <Text style={[menuStyles.emptyBoxTitle, { color: Colors.primary }]}>Your package is empty</Text>
            <Text style={[menuStyles.emptyBoxSub, { color: Colors.primary }]}>Click on any food item to add to package</Text>
          </View>
        ) : (
          <View style={[menuStyles.filledBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={menuStyles.filledBoxHeader}>
              <Text style={[menuStyles.filledBoxTitle, { color: colors.text }]}>Items</Text>
              <TouchableOpacity onPress={clearAll}>
                <Text style={menuStyles.deleteAllText}>Delete All</Text>
              </TouchableOpacity>
            </View>
            
            {selectedItemsList.map(item => (
              <View key={item.compositeKey} style={menuStyles.receiptRow}>
                <View style={menuStyles.receiptInfo}>
                  <Text style={[menuStyles.receiptName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                
                <View style={[
                  menuStyles.quantityBox, 
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }
                ]}>
                  <TouchableOpacity onPress={() => decreaseQuantity(item.compositeKey)} style={menuStyles.qtyBtn}>
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[menuStyles.qtyText, { color: colors.text }]}>
                    {item.qty}
                  </Text>
                  <TouchableOpacity onPress={() => increaseQuantity(item.compositeKey)} style={menuStyles.qtyBtn}>
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[menuStyles.receiptPrice, { color: colors.text }]}>
                  ₦{(item.price * item.qty).toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => removeItem(item.compositeKey)} style={menuStyles.trashBtn}>
                  <Ionicons name="trash-outline" size={18} color="#D30000" />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={[menuStyles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[menuStyles.totalText, { color: colors.text }]}>Total</Text>
              <Text style={[menuStyles.totalPrice, { color: colors.text }]}>₦{plateTotal.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <View style={menuStyles.menuTitleRow}>
          <View style={menuStyles.redLine} />
          <Text style={[menuStyles.menuTitle, { color: colors.text }]}>Menu</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={menuStyles.categoryScroll}>
          {MENU_CATEGORIES.map(category => (
            <CategoryFilter key={category} category={category} isActive={activeCategory === category} onPress={() => setActiveCategory(category)} />
          ))}
        </ScrollView>

        <View style={[menuStyles.gridContainer, { gap: GRID_GAP }]}>
          {filteredItems.map(item => {
            // Check if any variant of this base item is in the cart
            const isSelected = Object.keys(customPlate).some(key => key.startsWith(item.id + '::'));
            return (
              <View key={item.id} style={{ width: CARD_WIDTH }}>
                <GridDishCard 
                  name={item.name} 
                  price={`₦${item.price.toLocaleString()}`}
                  image={item.image}
                  isSelected={isSelected}
                  isAvailable={item.isAvailable !== false} 
                  onPress={item.isAvailable !== false ? () => handleCardPress(item) : undefined}
                  isCompact={true}
                />
              </View>
            );
          })}
        </View>

        <ForYouCard onAddToCart={handleAddForYou} />

      </ScrollView>

      <Animated.View pointerEvents={isPackageEmpty ? 'none' : 'auto'} style={[menuStyles.floatingButtonContainer, { bottom: bottomNavHeight + 15, opacity: floatingButtonAnim, transform: [{ translateY: floatingButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <TouchableOpacity style={[menuStyles.mainAddButton, { backgroundColor: Colors.primary }]} activeOpacity={0.8} onPress={handleAddCustomPlateToCart}>
          <Text style={[menuStyles.mainAddButtonText, { color: '#FFF' }]}>{`Add To Cart - ₦${plateTotal.toLocaleString()}`}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[menuStyles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={menuStyles.toastText}>Custom Package added to cart!</Text>
      </Animated.View>

      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* OUR NEW VARIANT MODAL */}
      <ItemVariantModal 
        item={variantModalItem} 
        visible={!!variantModalItem} 
        onClose={() => setVariantModalItem(null)} 
        onAddVariant={handleAddVariant} 
      />

    </View>
  );
}

export const menuStyles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  iconButton: { 
    padding: 5,
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'center',
  },
  scrollContent: { 
  },
  titlesWrapper: { 
    marginTop: 20, 
    marginBottom: 15, 
    paddingHorizontal: 20,
  },
  specialsText: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 2,
  },
  mainTitle: { 
    fontSize: 24, 
    fontWeight: '900',
  },
  searchContainer: { 
    marginBottom: 20, 
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 5,
    paddingHorizontal: 20,
  },
  emptyBox: { 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    borderRadius: 20, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 25, 
    marginHorizontal: 20,
  },
  emptyPackageIcon: {
    width: 110,
    height: 110,
    marginBottom: 0,
  },
  emptyBoxTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 5, 
    marginBottom: 5,
  },
  emptyBoxSub: { 
    fontSize: 13, 
    textAlign: 'center', 
    opacity: 0.8,
  },
  filledBox: { 
    borderWidth: 1, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 25, 
    marginHorizontal: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { 
      width: 0, 
      height: 2 
    }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  filledBoxHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15,
  },
  filledBoxTitle: { 
    fontSize: 16, 
    fontWeight: 'bold',
  },
  deleteAllText: { 
    color: Colors.primary, 
    fontWeight: 'bold', 
    fontSize: 14,
  },
  receiptRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
  },
  receiptInfo: {
    flex: 1,
    paddingRight: 5,
  },
  receiptName: { 
    fontSize: 14, 
    fontWeight: '500',
  },
  soldOutWarningText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 2,
  },
  quantityBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 5, 
    paddingVertical: 5, 
    marginHorizontal: 10,
  },
  qtyBtn: { 
    width: 26, 
    height: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 13, 
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  qtyText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginHorizontal: 8,
  },
  receiptPrice: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    minWidth: 60, 
    textAlign: 'right',
  },
  trashBtn: { 
    marginLeft: 15, 
    padding: 5,
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    paddingTop: 15, 
    marginTop: 5,
  },
  totalText: { 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  totalPrice: { 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  menuTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingHorizontal: 20,
  },
  redLine: { 
    width: 4, 
    height: 18, 
    backgroundColor: Colors.primary, 
    marginRight: 8, 
    borderRadius: 2,
  },
  menuTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginRight: 5,
  },
  categoryScroll: { 
    marginBottom: 20, 
    paddingLeft: 20,
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 10, 
    paddingHorizontal: 20,
  },
  floatingButtonContainer: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    zIndex: 90,
  },
  mainAddButton: { 
    paddingVertical: 18, 
    borderRadius: 25, 
    alignItems: 'center', 
    elevation: 6, 
    shadowColor: '#000', 
    shadowOffset: { 
      width: 0, 
      height: 4 
    }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6,
  },
  mainAddButtonText: { 
    fontSize: 16, 
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
    shadowOffset: { 
      width: 0, 
      height: 5 
    }, 
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