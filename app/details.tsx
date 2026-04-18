import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ImageBackground, 
  Platform,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoriteContext';
import { MENU_ITEMS, COMBO_PACKAGES } from '../constants/menuData';
import { LinearGradient } from 'expo-linear-gradient';
import QuickEditPackage from '../components/QuickEditPackage';
import CartBadgeIcon from '../components/CartBadgeIcon'; 
import TopNav from '../components/TopNav';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [quantity, setQuantity] = useState(1);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); 
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Find the item in either Single Items or Combo Packages
  const item: any = COMBO_PACKAGES.find(p => p.id === id) || MENU_ITEMS.find(m => m.id === id);

  if (!item) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Item not found
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: Colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isComboAvailable = () => {
    if (!item.subItems || item.subItems.length === 0) return item.isAvailable !== false;
    return !item.subItems.some((sub: any) => {
      const dbItem = MENU_ITEMS.find((m: any) => m.id === sub.id);
      return dbItem?.isAvailable === false;
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
        toValue: insets.top + 20, 
        useNativeDriver: true, 
        friction: 6 
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { 
        toValue: -100, 
        duration: 300, 
        useNativeDriver: true 
      })
    ]).start();
  };

  const safeTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;
  const iconHeight = 28; 
  const headerHeight = safeTop + paddingBottom + iconHeight;
  
  const imageMarginTop = headerHeight - 30; 

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Package Details"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={<CartBadgeIcon onPress={() => router.push('/cart')} />}
        isAbsolute={true} 
        isScrolled={true} 
        showDivider={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}>
        
        <ImageBackground 
          source={{ uri: item.image }} 
          style={[styles.heroImage, { marginTop: imageMarginTop }]}
        >
          {!isAvail && (
             <View style={styles.soldOutHeroOverlay}>
               <View style={styles.soldOutBadge}>
                 <Ionicons name="alert" size={20} color="#FFF" style={styles.alertIcon} />
                 <Text style={styles.soldOutHeroText}>
                   ! One or more items sold out. Please edit package and add to cart.
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
                size={26} 
                color={isFavorite(item.id) ? Colors.primary : colors.textMuted} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#FFC107" />
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

          {item.subItems && item.subItems.length > 0 && (
            <View style={[styles.comboPackageBox, { backgroundColor: isDark ? colors.surface : '#F9F9F9', borderColor: colors.border }]}>
              
              <View style={styles.comboHeaderRow}>
                <Text style={[styles.comboTitle, { color: colors.text }]}>
                  Package Includes:
                </Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.editPackageBtn}>
                  <Ionicons name="create-outline" size={16} color={Colors.primary} />
                  <Text style={styles.editPackageText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {item.subItems.map((sub: any, idx: number) => {
                const dbItem = MENU_ITEMS.find((m: any) => m.id === sub.id);
                const isSubSoldOut = dbItem?.isAvailable === false;

                return (
                  <View key={idx} style={styles.comboItemRow}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
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
      </ScrollView>

      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: insets.bottom + 25, 
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
            <Ionicons name="remove" size={20} color={!isAvail ? colors.textMuted : colors.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: !isAvail ? colors.textMuted : colors.text }]}>
            {quantity}
          </Text>
          <TouchableOpacity 
            style={[styles.qtyBtn, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]} 
            onPress={() => setQuantity(quantity + 1)}
            disabled={!isAvail}
          >
            <Ionicons name="add" size={20} color={!isAvail ? colors.textMuted : colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.addToCartBtn, 
            { backgroundColor: Colors.primary }
          ]} 
          activeOpacity={0.8}
          onPress={() => isAvail ? handleAddToCart() : setIsEditModalVisible(true)}
        >
          <Text style={[styles.addToCartText, { color: '#FFF' }]}>
            {isAvail ? `Add to Cart - ₦${(item.price * quantity).toLocaleString()}` : "Edit Package"}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[
        styles.toastContainer, 
        { 
          transform: [{ translateY: toastAnim }], 
          backgroundColor: isDark ? '#333' : '#222' 
        }
      ]}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={styles.toastText}>Successfully added to cart!</Text>
      </Animated.View>

      <QuickEditPackage 
        visible={isEditModalVisible} 
        onClose={() => setIsEditModalVisible(false)} 
        initialItem={item} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 140, 
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  soldOutHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginHorizontal: 30,
  },
  alertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  soldOutHeroText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  detailsContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    flex: 1,
    paddingRight: 15,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemTitle: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 34,
  },
  mainPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  favoriteBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  comboPackageBox: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  comboHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  comboTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editPackageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editPackageText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  comboItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  comboItemText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  soldOutSubText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  addToCartBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  addToCartText: {
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
      height: 5,
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
  },
});