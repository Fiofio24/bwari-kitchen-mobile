// Note: This file requires an Expo/React Native environment to compile correctly.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Animated, useWindowDimensions } from 'react-native';
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
import { MENU_ITEMS } from '../../constants/menuData';
import CartBadgeIcon from '../../components/CartBadgeIcon';

const MENU_CATEGORIES = ['Main', 'Protein', 'Swallow', 'Snacks', 'Drinks', 'Rice'];

export default function MenuScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { addToCart } = useCart();
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const floatingButtonAnim = useRef(new Animated.Value(0)).current;

  const [activeCategory, setActiveCategory] = useState('Main');
  const [customPlate, setCustomPlate] = useState<Record<string, number>>({});

  const { width } = useWindowDimensions();
  const GRID_PADDING = 20; 
  const GRID_GAP = 15;     
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const NUM_COLUMNS = 3; 
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const filteredItems = MENU_ITEMS.filter(item => item.category === activeCategory || activeCategory === 'Main');
  const bottomNavHeight = 70 + Math.max(insets.bottom, 15);

  const toggleItem = (id: string) => {
    setCustomPlate(prev => {
      if (prev[id]) { const newState = { ...prev }; delete newState[id]; return newState; }
      return { ...prev, [id]: 1 };
    });
  };

  const increaseQuantity = (id: string) => setCustomPlate(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const decreaseQuantity = (id: string) => {
    setCustomPlate(prev => {
      const current = prev[id] || 0;
      if (current <= 1) return prev; 
      return { ...prev, [id]: current - 1 };
    });
  };
  const removeItem = (id: string) => {
    setCustomPlate(prev => { const newState = { ...prev }; delete newState[id]; return newState; });
  };
  const clearAll = () => setCustomPlate({});

  const selectedItemsList = MENU_ITEMS.filter(item => (customPlate[item.id] || 0) > 0);
  const plateTotal = selectedItemsList.reduce((sum, item) => sum + (item.price * (customPlate[item.id] || 0)), 0);
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
      id: item.id,
      name: item.name,
      qty: customPlate[item.id] || 1, 
      price: item.price
    }));

    const uniquePackageId = `custom_pkg_${Date.now()}`;

    const newItem: any = { 
      id: uniquePackageId, 
      name: 'Custom Package', 
      category: 'Custom Plate',
      price: plateTotal, 
      quantity: 1, 
      image: selectedItemsList[0]?.image || '', 
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
      Animated.spring(toastAnim, { toValue: insets.top + 10, useNativeDriver: true, friction: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  }

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop, paddingBottom }]}>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={[styles.iconButton, styles.sideIcon]}>
          <Ionicons name="menu-outline" size={28} color="#FFF" />
        </TouchableOpacity>
        
        {/* TRUE CENTERED TITLE WRAPPER */}
        <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="none">
          <Text style={styles.headerTitle}>Menu</Text>
        </View>

        <View style={[styles.headerRight, styles.sideIcon]}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="help-circle-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <CartBadgeIcon onPress={() => router.push('/cart')} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 90 }]}>
        
        <View style={styles.titlesWrapper}>
          <Text style={[styles.specialsText, { color: colors.textMuted }]}>Specials</Text>
          <Text style={[styles.mainTitle, { color: Colors.primary }]}>Made Just For You</Text>
        </View>

        <View style={styles.searchContainer}>
           <SearchBar onPress={() => router.push('/search')} />
        </View>

        {isPackageEmpty ? (
          <View style={[styles.emptyBox, { borderColor: isDark ? colors.border : '#FFCCCC', backgroundColor: isDark ? 'rgba(255,0,0,0.05)' : '#FFF0F0' }]}>
            <Ionicons name="cube-outline" size={50} color={Colors.primary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyBoxTitle, { color: Colors.primary }]}>Your package is empty</Text>
            <Text style={[styles.emptyBoxSub, { color: Colors.primary }]}>Click on any food item to add to package</Text>
          </View>
        ) : (
          <View style={[styles.filledBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.filledBoxHeader}>
              <Text style={[styles.filledBoxTitle, { color: colors.text }]}>Items</Text>
              <TouchableOpacity onPress={clearAll}><Text style={styles.deleteAllText}>Delete All</Text></TouchableOpacity>
            </View>
            {selectedItemsList.map(item => (
              <View key={item.id} style={styles.receiptRow}>
                <Text style={[styles.receiptName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.receiptControls}>
                  <TouchableOpacity onPress={() => decreaseQuantity(item.id)} style={styles.receiptBtn}><Ionicons name="remove" size={14} color="#000" /></TouchableOpacity>
                  <Text style={[styles.receiptQty, { color: colors.text }]}>{customPlate[item.id]}</Text>
                  <TouchableOpacity onPress={() => increaseQuantity(item.id)} style={styles.receiptBtn}><Ionicons name="add" size={14} color="#FFF" /></TouchableOpacity>
                </View>
                <Text style={[styles.receiptPrice, { color: colors.text }]}>₦{(item.price * (customPlate[item.id] || 0)).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.trashBtn}><Ionicons name="trash-outline" size={18} color="#FF4444" /></TouchableOpacity>
              </View>
            ))}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalText, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalPrice, { color: colors.text }]}>₦{plateTotal.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <View style={styles.menuTitleRow}>
          <View style={styles.redLine} />
          <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {MENU_CATEGORIES.map(category => (
            <CategoryFilter key={category} category={category} isActive={activeCategory === category} onPress={() => setActiveCategory(category)} />
          ))}
        </ScrollView>

        <View style={styles.gridContainer}>
          {filteredItems.map(item => {
            const isSelected = (customPlate[item.id] || 0) > 0;
            return (
              <TouchableOpacity key={item.id} style={[styles.gridCard, { width: CARD_WIDTH }]} activeOpacity={0.8} onPress={() => toggleItem(item.id)}>
                <View style={styles.gridImageWrapper}>
                  <Image source={{ uri: item.image }} style={styles.gridImage} />
                  {isSelected && (
                    <View style={styles.gridOverlay}>
                      <View style={styles.checkCircle}><Ionicons name="checkmark" size={14} color="#000" /></View>
                    </View>
                  )}
                </View>
                <Text style={[styles.gridName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ForYouCard onAddToCart={handleAddForYou} />

      </ScrollView>

      <Animated.View pointerEvents={isPackageEmpty ? 'none' : 'auto'} style={[styles.floatingButtonContainer, { bottom: bottomNavHeight + 15, opacity: floatingButtonAnim, transform: [{ translateY: floatingButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <TouchableOpacity style={[styles.mainAddButton, { backgroundColor: Colors.primary }]} activeOpacity={0.8} onPress={handleAddCustomPlateToCart}>
          <Text style={[styles.mainAddButtonText, { color: '#FFF' }]}>{`Add To Cart - ₦${plateTotal.toLocaleString()}`}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }], backgroundColor: isDark ? '#333' : '#222' }]}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={styles.toastText}>Custom Package added to cart!</Text>
      </Animated.View>

      <Sidebar visible={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    backgroundColor: Colors.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    zIndex: 10 
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
    padding: 5 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'center' 
  },
  scrollContent: { 
  },
  titlesWrapper: { 
    marginTop: 20, 
    marginBottom: 15, 
    paddingHorizontal: 20 
  },
  specialsText: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 2 
  },
  mainTitle: { 
    fontSize: 24, 
    fontWeight: '900' 
  },
  searchContainer: { 
    marginBottom: 20, 
    paddingHorizontal: 20 
  },
  emptyBox: { 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    borderRadius: 20, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 25, 
    marginHorizontal: 20 
  },
  emptyBoxTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 10, 
    marginBottom: 5 
  },
  emptyBoxSub: { 
    fontSize: 13, 
    textAlign: 'center', 
    opacity: 0.8 
  },
  filledBox: { 
    borderWidth: 1, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 25, 
    marginHorizontal: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  filledBoxHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  filledBoxTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  deleteAllText: { 
    color: Colors.primary, 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  receiptRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  receiptName: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  receiptControls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0F0F0', 
    borderRadius: 20, 
    paddingHorizontal: 4, 
    paddingVertical: 4, 
    marginHorizontal: 10 
  },
  receiptBtn: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Colors.primary 
  },
  receiptQty: { 
    marginHorizontal: 10, 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  receiptPrice: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    minWidth: 60, 
    textAlign: 'right' 
  },
  trashBtn: { 
    marginLeft: 15, 
    padding: 5 
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    paddingTop: 15, 
    marginTop: 5 
  },
  totalText: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  totalPrice: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  menuTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingHorizontal: 20 
  },
  redLine: { 
    width: 4, 
    height: 18, 
    backgroundColor: Colors.primary, 
    marginRight: 8, 
    borderRadius: 2 
  },
  menuTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginRight: 5 
  },
  categoryScroll: { 
    marginBottom: 20, 
    paddingLeft: 20 
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15, 
    marginBottom: 10, 
    paddingHorizontal: 20 
  },
  gridCard: { 
  }, 
  gridImageWrapper: { 
    width: '100%', 
    aspectRatio: 1, 
    borderRadius: 15, 
    overflow: 'hidden', 
    backgroundColor: '#EEE', 
    marginBottom: 8 
  },
  gridImage: { 
    width: '100%', 
    height: '100%' 
  },
  gridOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkCircle: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  gridName: { 
    fontSize: 13, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  floatingButtonContainer: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    zIndex: 90 
  },
  mainAddButton: { 
    paddingVertical: 18, 
    borderRadius: 25, 
    alignItems: 'center', 
    elevation: 6, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6 
  },
  mainAddButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
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
    gap: 10 
  },
  toastText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});