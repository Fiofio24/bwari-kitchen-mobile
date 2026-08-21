import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ImageBackground, 
  Platform,
  Animated,
  RefreshControl,
  PanResponder,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoriteContext';
import { useMenu } from '../context/MenuContext';
import { LinearGradient } from 'expo-linear-gradient';
import QuickEditPackage from '../components/QuickEditPackage';
import CartBadgeIcon from '../components/CartBadgeIcon'; 
import HomeIcon from '@/components/HomeIcon';
import TopNav from '../components/TopNav';
import ForYouCard from '../components/ForYouCard';
import { scale } from '../constants/Sizes'; 

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // MODIFIED: Pulling setCustomPlate globally!
  const { addToCart, setCustomPlate } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [quantity, setQuantity] = useState(1);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); 
  const [refreshing, setRefreshing] = useState(false);
  
  // NEW: State for our Slide-up Package Options Modal
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  
  const toastAnim = useRef(new Animated.Value(-scale(100))).current;

  const { findItem, findPackage, loading, refresh } = useMenu();

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

  const rawItem = findPackage(id as string) || findItem(id as string);

  const item: any = rawItem ? {
    id: rawItem.id,
    name: rawItem.name,
    category: 'category' in rawItem ? (rawItem as any).category.name : 'Package',
    price: 'totalPrice' in rawItem ? rawItem.totalPrice : (rawItem as any).basePrice,
    image: 'imageUrl' in rawItem ? rawItem.imageUrl : undefined,
    isAvailable: (rawItem as any).isAvailable !== false,
    rating: '4.8', 
    subItems: 'items' in rawItem ? rawItem.items.map((i: any) => ({
      id: i.menuItem.id,
      qty: i.quantity,
      name: i.menuItem.name,
      price: i.menuItem.basePrice,
      compositeKey: `${i.menuItem.id}::Base::${i.menuItem.basePrice}`
    })) : [],
  } : null;

  if (loading && !item) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={scale(60)} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Item not found
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: Colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // NEW: Determine if this is a single item or combo package
  const isSingleItem = !item.subItems || item.subItems.length === 0;

  const isComboAvailable = () => {
    if (isSingleItem) return item.isAvailable !== false;
    return !item.subItems.some((sub: any) => {
      const dbItem = findItem(sub.id);
      return !dbItem || dbItem.isAvailable === false;
    });
  };

  const isAvail = isComboAvailable();

  const handleAddToCart = () => {
    if (!isAvail) return;
    const newItem: any = { 
      id: item.id, 
      name: item.name, 
      category: item.category,
      price: item.price, 
      quantity: quantity, 
      image: item.image, 
      isAvailable: true,
      subItems: item.subItems || [] 
    };
    addToCart(newItem);

    Animated.sequence([
      Animated.spring(toastAnim, { 
        toValue: insets.top + scale(20), 
        useNativeDriver: true, 
        friction: 6 
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { 
        toValue: -scale(100), 
        duration: 300, 
        useNativeDriver: true 
      })
    ]).start();
  };

  // NEW: Logic for handling single item additions
  const compositeKey = `${item.id}::Base::${item.price}`;

  const addToExistingPackage = () => {
    setPackageModalVisible(false);
    setCustomPlate(prev => ({
      ...prev,
      [compositeKey]: (prev[compositeKey] || 0) + quantity
    }));
    // Take them straight to the menu screen to see the package they are building!
    setTimeout(() => router.push('/(tabs)/menu'), 300);
  };

  const startNewPackage = () => {
    setPackageModalVisible(false);
    // Erase the old package and start completely fresh
    setCustomPlate({
      [compositeKey]: quantity
    });
    // Take them straight to the menu screen!
    setTimeout(() => router.push('/(tabs)/menu'), 300);
  };

  const safeTop = Platform.OS === 'web' ? scale(50) : insets.top + scale(10);
  const paddingBottom = scale(15);
  const iconHeight = scale(28); 
  const headerHeight = safeTop + paddingBottom + iconHeight;
  
  const imageMarginTop = headerHeight - scale(30); 

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title={isSingleItem ? "Menu Details" : "Package Details"}
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <View style={styles.headerRight}>
            <CartBadgeIcon onPress={() => router.push('/cart')} />
            <HomeIcon onPress={() => router.push('/(tabs)')} />
          </View>
        }
        isAbsolute={true} 
        isScrolled={true} 
        showDivider={false}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(140) }]}
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
        
        <ImageBackground 
          source={typeof item.image === 'string' ? { uri: item.image } : require('../assets/images/custom-plate.png')} 
          style={[styles.heroImage, { marginTop: imageMarginTop }]}
        >
          {!isAvail && (
             <View style={styles.soldOutHeroOverlay}>
               <View style={styles.soldOutBadge}>
                 <Ionicons name="alert-circle-outline" size={scale(35)} color="#FFF" style={styles.alertIcon} />
                 <Text style={styles.soldOutHeroText}>
                   {isSingleItem ? "Item sold out." : "One or more items sold out. Please edit package and add to cart."}
                 </Text>
               </View>
             </View>
          )}

          <LinearGradient 
            colors={['transparent', colors.background]} 
            style={styles.gradientOverlay} 
          />
        </ImageBackground>

        <View style={styles.detailsContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={[styles.categoryPill, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
                <Text style={[styles.categoryText, { color: Colors.primary }]}>
                  {item.category}
                </Text>
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.mainPrice, { color: Colors.primary }]}>
                ₦{item.price.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.favoriteBtn, { backgroundColor: isDark ? colors.surface : '#FFF' }]} 
              onPress={() => toggleFavorite(item)}
            >
              <Ionicons 
                name={isFavorite(item.id) ? "heart" : "heart-outline"} 
                size={scale(26)} 
                color={isFavorite(item.id) ? Colors.primary : colors.textMuted} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={scale(18)} color="#FFC107" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {item.rating || '4.8'}
            </Text>
            <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
              (120+ Reviews)
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Description
          </Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            Enjoy our delicious and freshly prepared {item.name.toLowerCase()}. Crafted with the finest ingredients to give you that authentic Bwari Kitchen taste.
          </Text>

          {!isSingleItem && item.subItems && item.subItems.length > 0 && (
            <View style={[styles.comboPackageBox, { backgroundColor: isDark ? colors.surface : '#F9F9F9', borderColor: colors.border }]}>
              
              <View style={styles.comboHeaderRow}>
                <Text style={[styles.comboTitle, { color: colors.text }]}>
                  Package Includes:
                </Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.editPackageBtn}>
                  <Ionicons name="create-outline" size={scale(16)} color={Colors.primary} />
                  <Text style={styles.editPackageText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {item.subItems.map((sub: any, idx: number) => {
                const dbItem = findItem(sub.id);
                const isSubSoldOut = !dbItem || dbItem.isAvailable === false;

                return (
                  <View key={idx} style={styles.comboItemRow}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={scale(18)} 
                      color={isSubSoldOut ? colors.textMuted : Colors.primary} 
                    />
                    <Text style={[
                      styles.comboItemText, 
                      { color: isSubSoldOut ? colors.textMuted : colors.text },
                      isSubSoldOut && { textDecorationLine: 'line-through' }
                    ]}>
                      {sub.qty}x {sub.name}
                    </Text>
                    {isSubSoldOut && (
                      <Text style={styles.soldOutSubText}>(Sold Out)</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

        </View>

        <ForYouCard onAddToCart={handleAddToCart} />
      </ScrollView>

      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: insets.bottom + scale(20), 
          backgroundColor: isDark ? colors.surface : '#FFF',
          borderTopColor: colors.border 
        }
      ]}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            style={[styles.qtyBtn, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]} 
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={!isAvail}
          >
            <Ionicons name="remove" size={scale(20)} color={!isAvail ? colors.textMuted : colors.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: !isAvail ? colors.textMuted : colors.text }]}>
            {quantity}
          </Text>
          <TouchableOpacity 
            style={[styles.qtyBtn, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]} 
            onPress={() => setQuantity(quantity + 1)}
            disabled={!isAvail}
          >
            <Ionicons name="add" size={scale(20)} color={!isAvail ? colors.textMuted : colors.text} />
          </TouchableOpacity>
        </View>

        {/* MODIFIED BUTTON LOGIC: Single Item vs Combo */}
        <TouchableOpacity 
          style={[
            styles.addToCartBtn, 
            { backgroundColor: Colors.primary }
          ]} 
          activeOpacity={0.8}
          onPress={() => {
            if (!isAvail) {
              if (!isSingleItem) setIsEditModalVisible(true);
              return;
            }
            if (isSingleItem) {
              setPackageModalVisible(true); 
            } else {
              handleAddToCart();
            }
          }}
        >
          <Text style={[styles.addToCartText, { color: '#FFF' }]}>
            {!isAvail && !isSingleItem 
              ? "Edit Package" 
              : isSingleItem 
                ? "Add to Package" 
                : `Add to Cart - ₦${(item.price * quantity).toLocaleString()}`
            }
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.toastContainer, 
          { 
            transform: [{ translateY: toastAnim }], 
            backgroundColor: isDark ? '#333' : '#222' 
          }
        ]}
      >
        <Ionicons name="checkmark-circle" size={scale(24)} color="#4CAF50" />
        <Text style={styles.toastText}>Successfully added to cart!</Text>
      </Animated.View>

      <QuickEditPackage 
        visible={isEditModalVisible} 
        onClose={() => setIsEditModalVisible(false)} 
        initialItem={item} 
      />

      {/* NEW: The Slide-up Bottom Sheet for Single Items */}
      <Modal 
        visible={packageModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setPackageModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback onPress={() => setPackageModalVisible(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
          
          <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>
              <TouchableOpacity onPress={() => setPackageModalVisible(false)}>
                <Ionicons name="close-circle" size={scale(26)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
              activeOpacity={0.7}
              onPress={addToExistingPackage}
            >
              <View style={[styles.modalIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="add-circle" size={scale(24)} color="#4CAF50" />
              </View>
              <Text style={[styles.modalActionText, { color: colors.text }]}>Add to Existing Package</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
              activeOpacity={0.7}
              onPress={startNewPackage}
            >
              <View style={[styles.modalIconBox, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
                <Ionicons name="restaurant" size={scale(22)} color={Colors.primary} />
              </View>
              <Text style={[styles.modalActionText, { color: colors.text }]}>Start New Package</Text>
            </TouchableOpacity>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={scale(16)} color="#FF9800" />
              <Text style={styles.warningText}>
                Note: Starting a new package will replace any custom package you are currently building.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: scale(10), 
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: scale(20),
    fontWeight: 'bold',
    marginTop: scale(15),
    marginBottom: scale(20),
  },
  backBtn: {
    paddingHorizontal: scale(25),
    paddingVertical: scale(12),
    borderRadius: scale(20),
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: scale(16),
  },
  scrollContent: {
    paddingBottom: scale(140), 
  },
  heroImage: {
    width: '100%',
    height: scale(300),
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(100),
  },
  soldOutHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    borderRadius: scale(15),
    marginHorizontal: scale(30),
  },
  alertIcon: {
    marginRight: scale(10),
    marginTop: scale(2),
  },
  soldOutHeroText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: scale(14),
    flex: 1,
    lineHeight: scale(20),
  },
  detailsContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    flex: 1,
    paddingRight: scale(15),
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(15),
    marginBottom: scale(10),
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: scale(12),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemTitle: {
    fontSize: scale(26),
    fontWeight: '900',
    lineHeight: scale(34),
  },
  mainPrice: {
    fontSize: scale(22),
    fontWeight: 'bold',
    marginTop: scale(5),
  },
  favoriteBtn: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(10),
  },
  ratingText: {
    fontWeight: 'bold',
    fontSize: scale(16),
    marginLeft: scale(6),
  },
  reviewCount: {
    fontSize: scale(14),
    marginLeft: scale(8),
  },
  divider: {
    height: 1,
    marginVertical: scale(25),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(10),
  },
  descriptionText: {
    fontSize: scale(15),
    lineHeight: scale(24),
    marginBottom: scale(20),
  },
  comboPackageBox: {
    padding: scale(20),
    borderRadius: scale(20),
    borderWidth: 1,
    marginBottom: scale(20),
  },
  comboHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  comboTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  editPackageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(12),
  },
  editPackageText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: scale(12),
    marginLeft: scale(4),
  },
  comboItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  comboItemText: {
    fontSize: scale(15),
    fontWeight: '500',
    marginLeft: scale(10),
    flex: 1,
  },
  soldOutSubText: {
    color: '#D32F2F',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    borderTopWidth: 1,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(-5),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(10),
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(15),
  },
  qtyBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginHorizontal: scale(15),
  },
  addToCartBtn: {
    flex: 1,
    height: scale(54),
    borderRadius: scale(27),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale(5),
  },
  addToCartText: {
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
    shadowOffset: {
      width: 0,
      height: scale(5),
    },
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
  
  // NEW STYLES: For the Bottom Sheet Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    padding: scale(20),
    paddingTop: scale(25),
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  modalTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    borderRadius: scale(15),
    borderWidth: 1,
    marginBottom: scale(15),
  },
  modalIconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  modalActionText: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: scale(15),
    borderRadius: scale(12),
    marginTop: scale(5),
  },
  warningText: {
    color: '#E65100',
    fontSize: scale(12),
    marginLeft: scale(10),
    flex: 1,
    lineHeight: scale(18),
  }
});