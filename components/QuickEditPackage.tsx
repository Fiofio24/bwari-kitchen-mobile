import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback, 
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { parseCompositeKey } from '../constants/menuData';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; 
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import GridDishCard from './GridDishCard';
import ItemVariantModal from './ItemVariantModal';

// Make sure it matches the exact custom plate from the menu screen!
const CUSTOM_PACKAGE_IMAGE = require('../assets/images/custom-plate.png');

const { height, width } = Dimensions.get('window');

interface QuickEditPackageProps {
  visible: boolean;
  onClose: () => void;
  initialItem: any;
  routeOnSave?: boolean; 
}

export default function QuickEditPackage({ 
  visible, 
  onClose, 
  initialItem, 
  routeOnSave = true 
}: QuickEditPackageProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartItems, addToCart, removeFromCart } = useCart();

  const { items: MENU_ITEMS, categories, findItem } = useMenu();
  const MENU_CATEGORIES = ['Main', ...categories.map(c => c.name)];

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRendering, setIsRendering] = useState(visible);

  const [activeCategory, setActiveCategory] = useState('Main');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPlate, setCustomPlate] = useState<Record<string, number>>({});
  
  const [variantModalItem, setVariantModalItem] = useState<any>(null);

  const GRID_PADDING = 20; 
  const GRID_GAP = 10; 
  const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
  const MIN_CARD_WIDTH = 105; 
  const NUM_COLUMNS = Math.max(3, Math.floor((AVAILABLE_WIDTH + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((AVAILABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  useEffect(() => {
    if (visible && initialItem) {
      setIsRendering(true);
      setSearchQuery('');
      setActiveCategory('Main');
      
      const initialPlate: Record<string, number> = {};
      
      // THE ULTIMATE SAFEGUARD: Smart mapping that fixes missing data from anywhere!
      if (initialItem.subItems && initialItem.subItems.length > 0) {
        initialItem.subItems.forEach((sub: any) => {
          // 1. Look up the live item in the database
          const dbItem = findItem(sub.id);
          
          // 2. Find the true price (use sub.price if valid, otherwise use the live DB price)
          const actualPrice = (sub.price !== undefined && sub.price > 1) 
            ? sub.price 
            : (dbItem?.basePrice || 0);
            
          // 3. Check if the key is broken or missing, and rebuild it perfectly!
          let key = sub.compositeKey;
          if (!key || key.includes('::1') || key.includes('::null')) {
            key = `${sub.id}::${sub.variantLabel || 'Base'}::${actualPrice}`;
          }
          
          // 4. Mount it to the plate
          initialPlate[key] = sub.qty || 1;
        });
      } else {
        const basePrice = initialItem.basePrice ?? initialItem.price ?? 0;
        initialPlate[`${initialItem.id}::Base::${basePrice}`] = 1;
      }
      setCustomPlate(initialPlate);

      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.spring(slideAnim, { 
          toValue: 0, 
          friction: 8, 
          tension: 60, 
          useNativeDriver: true 
        })
      ]).start();
    } else if (!visible && isRendering) {
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 0, 
          duration: 250, 
          useNativeDriver: true 
        }),
        Animated.timing(slideAnim, { 
          toValue: height, 
          duration: 250, 
          useNativeDriver: true 
        })
      ]).start(() => setIsRendering(false));
    }
  }, [visible, initialItem, fadeAnim, slideAnim, isRendering, findItem]);

  if (!isRendering || !initialItem) return null;

  const handleCardPress = (item: any) => {
    // 1. Check if ANY variant of this item is already in the custom plate
    const existingKeys = Object.keys(customPlate).filter(key => key.startsWith(item.id + '::'));

    if (existingKeys.length > 0) {
      // 2. If it is already selected, DESELECT IT by completely removing it
      setCustomPlate(prev => {
        const newState = { ...prev };
        existingKeys.forEach(key => delete newState[key]);
        return newState;
      });
    } else {
      // 3. If it is NOT selected, proceed to add it or open the portion modal
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

  const increaseQuantity = (compositeKey: string) => {
    setCustomPlate(prev => ({ ...prev, [compositeKey]: (prev[compositeKey] || 0) + 1 }));
  };

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
  const hasSoldOutSelected = selectedItemsList.some(item => !item.isAvailable);

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'Main' || item.category.name === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUpdateAndAdd = () => {
    if (isPackageEmpty || hasSoldOutSelected) return;

    if (cartItems.some(i => i.id === initialItem.id)) {
      removeFromCart(initialItem.id);
    }

    const uniquePackageId = 'custom_edit_' + Date.now() + '_' + selectedItemsList.map(i => `${i.compositeKey}_${i.qty}`).join('-');

    const newItem: any = { 
      id: uniquePackageId, 
      name: `Customized Package`, 
      category: 'Custom Package',
      price: plateTotal, 
      quantity: initialItem.quantity || 1, 
      image: CUSTOM_PACKAGE_IMAGE,
      isAvailable: true,
      subItems: selectedItemsList 
    };
    
    addToCart(newItem);
    onClose();
    
    if (routeOnSave) {
      setTimeout(() => {
        router.push('/cart');
      }, 300);
    }
  };

  return (
    <>
      <Modal visible={isRendering} transparent={true} animationType="none" onRequestClose={onClose} statusBarTranslucent={true}>
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  opacity: fadeAnim, 
                  backgroundColor: 'rgba(0,0,0,0.6)' 
                }
              ]} 
            />
          </TouchableWithoutFeedback>

          <Animated.View 
            style={[
              styles.bottomSheet, 
              { 
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.handlebarWrapper}>
              <View style={[styles.handlebar, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Quick Edit Package</Text>
              <TouchableOpacity 
                onPress={onClose} 
                style={[
                  styles.closeBtn, 
                  { backgroundColor: isDark ? colors.surface : '#F5F5F5' }
                ]}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <View style={styles.searchContainer}>
                <SearchBar onSubmit={(text) => setSearchQuery(text)} />
              </View>
              
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CURRENT ITEMS</Text>
              
              {isPackageEmpty ? (
                <View 
                  style={[
                    styles.emptyBox, 
                    { 
                      borderColor: '#FFCCCC', 
                      backgroundColor: isDark ? 'rgba(255,0,0,0.05)' : '#FFF0F0' 
                    }
                  ]}
                >
                  <Image 
                    source={CUSTOM_PACKAGE_IMAGE}
                    style={[styles.emptyPackageIcon, { tintColor: Colors.primary }]}
                    resizeMode="contain"
                  />
                  <Text style={[styles.emptyBoxTitle, { color: Colors.primary }]}>Your package is empty</Text>
                  <Text style={[styles.emptyBoxSub, { color: Colors.primary }]}>Click on any food item to add to package</Text>
                </View>
              ) : (
                <View style={[styles.filledBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.filledBoxHeader}>
                    <Text style={[styles.filledBoxTitle, { color: colors.text }]}>Items</Text>
                    <TouchableOpacity onPress={clearAll}>
                      <Text style={styles.deleteAllText}>Delete All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {selectedItemsList.map(item => (
                    <View key={item.compositeKey} style={styles.receiptRow}>
                      <View style={styles.receiptInfo}>
                        <Text 
                          style={[
                            styles.receiptName, 
                            { color: !item.isAvailable ? '#D32F2F' : colors.text },
                            !item.isAvailable && { textDecorationLine: 'line-through' }
                          ]} 
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {!item.isAvailable && (
                          <Text style={styles.soldOutWarningText}>Sold Out - Remove</Text>
                        )}
                      </View>
                      
                      <View style={[
                        styles.quantityBox, 
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }
                      ]}>
                        <TouchableOpacity onPress={() => decreaseQuantity(item.compositeKey)} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={16} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: colors.text }]}>
                          {item.qty}
                        </Text>
                        <TouchableOpacity onPress={() => increaseQuantity(item.compositeKey)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={16} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.receiptPrice, { color: colors.text }]}>
                        ₦{(item.price * item.qty).toLocaleString()}
                      </Text>
                      <TouchableOpacity onPress={() => removeItem(item.compositeKey)} style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.totalText, { color: colors.text }]}>Total</Text>
                    <Text style={[styles.totalPrice, { color: colors.text }]}>₦{plateTotal.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 15 }]}>ADD FROM MENU</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {MENU_CATEGORIES.map(category => (
                  <CategoryFilter 
                    key={category} 
                    category={category} 
                    isActive={activeCategory === category} 
                    onPress={() => setActiveCategory(category)} 
                  />
                ))}
              </ScrollView>

              <View style={[styles.gridContainer, { gap: GRID_GAP }]}>
                {filteredItems.map(item => {
                  const isSelected = Object.keys(customPlate).some(key => key.startsWith(item.id + '::'));
                  return (
                    <View key={item.id} style={{ width: CARD_WIDTH }}>
                      <GridDishCard 
                        name={item.name} 
                        price={`₦${item.basePrice.toLocaleString()}`}
                        image={item.imageUrl || 'https://cdn-icons-png.flaticon.com/512/684/684045.png'}
                        isSelected={isSelected}
                        isAvailable={item.isAvailable !== false} 
                        onPress={item.isAvailable !== false ? () => handleCardPress(item) : undefined}
                        isCompact={true}
                      />
                    </View>
                  );
                })}
              </View>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              <TouchableOpacity 
                style={[
                  styles.saveBtn, 
                  { backgroundColor: (isPackageEmpty || hasSoldOutSelected) ? colors.border : Colors.primary }
                ]} 
                disabled={isPackageEmpty || hasSoldOutSelected}
                activeOpacity={0.8}
                onPress={handleUpdateAndAdd}
              >
                <Text style={[
                  styles.saveBtnText, 
                  { color: (isPackageEmpty || hasSoldOutSelected) ? colors.textMuted : '#FFF' }
                ]}>
                  {hasSoldOutSelected ? "Remove Sold Out Items" : "Save Custom Package"}
                </Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>
      </Modal>

      <ItemVariantModal 
        item={variantModalItem} 
        visible={!!variantModalItem} 
        onClose={() => setVariantModalItem(null)} 
        onAddVariant={handleAddVariant} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    elevation: 1000,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { 
      width: 0, 
      height: -5 
    },
  },
  handlebarWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handlebar: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: { 
    marginBottom: 20, 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    letterSpacing: 1, 
    marginBottom: 10, 
    marginTop: 5, 
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
  emptyPackageIcon: { 
    width: 110, 
    height: 110, 
    marginBottom: 0 
  },
  emptyBoxTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 5, 
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
  receiptInfo: { 
    flex: 1, 
    paddingRight: 5 
  },
  receiptName: { 
    fontSize: 14, 
    fontWeight: '500' 
  },
  soldOutWarningText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#D32F2F', 
    marginTop: 2 
  },
  quantityBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 5, 
    paddingVertical: 5, 
    marginHorizontal: 10 
  },
  qtyBtn: { 
    width: 26, 
    height: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 13, 
    backgroundColor: 'rgba(150,150,150,0.2)' 
  },
  qtyText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginHorizontal: 8 
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
  categoryScroll: { 
    marginBottom: 20, 
    paddingLeft: 20 
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 10, 
    paddingHorizontal: 20 
  },
});