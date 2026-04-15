// Note: This file requires an Expo/React Native environment to compile correctly.
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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { MENU_ITEMS } from '../constants/menuData';
import { useCart } from '../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; 
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import GridDishCard from './GridDishCard';

// PRO DRY FIX: We dynamically import the exact styles from the Menu page!
import { menuStyles } from '../app/(tabs)/menu';

const { height, width } = Dimensions.get('window');
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const MENU_CATEGORIES = ['Main', 'Protein', 'Swallow', 'Snacks', 'Drinks', 'Rice'];

interface QuickEditPackageProps {
  visible: boolean;
  onClose: () => void;
  initialItem: any;
}

export default function QuickEditPackage({ visible, onClose, initialItem }: QuickEditPackageProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartItems, addToCart, removeFromCart } = useCart();

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRendering, setIsRendering] = useState(visible);

  const [activeCategory, setActiveCategory] = useState('Main');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPlate, setCustomPlate] = useState<Record<string, number>>({});

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
      if (initialItem.subItems && initialItem.subItems.length > 0) {
        initialItem.subItems.forEach((sub: any) => {
          initialPlate[sub.id] = sub.qty;
        });
      } else {
        initialPlate[initialItem.id] = 1;
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
  }, [visible, initialItem, fadeAnim, slideAnim, isRendering]);

  if (!isRendering || !initialItem) return null;

  const toggleItem = (id: string) => {
    setCustomPlate(prev => {
      if (prev[id]) { 
        const newState = { ...prev }; 
        delete newState[id]; 
        return newState; 
      }
      return { ...prev, [id]: 1 };
    });
  };

  const increaseQuantity = (id: string) => {
    setCustomPlate(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decreaseQuantity = (id: string) => {
    setCustomPlate(prev => {
      const current = prev[id] || 0;
      if (current <= 1) return prev; 
      return { ...prev, [id]: current - 1 };
    });
  };

  const removeItem = (id: string) => {
    setCustomPlate(prev => { 
      const newState = { ...prev }; 
      delete newState[id]; 
      return newState; 
    });
  };

  const clearAll = () => setCustomPlate({});

  const selectedItemsList = Object.keys(customPlate).map(id => {
    const dbItem = MENU_ITEMS.find(m => m.id === id);
    return {
      id,
      name: dbItem?.name || 'Unknown Item',
      price: dbItem?.price || 0,
      qty: customPlate[id],
      isAvailable: dbItem?.isAvailable !== false,
      image: dbItem?.image || '' 
    };
  });

  const plateTotal = selectedItemsList.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isPackageEmpty = selectedItemsList.length === 0;
  const hasSoldOutSelected = selectedItemsList.some(item => !item.isAvailable);

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'Main' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUpdateAndAdd = () => {
    if (isPackageEmpty || hasSoldOutSelected) return;

    if (cartItems.some(i => i.id === initialItem.id)) {
      removeFromCart(initialItem.id);
    }

    const uniquePackageId = 'custom_edit_' + Date.now() + '_' + selectedItemsList.map(i => `${i.id}_${i.qty}`).join('-');

    const newItem: any = { 
      id: uniquePackageId, 
      name: `Customized Package`, 
      category: 'Custom Plate',
      price: plateTotal, 
      quantity: initialItem.quantity || 1, 
      image: selectedItemsList[0]?.image || initialItem.image, 
      isAvailable: true,
      subItems: selectedItemsList 
    };
    
    addToCart(newItem);
    onClose();
    
    setTimeout(() => {
      router.push('/cart');
    }, 300);
  };

  return (
    <Modal visible={isRendering} transparent={true} animationType="none" onRequestClose={onClose} statusBarTranslucent={true}>
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <AnimatedBlurView 
            intensity={20} 
            tint="dark" 
            experimentalBlurMethod="dimezisBlurView" 
            style={[
              StyleSheet.absoluteFill, 
              { 
                opacity: fadeAnim, 
                backgroundColor: 'rgba(0,0,0,0.4)' 
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
            
            <View style={menuStyles.searchContainer}>
              <SearchBar onSubmit={(text) => setSearchQuery(text)} />
            </View>
            
            <Text style={[menuStyles.sectionTitle, { color: colors.textMuted }]}>CURRENT ITEMS</Text>
            
            {/* PRO DRY FIX: Using menuStyles perfectly ensures consistency! */}
            {isPackageEmpty ? (
              <View 
                style={[
                  menuStyles.emptyBox, 
                  { 
                    borderColor: '#FFCCCC', 
                    backgroundColor: isDark ? 'rgba(255,0,0,0.05)' : '#FFF0F0' 
                  }
                ]}
              >
                <Ionicons name="cube-outline" size={40} color={Colors.primary} />
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
                  <View key={item.id} style={menuStyles.receiptRow}>
                    <View style={menuStyles.receiptInfo}>
                      <Text 
                        style={[
                          menuStyles.receiptName, 
                          { color: !item.isAvailable ? '#D32F2F' : colors.text },
                          !item.isAvailable && { textDecorationLine: 'line-through' }
                        ]} 
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {!item.isAvailable && (
                        <Text style={menuStyles.soldOutWarningText}>Sold Out - Remove</Text>
                      )}
                    </View>
                    
                    <View style={[
                      menuStyles.quantityBox, 
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }
                    ]}>
                      <TouchableOpacity onPress={() => decreaseQuantity(item.id)} style={menuStyles.qtyBtn}>
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[menuStyles.qtyText, { color: colors.text }]}>
                        {customPlate[item.id]}
                      </Text>
                      <TouchableOpacity onPress={() => increaseQuantity(item.id)} style={menuStyles.qtyBtn}>
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[menuStyles.receiptPrice, { color: colors.text }]}>
                      ₦{(item.price * (customPlate[item.id] || 0)).toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={menuStyles.trashBtn}>
                      <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={[menuStyles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[menuStyles.totalText, { color: colors.text }]}>Total</Text>
                  <Text style={[menuStyles.totalPrice, { color: colors.text }]}>₦{plateTotal.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <Text style={[menuStyles.sectionTitle, { color: colors.textMuted, marginTop: 15 }]}>ADD FROM MENU</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={menuStyles.categoryScroll}>
              {MENU_CATEGORIES.map(category => (
                <CategoryFilter 
                  key={category} 
                  category={category} 
                  isActive={activeCategory === category} 
                  onPress={() => setActiveCategory(category)} 
                />
              ))}
            </ScrollView>

            <View style={[menuStyles.gridContainer, { gap: GRID_GAP }]}>
              {filteredItems.map(item => {
                const isSelected = (customPlate[item.id] || 0) > 0;
                return (
                  <View key={item.id} style={{ width: CARD_WIDTH }}>
                    <GridDishCard 
                      name={item.name} 
                      price={`₦${item.price.toLocaleString()}`}
                      image={item.image}
                      isSelected={isSelected}
                      isAvailable={item.isAvailable !== false} 
                      onPress={item.isAvailable !== false ? () => toggleItem(item.id) : undefined}
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
  );
}

// PRO DRY FIX: Component drastically shrinks since the bulk UI styling is dynamically imported from menuStyles!
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
});