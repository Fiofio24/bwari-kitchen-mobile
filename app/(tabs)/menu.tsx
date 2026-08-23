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
  Image,
  PanResponder
} from 'react-native';
import { useSafeRouter } from '../../hooks/useSafeRouter';
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
import { useMenu } from '../../context/MenuContext';
import { parseCompositeKey } from '../../constants/menuData';
import CartBadgeIcon from '../../components/CartBadgeIcon';
import GridDishCard from '../../components/GridDishCard';
import TopNav from '../../components/TopNav';
import ItemVariantModal from '../../components/ItemVariantModal';
import { scale } from '../../constants/Sizes'; 

export const CUSTOM_PACKAGE_IMAGE = require('../../assets/images/custom-plate.png');

export default function MenuScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, categories, loading, refresh, findItem } = useMenu();
  
  const activeItemCategories = new Set(items.map(item => item.category.name));
  const MENU_CATEGORIES = ['All', ...categories.map(c => c.name).filter(cat => activeItemCategories.has(cat))];
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { addToCart, customPlate, setCustomPlate } = useCart();
  
  const toastAnim = useRef(new Animated.Value(-scale(100))).current;
  const floatingButtonAnim = useRef(new Animated.Value(0)).current;

  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false); 
  const [variantModalItem, setVariantModalItem] = useState<any>(null);

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
  const GRID_PADDING = scale(20); 
  const GRID_GAP = scale(10); 
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  
  const MIN_CARD_WIDTH = scale(105); 
  const NUM_COLUMNS = Math.max(3, Math.floor((AVAILABLE_WIDTH + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const filteredItems = items.filter(item => item.category.name === activeCategory || activeCategory === 'All');
  const bottomNavHeight = scale(70) + Math.max(insets.bottom, scale(15));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // NEW: Terminal Feedback so you know it's working!
    console.log("🔄 Reloading Menu data...");
    try {
      await refresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false); 
    }
  }, [refresh]);

  const handleCardPress = (item: any) => {
    const existingKeys = Object.keys(customPlate).filter(key => key.startsWith(item.id + '::'));

    if (existingKeys.length > 0) {
      setCustomPlate(prev => {
        const newState = { ...prev };
        existingKeys.forEach(key => delete newState[key]);
        return newState;
      });
    } else {
      if (item.variants && item.variants.length > 0) {
        setVariantModalItem(item);
      } else {
        const compositeKey = `${item.id}::Base::${item.basePrice}`;
        setCustomPlate(prev => ({ ...prev, [compositeKey]: 1 }));
      }
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

  const selectedItemsList = Object.keys(customPlate).map(compositeKey => {
    const { id, variantLabel, variantPrice } = parseCompositeKey(compositeKey);
    const dbItem = findItem(id);
    const finalPrice = variantPrice !== null ? variantPrice : (dbItem?.basePrice || 0);
    const finalName = variantLabel && variantLabel !== 'Base' 
      ? `${dbItem?.name} (${variantLabel})` 
      : (dbItem?.name || 'Unknown Item');

    return {
      compositeKey,
      id,
      name: finalName,
      variantLabel: variantLabel && variantLabel !== 'Base' ? variantLabel : null,
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
      variantLabel: item.variantLabel,
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
      Animated.spring(toastAnim, { toValue: insets.top + scale(10), useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -scale(100), duration: 300, useNativeDriver: true })
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
      Animated.spring(toastAnim, { toValue: insets.top + scale(10), useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -scale(100), duration: 300, useNativeDriver: true })
    ]).start();
  }

  if (loading && items.length === 0) {
    return (
      <View style={[menuStyles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <Text style={{ color: colors.text }}>Loading menu...</Text>
      </View>
    );
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
              <Ionicons name="help-circle-outline" size={scale(26)} color="#FFF" />
            </TouchableOpacity>
            <CartBadgeIcon onPress={() => router.push('/cart')} />
          </View>
        }
        isAbsolute={false} 
        isScrolled={true}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[menuStyles.scrollContent, { paddingBottom: bottomNavHeight + scale(90) }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDark ? "#FFF" : Colors.primary} // High Contrast Fix
            colors={[Colors.primary]} 
            progressBackgroundColor={isDark ? colors.surface : '#FFF'} 
          />
        }
      >
        
        <View style={menuStyles.titlesWrapper}>
          <Text style={[menuStyles.specialsText, { color: colors.textMuted }]}>Specials</Text>
          <Text style={[menuStyles.mainTitle, { color: Colors.primary }]}>Made Just For You</Text>
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
                    <Ionicons name="remove" size={scale(16)} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[menuStyles.qtyText, { color: colors.text }]}>
                    {item.qty}
                  </Text>
                  <TouchableOpacity onPress={() => increaseQuantity(item.compositeKey)} style={menuStyles.qtyBtn}>
                    <Ionicons name="add" size={scale(16)} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[menuStyles.receiptPrice, { color: colors.text }]}>
                  ₦{(item.price * item.qty).toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => removeItem(item.compositeKey)} style={menuStyles.trashBtn}>
                  <Ionicons name="trash-outline" size={scale(18)} color="#D30000" />
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
          <Ionicons name="chevron-forward" size={scale(18)} color={colors.text} />
        </View>

        <View style={menuStyles.searchContainer}>
           <SearchBar onPress={() => router.push('/search')} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={menuStyles.categoryScroll}>
          {MENU_CATEGORIES.map(category => (
            <CategoryFilter key={category} category={category} isActive={activeCategory === category} onPress={() => setActiveCategory(category)} />
          ))}
        </ScrollView>

        <View style={[menuStyles.gridContainer, { gap: GRID_GAP }]}>
          {filteredItems.map(item => {
            const isSelected = Object.keys(customPlate).some(key => key.startsWith(item.id + '::'));
            return (
              <View key={item.id} style={{ width: CARD_WIDTH }}>
                <GridDishCard 
                  name={item.name} 
                  price={`₦${item.basePrice.toLocaleString()}`}
                  image={item.imageUrl || CUSTOM_PACKAGE_IMAGE}
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

      <Animated.View pointerEvents={isPackageEmpty ? 'none' : 'auto'} style={[menuStyles.floatingButtonContainer, { bottom: bottomNavHeight + scale(15), opacity: floatingButtonAnim, transform: [{ translateY: floatingButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [scale(20), 0] }) }] }]}>
        <TouchableOpacity style={[menuStyles.mainAddButton, { backgroundColor: Colors.primary }]} activeOpacity={0.8} onPress={handleAddCustomPlateToCart}>
          <Text style={[menuStyles.mainAddButtonText, { color: '#FFF' }]}>{`Add To Cart - ₦${plateTotal.toLocaleString()}`}</Text>
        </TouchableOpacity>
      </Animated.View>
    
      <Animated.View 
        {...panResponder.panHandlers}
        style={[menuStyles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}
      >
        <Ionicons name="checkmark-circle" size={scale(24)} color="#4CAF50" />
        <Text style={menuStyles.toastText}>Custom Package added to cart!</Text>
      </Animated.View>

      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
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
    padding: scale(5),
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: scale(10), 
    alignItems: 'center',
  },
  scrollContent: { 
  },
  titlesWrapper: { 
    marginTop: scale(20), 
    marginBottom: scale(15), 
    paddingHorizontal: scale(20),
  },
  specialsText: { 
    fontSize: scale(14), 
    fontWeight: '600', 
    marginBottom: scale(2),
  },
  mainTitle: { 
    fontSize: scale(24), 
    fontWeight: '900',
  },
  searchContainer: { 
    marginBottom: scale(20), 
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: scale(12),
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: scale(10),
    marginTop: scale(5),
    paddingHorizontal: scale(20),
  },
  emptyBox: { 
    borderWidth: scale(2), 
    borderStyle: 'dashed', 
    borderRadius: scale(20), 
    padding: scale(30), 
    alignItems: 'center', 
    marginBottom: scale(25), 
    marginHorizontal: scale(20),
  },
  emptyPackageIcon: {
    width: scale(110),
    height: scale(110),
    marginBottom: 0,
  },
  emptyBoxTitle: { 
    fontSize: scale(18), 
    fontWeight: 'bold', 
    marginTop: scale(5), 
    marginBottom: scale(5),
  },
  emptyBoxSub: { 
    fontSize: scale(13), 
    textAlign: 'center', 
    opacity: 0.8,
  },
  filledBox: { 
    borderWidth: 1, 
    borderRadius: scale(20), 
    padding: scale(20), 
    marginBottom: scale(25), 
    marginHorizontal: scale(20), 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: scale(2) }, 
    shadowOpacity: 0.1, 
    shadowRadius: scale(4),
  },
  filledBoxHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: scale(15),
  },
  filledBoxTitle: { 
    fontSize: scale(16), 
    fontWeight: 'bold',
  },
  deleteAllText: { 
    color: Colors.primary, 
    fontWeight: 'bold', 
    fontSize: scale(14),
  },
  receiptRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scale(15),
  },
  receiptInfo: {
    flex: 1,
    paddingRight: scale(5),
  },
  receiptName: { 
    fontSize: scale(14), 
    fontWeight: '500',
  },
  soldOutWarningText: {
    fontSize: scale(11),
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: scale(2),
  },
  quantityBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: scale(20), 
    paddingHorizontal: scale(5), 
    paddingVertical: scale(5), 
    marginHorizontal: scale(10),
  },
  qtyBtn: { 
    width: scale(26), 
    height: scale(26), 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: scale(13), 
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  qtyText: { 
    fontSize: scale(14), 
    fontWeight: 'bold', 
    marginHorizontal: scale(8),
  },
  receiptPrice: { 
    fontSize: scale(14), 
    fontWeight: 'bold', 
    minWidth: scale(60), 
    textAlign: 'right',
  },
  trashBtn: { 
    marginLeft: scale(15), 
    padding: scale(5),
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    paddingTop: scale(15), 
    marginTop: scale(5),
  },
  totalText: { 
    fontSize: scale(18), 
    fontWeight: 'bold',
  },
  totalPrice: { 
    fontSize: scale(18), 
    fontWeight: 'bold',
  },
  menuTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scale(15), 
    paddingHorizontal: scale(20),
  },
  redLine: { 
    width: scale(4), 
    height: scale(18), 
    backgroundColor: Colors.primary, 
    marginRight: scale(8), 
    borderRadius: scale(2),
  },
  menuTitle: { 
    fontSize: scale(18), 
    fontWeight: 'bold', 
    marginRight: scale(5),
  },
  categoryScroll: { 
    marginBottom: scale(20), 
    paddingLeft: scale(20),
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: scale(10), 
    paddingHorizontal: scale(20),
  },
  floatingButtonContainer: { 
    position: 'absolute', 
    left: scale(20), 
    right: scale(20), 
    zIndex: 90,
  },
  mainAddButton: { 
    paddingVertical: scale(18), 
    borderRadius: scale(25), 
    alignItems: 'center', 
    elevation: 6, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: scale(4) }, 
    shadowOpacity: 0.3, 
    shadowRadius: scale(6),
  },
  mainAddButtonText: { 
    fontSize: scale(16), 
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