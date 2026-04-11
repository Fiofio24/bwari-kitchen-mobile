// Note: This file requires an Expo/React Native environment to compile correctly.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { MENU_ITEMS } from '../constants/menuData';

const CartItemCard = ({ item, isSelected, onToggle, onIncrease, onDecrease, onRemove, colors, isDark }: any) => {
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // STRICT LOCKING: Only check the live database to confirm if a sub-item is actually sold out.
  const unavailableSubItems = (item.subItems || []).filter((sub: any) => {
    const dbItem = MENU_ITEMS.find((m: any) => m.id === sub.id);
    return dbItem?.isAvailable === false;
  });
  
  const hasUnavailable = unavailableSubItems.length > 0;
  
  // A card is only locked if it has unavailable items matched in the live DB
  const isLocked = hasUnavailable;

  useEffect(() => {
    Animated.spring(scaleAnim, { 
      toValue: isSelected && !isLocked ? 1 : 0, 
      friction: 6, 
      tension: 90, 
      useNativeDriver: true 
    }).start();
  }, [isSelected, isLocked, scaleAnim]); 

  const toggleExpand = () => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false 
    }).start();
    setIsExpanded(!isExpanded);
  };

  const badgeWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 210] 
  });

  return (
    <View style={[
      styles.cartItem, 
      { backgroundColor: isLocked ? (isDark ? '#1A1A1A' : '#E0E0E0') : colors.surface }
    ]}>
      
      {isLocked && (
        <Animated.View style={[styles.floatingBadge, { width: badgeWidth }]}>
          <TouchableOpacity style={styles.badgeContent} onPress={toggleExpand} activeOpacity={0.9}>
            <Ionicons name="alert" size={16} color="#FFF" style={styles.badgeIcon} />
            <Text style={styles.floatingBadgeText} numberOfLines={1}>Item sold out. Please edit.</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <TouchableOpacity 
        onPress={() => {
          if (isLocked) toggleExpand();
          else onToggle(item.id);
        }} 
        activeOpacity={isLocked ? 1 : 0.8} 
        style={styles.imageWrapper}
      >
        <Image 
          source={{ uri: item.image }} 
          style={[styles.itemImage, isLocked && { opacity: 0.3 }]} 
          resizeMode="cover" 
        />
        
        {!isLocked && (
          <Animated.View style={[styles.selectedOverlay, { opacity: scaleAnim }]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={36} color="#FFF" />
            </Animated.View>
          </Animated.View>
        )}
      </TouchableOpacity>
      
      <View style={[styles.detailsWrapper, isLocked && { opacity: 0.6 }]}>
        <View style={styles.topRow}>
          <Text style={[styles.itemName, { color: isLocked ? colors.textMuted : colors.text }]} numberOfLines={1}>
            {item.category || item.name}
          </Text>
          <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.deleteBtn}>
            <Ionicons name="close" size={20} color={isLocked ? colors.text : colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.itemDetails}>
          <Text style={[styles.itemContents, { color: colors.textMuted }]} numberOfLines={1}>
            {item.subItems && item.subItems.length > 0 
              ? item.subItems.map((sub: any) => sub.name).join(' | ') 
              : (item.contents || '')}
          </Text>

          {isLocked && isExpanded && (
            <View style={styles.expandedMissingBox}>
              {unavailableSubItems.map((sub: any, idx: number) => (
                <Text key={idx} style={styles.missingItemText} numberOfLines={1}>
                  • {sub.name} (Sold Out)
                </Text>
              ))}
            </View>
          )}
          
          <View style={styles.priceAndActionRow}>
            <Text style={[styles.itemPrice, { color: isLocked ? colors.textMuted : Colors.primary }]}>
              ₦{item.price.toLocaleString()}
            </Text>

            <View style={styles.rightActions}>
              <TouchableOpacity 
                style={[
                  styles.editBtn, 
                  { backgroundColor: isLocked ? '#FFEBEE' : (isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0') }
                ]} 
                onPress={() => router.push('/menu')}
              >
                <Text style={[styles.editBtnText, { color: isLocked ? '#D32F2F' : colors.text }]}>Edit</Text>
              </TouchableOpacity>
              
              <View style={[
                styles.quantityBox, 
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' },
                isLocked && { opacity: 0.3 }
              ]}>
                <TouchableOpacity onPress={() => !isLocked && onDecrease(item.id)} style={styles.qtyBtn} disabled={isLocked}>
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.text }]}>
                  {item.quantity || 1}
                </Text>
                <TouchableOpacity onPress={() => !isLocked && onIncrease(item.id)} style={styles.qtyBtn} disabled={isLocked}>
                  <Ionicons name="add" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isInitialized = useRef(false);

  const isItemFullyAvailable = useCallback((item: any) => {
    if (!item.subItems || item.subItems.length === 0) return true;
    return !item.subItems.some((sub: any) => {
      const dbItem = MENU_ITEMS.find((m: any) => m.id === sub.id);
      return dbItem?.isAvailable === false;
    });
  }, []);

  useEffect(() => {
    if (!isInitialized.current && cartItems.length > 0) {
      const availableIds = cartItems.filter(isItemFullyAvailable).map((item: any) => item.id);
      setSelectedIds(availableIds);
      isInitialized.current = true;
    } else {
      setSelectedIds(prev => prev.filter(id => cartItems.some(item => item.id === id)));
    }
  }, [cartItems, isItemFullyAvailable]);

  const availableCartItems = cartItems.filter(isItemFullyAvailable);
  const isAllSelected = availableCartItems.length > 0 && selectedIds.length === availableCartItems.length;
  const selectedItemsList = cartItems.filter((item: any) => selectedIds.includes(item.id));
  
  // Calculate subtotal from selected items taking quantity into account
  const subtotal = selectedItemsList.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);
  const total = subtotal + (subtotal > 0 ? 500 : 0);

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const handleRemove = (id: string) => { removeFromCart(id); };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <View style={[styles.topNavContainer, { paddingTop, paddingBottom }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, styles.sideIcon]}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        
        <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="none">
          <Text style={styles.topNavTitle}>My Cart</Text>
        </View>

        <View style={styles.sideIcon} /> 
      </View>

      {cartItems.length > 0 ? (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Packages</Text>
              <TouchableOpacity onPress={() => isAllSelected ? setSelectedIds([]) : setSelectedIds(availableCartItems.map(i => i.id))} activeOpacity={0.7}>
                <Text style={styles.selectAllText}>{isAllSelected ? 'Unselect All' : 'Select All'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.itemsContainer}>
              {cartItems.map((item: any) => (
                <CartItemCard 
                  key={item.id} 
                  item={item} 
                  isSelected={selectedIds.includes(item.id)} 
                  onToggle={(id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} 
                  onIncrease={increaseQuantity} 
                  onDecrease={decreaseQuantity} 
                  onRemove={handleRemove} 
                  colors={colors} 
                  isDark={isDark} 
                />
              ))}
            </View>
          </ScrollView>
          <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 20, backgroundColor: isDark ? colors.surface : '#FFF', borderTopColor: colors.border }]}>
            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Order</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>₦{subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Delivery Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>₦{(subtotal > 0 ? 500 : 0).toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Order</Text>
                <Text style={[styles.totalValue, { color: Colors.primary }]}>₦{total.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={[styles.checkoutBtn, selectedIds.length === 0 && { opacity: 0.5, backgroundColor: '#999' }]} disabled={selectedIds.length === 0} activeOpacity={0.8}>
                <Text style={styles.checkoutText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={100} color={colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Looks like you haven&apos;t added any delicious meals yet. Browse our menu to satisfy your cravings!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/menu')}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  topNavContainer: { 
    backgroundColor: Colors.primary, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
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
  backButton: { 
    padding: 5, 
    marginLeft: -5 
  },
  topNavTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 280 
  }, 
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 25, 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    borderLeftWidth: 4, 
    borderLeftColor: Colors.primary, 
    paddingLeft: 10 
  },
  selectAllText: { 
    color: Colors.primary, 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  itemsContainer: { 
    marginTop: 10 
  },
  cartItem: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    marginBottom: 15, 
    overflow: 'hidden' 
  },
  floatingBadge: { 
    position: 'absolute', 
    top: 5, 
    left: 5, 
    height: 28, 
    backgroundColor: '#D32F2F', 
    borderRadius: 14, 
    zIndex: 50, 
    overflow: 'hidden' 
  },
  badgeContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 28, 
    width: 210 
  },
  badgeIcon: { 
    width: 28, 
    textAlign: 'center' 
  },
  floatingBadgeText: { 
    color: '#FFF', 
    fontSize: 11, 
    fontWeight: 'bold', 
    flex: 1 
  },
  imageWrapper: { 
    width: 105, 
    position: 'relative', 
    backgroundColor: '#EEE', 
    borderTopLeftRadius: 20, 
    borderBottomLeftRadius: 20, 
    overflow: 'hidden' 
  },
  itemImage: { 
    ...StyleSheet.absoluteFillObject, 
    width: '100%', 
    height: '100%' 
  },
  detailsWrapper: { 
    flex: 1, 
    padding: 15, 
    minHeight: 120 
  },
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  selectedOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(229, 57, 53, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  itemDetails: { 
    flex: 1, 
    marginTop: 5 
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    flex: 1, 
    paddingRight: 10 
  },
  itemContents: { 
    fontSize: 13, 
    marginBottom: 4 
  },
  expandedMissingBox: { 
    marginTop: 6, 
    marginBottom: 8, 
    backgroundColor: '#FFEBEE', 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 8 
  },
  missingItemText: { 
    color: '#D32F2F', 
    fontSize: 12, 
    fontWeight: 'bold', 
    textDecorationLine: 'line-through', 
    marginBottom: 2 
  },
  priceAndActionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    marginTop: 'auto' 
  },
  itemPrice: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  rightActions: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  editBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginRight: 10 
  },
  editBtnText: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  deleteBtn: { 
    padding: 5 
  },
  quantityBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 5, 
    paddingVertical: 5 
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
  stickyFooter: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    borderTopWidth: 1 
  },
  summaryContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 20 
  },
  summaryTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12, 
    alignItems: 'center' 
  },
  summaryLabel: { 
    fontSize: 15 
  },
  summaryValue: { 
    fontSize: 15, 
    fontWeight: '600' 
  },
  totalLabel: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  totalValue: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  checkoutBtn: { 
    backgroundColor: Colors.primary, 
    paddingVertical: 18, 
    borderRadius: 20, 
    marginTop: 15, 
    alignItems: 'center' 
  },
  checkoutText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40, 
    marginTop: 40 
  },
  emptyTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  emptySubtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 35 
  },
  browseBtn: { 
    backgroundColor: Colors.primary, 
    paddingVertical: 16, 
    paddingHorizontal: 35, 
    borderRadius: 30 
  },
  browseBtnText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});