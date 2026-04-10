import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useCart } from '../context/CartContext';

// --- THE MINI COMPONENT FOR INDIVIDUAL ITEMS ---
const CartItemCard = ({ item, isSelected, onToggle, onIncrease, onDecrease, onRemove, colors, isDark }: any) => {
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const isLocked = item.isAvailable === false;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1 : 0,
      friction: 6, 
      tension: 90, 
      useNativeDriver: true,
    }).start();
  }, [isSelected, scaleAnim]); 

  const shadowStyle = isDark 
    ? Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
        web: { boxShadow: 'none' } as any
      })
    : Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
        android: { elevation: 4, shadowColor: '#000' },
        web: { boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)' } as any 
      });

  return (
    <View style={[styles.cartItem, { backgroundColor: colors.surface }, shadowStyle]}>
      
      <TouchableOpacity 
        onPress={() => onToggle(item.id)} 
        activeOpacity={0.8} 
        style={styles.imageWrapper}
        disabled={isLocked} 
      >
        <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
        
        {isLocked ? (
           <View style={styles.unavailableOverlay}>
             <Text style={styles.unavailableText}>Sold Out</Text>
           </View>
        ) : (
          <Animated.View style={[
            styles.selectedOverlay, 
            { 
              opacity: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: 'clamp'
              }) 
            }
          ]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={36} color="#FFF" />
            </Animated.View>
          </Animated.View>
        )}
      </TouchableOpacity>
      
      <View style={styles.detailsWrapper}>
        <View style={[styles.itemDetails, isLocked && { opacity: 0.5 }]}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          {item.contents && (
            <Text style={[styles.itemContents, { color: colors.textMuted }]} numberOfLines={2}>
              {item.contents}
            </Text>
          )}

          {!isLocked ? (
            <Text style={[styles.itemPrice, { color: Colors.primary }]}>
              ₦{item.price.toLocaleString()}
            </Text>
          ) : (
            <Text style={styles.errorText}>No longer available</Text>
          )}
        </View>

        <View style={styles.actionColumn}>
          <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#FF4444" />
          </TouchableOpacity>

          <View style={[styles.quantityBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }, isLocked && { opacity: 0.5 }]}>
            <TouchableOpacity onPress={() => onDecrease(item.id)} style={styles.qtyBtn} disabled={isLocked}>
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => onIncrease(item.id)} style={styles.qtyBtn} disabled={isLocked}>
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- THE MAIN SCREEN COMPONENT ---
export default function CartScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const availableItems = cartItems.filter(item => item.isAvailable !== false);
    setSelectedIds(availableItems.map(item => item.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

  const availableCartItems = cartItems.filter(item => item.isAvailable !== false);
  const isAllSelected = availableCartItems.length > 0 && selectedIds.length === availableCartItems.length;

  const selectedItemsList = cartItems.filter(item => selectedIds.includes(item.id));
  const subtotal = selectedItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 500 : 0; 
  const total = subtotal + deliveryFee;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(availableCartItems.map(item => item.id)); 
    }
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const topNavShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 8 },
    web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)' } as any 
  });

  const footerShadowStyle = isDark 
    ? Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
        web: { boxShadow: 'none' } as any
      })
    : Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
        android: { elevation: 12, shadowColor: '#000' },
        web: { boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)' } as any 
      });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <StatusBar style="light" />

      <View style={[styles.topNavContainer, { paddingTop }, topNavShadow]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>My Cart</Text>
        <View style={{ width: 30 }} /> 
      </View>

      {cartItems.length > 0 ? (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Packages</Text>
              {availableCartItems.length > 0 && (
                <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.7}>
                  <Text style={styles.selectAllText}>
                    {isAllSelected ? 'Unselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.itemsContainer}>
              {cartItems.map((item) => (
                <CartItemCard 
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onToggle={toggleSelection}
                  onIncrease={increaseQuantity}
                  onDecrease={decreaseQuantity}
                  onRemove={handleRemove}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
            
          </ScrollView>

          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={[styles.stickyFooter, footerShadowStyle, { paddingBottom: insets.bottom + 20, borderTopColor: colors.border }]}>
              <FooterContent colors={colors} subtotal={subtotal} deliveryFee={deliveryFee} total={total} selectedIds={selectedIds} />
            </BlurView>
          ) : Platform.OS === 'web' ? (
            <View style={[styles.stickyFooter, footerShadowStyle, { paddingBottom: insets.bottom + 20, backgroundColor: isDark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderTopColor: colors.border } as any]}>
               <FooterContent colors={colors} subtotal={subtotal} deliveryFee={deliveryFee} total={total} selectedIds={selectedIds} />
            </View>
          ) : (
            <View style={[styles.stickyFooter, footerShadowStyle, { paddingBottom: insets.bottom + 20, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
               <FooterContent colors={colors} subtotal={subtotal} deliveryFee={deliveryFee} total={total} selectedIds={selectedIds} />
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={100} color={colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Looks like you haven&apos;t added any delicious meals yet. Browse our menu to satisfy your cravings!
          </Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/menu')}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const FooterContent = ({ colors, subtotal, deliveryFee, total, selectedIds }: any) => (
  <View style={styles.summaryContainer}>
    <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Order</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>₦{subtotal.toLocaleString()}</Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Delivery Fee</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>₦{deliveryFee.toLocaleString()}</Text>
    </View>
    <View style={styles.summaryRow}>
      <Text style={[styles.totalLabel, { color: colors.text }]}>Total Order</Text>
      <Text style={[styles.totalValue, { color: Colors.primary }]}>₦{total.toLocaleString()}</Text>
    </View>
    <TouchableOpacity style={[styles.checkoutBtn, selectedIds.length === 0 && { opacity: 0.5 }]} activeOpacity={0.8} disabled={selectedIds.length === 0}>
      <Text style={styles.checkoutText}>Order Now</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  topNavContainer: { 
    backgroundColor: Colors.primary, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    // FIX: Maintained at 20
    paddingHorizontal: 20, 
    paddingBottom: 15, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    zIndex: 10,
  },
  backButton: { 
    padding: 5, 
    marginLeft: -5,
  },
  topNavTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF',
  },
  // FIX: Maintained at 20
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 280,
  }, 
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 25, 
    marginBottom: 10, 
    // FIX: Removed paddingHorizontal: 5 to keep it flush with the 20px edge
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    borderLeftWidth: 4, 
    borderLeftColor: Colors.primary, 
    paddingLeft: 10,
  },
  selectAllText: { 
    color: Colors.primary, 
    fontWeight: 'bold', 
    fontSize: 14,
  },
  itemsContainer: { 
    marginTop: 10,
  },
  cartItem: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    marginBottom: 15, 
  },
  imageWrapper: { 
    width: 105, 
    position: 'relative', 
    backgroundColor: '#EEE',
    borderTopLeftRadius: 20, 
    borderBottomLeftRadius: 20, 
    overflow: 'hidden', 
  },
  itemImage: { 
    ...StyleSheet.absoluteFillObject, 
    width: '100%', 
    height: '100%', 
  },
  detailsWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: 15, 
    minHeight: 110, 
  },
  selectedOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(229, 57, 53, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  unavailableOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  unavailableText: { 
    color: '#FFF', 
    fontSize: 12, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    paddingHorizontal: 5,
  },
  errorText: { 
    color: '#FF4444', 
    fontSize: 12, 
    marginTop: 4, 
    fontWeight: '500',
  },
  itemDetails: { 
    flex: 1, 
    marginLeft: 15, 
    justifyContent: 'center',
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4,
  },
  itemContents: { 
    fontSize: 13, 
    marginBottom: 8, 
    lineHeight: 18,
  },
  itemPrice: { 
    fontSize: 16, 
    fontWeight: 'bold',
  },
  actionColumn: { 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
  },
  deleteBtn: { 
    padding: 5, 
    marginBottom: 'auto',
  },
  quantityBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 5, 
    paddingVertical: 5,
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
    marginHorizontal: 12,
  },
  stickyFooter: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    borderTopWidth: 1, 
  },
  // FIX: Reduced padding from 25 to exactly 20 to match the rest of the app
  summaryContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 20,
  },
  summaryTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15,
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12, 
    alignItems: 'center',
  },
  summaryLabel: { 
    fontSize: 15,
  },
  summaryValue: { 
    fontSize: 15, 
    fontWeight: '600',
  },
  totalLabel: { 
    fontSize: 16, 
    fontWeight: 'bold',
  },
  totalValue: { 
    fontSize: 22, 
    fontWeight: 'bold',
  },
  checkoutBtn: { 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 18, 
    borderRadius: 20, 
    marginTop: 15, 
    elevation: 2, 
    shadowColor: Colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8,
  },
  checkoutText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40, 
    marginTop: 40,
  },
  emptyTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 20, 
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
});