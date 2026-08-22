import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated,
  DeviceEventEmitter,
  LayoutAnimation
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import QuickEditPackage from '../components/QuickEditPackage';
import TopNav from '../components/TopNav';
import HomeIcon from '../components/HomeIcon';
import { scale } from '../constants/Sizes'; 

const CartItemCard = ({ item, isSelected, onToggle, onIncrease, onDecrease, onRemove, onEdit, colors, isDark }: any) => {
  const { findItem } = useMenu();
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unavailableSubItems = (item.subItems || []).filter((sub: any) => {
    const dbItem = findItem(sub.id);
    return !dbItem || dbItem.isAvailable === false;
  });
  
  const hasUnavailable = unavailableSubItems.length > 0;
  const isLocked = hasUnavailable;

  useEffect(() => {
    Animated.spring(scaleAnim, { 
      toValue: isSelected && !isLocked ? 1 : 0, 
      friction: 6, 
      tension: 90, 
      useNativeDriver: true 
    }).start();
  }, [isSelected, isLocked, scaleAnim]); 

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('HIDE_WARNING_BADGE', (emittedId) => {
      if (emittedId !== item.id && isExpandedRef.current) {
        isExpandedRef.current = false;
        setIsExpanded(false);
        Animated.timing(expandAnim, { 
          toValue: 0, 
          duration: 250, 
          useNativeDriver: false 
        }).start();
      }
    });
    return () => subscription.remove();
  }, [expandAnim, item.id]);

  const toggleExpand = () => {
    const newValue = !isExpanded;
    isExpandedRef.current = newValue;
    setIsExpanded(newValue);
    
    if (newValue) {
      DeviceEventEmitter.emit('HIDE_WARNING_BADGE', item.id);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isExpandedRef.current) {
          isExpandedRef.current = false;
          setIsExpanded(false);
          Animated.timing(expandAnim, { 
            toValue: 0, 
            duration: 250, 
            useNativeDriver: false 
          }).start();
        }
      }, 4000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    Animated.timing(expandAnim, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: false 
    }).start();
  };

  const badgeWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [scale(28), scale(210)] 
  });

  return (
    <Animated.View style={[
      styles.cartItem, 
      { backgroundColor: isLocked ? (isDark ? '#1A1A1A' : '#E0E0E0') : colors.surface },
      isSelected && !isLocked ? {
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(4) },
        shadowOpacity: 0.15,
        shadowRadius: scale(8),
        elevation: 6,
      } : {
        borderColor: 'transparent',
      }
    ]}>
      
      <TouchableOpacity 
        style={{ flex: 1, flexDirection: 'row' }}
        activeOpacity={isLocked ? 1 : 0.7}
        onPress={() => {
          if (isLocked) toggleExpand();
          else onToggle(item.id);
        }}
      >
        {isLocked && (
          <Animated.View style={[styles.floatingBadge, { width: badgeWidth, zIndex: 10 }]}>
            <TouchableOpacity style={styles.badgeContent} onPress={toggleExpand} activeOpacity={0.9}>
              <Ionicons name="alert" size={scale(16)} color="#FFF" style={styles.badgeIcon} />
              <Text style={styles.floatingBadgeText} numberOfLines={1}>Item sold out. Please edit.</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.imageWrapper}>
          <Image 
            source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
            style={[styles.itemImage, isLocked && { opacity: 0.3 }]} 
            resizeMode="cover" 
          />
          
          {!isLocked && (
            <Animated.View style={[styles.selectedOverlay, { opacity: scaleAnim }]}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons name="checkmark-circle" size={scale(36)} color="#FFF" />
              </Animated.View>
            </Animated.View>
          )}
        </View>
        
        <View style={[styles.detailsWrapper, isLocked && { opacity: 0.6 }]}>
          <View style={styles.topRow}>
            <Text style={[styles.itemName, { color: isLocked ? colors.textMuted : colors.text }]} numberOfLines={1}>
              {item.name || item.category}
            </Text>
            <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={scale(20)} color={isLocked ? colors.text : Colors.primary} />
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
                ₦{(item.price * (item.quantity || 1)).toLocaleString()}
              </Text>

              <View style={styles.rightActions}>
                <TouchableOpacity 
                  style={[
                    styles.editBtn, 
                    { backgroundColor: isLocked ? '#FFEBEE' : (isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0') }
                  ]} 
                  onPress={() => onEdit(item)}
                >
                  <Text style={[styles.editBtnText, { color: isLocked ? '#D32F2F' : colors.text }]}>Edit</Text>
                </TouchableOpacity>
                
                <View style={[
                  styles.quantityBox, 
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' },
                  isLocked && { opacity: 0.3 }
                ]}>
                  <TouchableOpacity onPress={() => !isLocked && onDecrease(item.id)} style={styles.qtyBtn} disabled={isLocked}>
                    <Ionicons name="remove" size={scale(16)} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>
                    {item.quantity || 1}
                  </Text>
                  <TouchableOpacity onPress={() => !isLocked && onIncrease(item.id)} style={styles.qtyBtn} disabled={isLocked}>
                    <Ionicons name="add" size={scale(16)} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CartScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const { findItem } = useMenu();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false); 
  const isInitialized = useRef(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const isItemFullyAvailable = useCallback((item: any) => {
    if (!item.subItems || item.subItems.length === 0) {
      const dbItem = findItem(item.id);
      return dbItem ? dbItem.isAvailable !== false : false;
    }
    return !item.subItems.some((sub: any) => {
      const dbItem = findItem(sub.id);
      return !dbItem || dbItem.isAvailable === false;
    });
  }, [findItem]);

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
  
  const total = selectedItemsList.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);

  const handleRemove = (id: string) => { removeFromCart(id); };

  const proceedToCheckout = () => {
    if (selectedIds.length > 0) {
      router.push({
        pathname: '/checkout',
        params: { selectedItems: JSON.stringify(selectedIds) }
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsEditModalVisible(true);
  };

  const toggleSummary = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSummaryExpanded(!isSummaryExpanded);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <TopNav 
        title="My Cart"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <View style={styles.headerRight}>
            <HomeIcon onPress={() => router.push('/(tabs)')} />
          </View>
        }
        isAbsolute={false} 
        isScrolled={true} 
      />

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
                  onEdit={handleEditItem} 
                  colors={colors} 
                  isDark={isDark} 
                />
              ))}
            </View>
          </ScrollView>

          <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + scale(20), backgroundColor: isDark ? colors.surface : '#FFF', borderTopColor: colors.border }]}>
            <View style={styles.summaryContainer}>
              
              <TouchableOpacity 
                style={styles.summaryHeaderRow} 
                onPress={toggleSummary} 
                activeOpacity={0.7}
              >
                <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
                <Ionicons name={isSummaryExpanded ? "chevron-up" : "chevron-down"} size={scale(22)} color={colors.text} />
              </TouchableOpacity>

              {isSummaryExpanded && (
                <View style={styles.expandedSummaryContent}>
                  {selectedItemsList.map((item: any, idx: number) => (
                    <View key={item.id} style={[styles.summaryItemContainer, { borderBottomColor: colors.border }]}>
                      <View style={styles.summaryItemRow}>
                        <View style={styles.summaryItemLeft}>
                          <Text style={[styles.snText, { color: Colors.primary }]}>
                            {(idx + 1).toString().padStart(2, '0')}.
                          </Text>
                          <Text style={[styles.summaryItemName, { color: colors.textMuted }]} numberOfLines={1}>
                            {item.quantity || 1}x {item.name}
                          </Text>
                        </View>
                        <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                          ₦{(item.price * (item.quantity || 1)).toLocaleString()}
                        </Text>
                      </View>
                      
                      {/* DYNAMIC MULTIPLIED SUB-ITEMS */}
                      {item.subItems && item.subItems.length > 0 && (
                        <View style={styles.subItemsList}>
                          {item.subItems.map((sub: any, subIdx: number) => {
                            const dbItem = sub.id ? findItem(sub.id) : null;
                            
                            // Multiply base qty by package qty
                            const baseSubQty = sub.qty ?? sub.quantity ?? 1;
                            const mainPkgQty = item.quantity || 1;
                            const displayQty = baseSubQty * mainPkgQty;
                            
                            const unitPrice = (sub.price !== undefined && sub.price !== null)
                              ? sub.price
                              : ((sub.unitPrice !== undefined && sub.unitPrice !== null)
                                ? sub.unitPrice
                                : (dbItem?.basePrice ?? 0));
                                
                            // Multiply base unit price by the scaled up quantity
                            const displayPrice = unitPrice * displayQty;
                            const name = sub.name || sub.itemName || dbItem?.name || 'Item';

                            return (
                              <View key={subIdx} style={styles.subItemRow}>
                                <Text style={[styles.subItemText, { color: colors.textMuted }]} numberOfLines={1}>
                                  • {displayQty}x {name}
                                </Text>
                                <Text style={[styles.subItemPrice, { color: colors.textMuted }]}>
                                  ₦{displayPrice.toLocaleString()}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                  
                  <View style={[styles.divider, { backgroundColor: colors.border, marginTop: scale(4), marginBottom: scale(15) }]} />
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Order</Text>
                <Text style={[styles.totalValue, { color: Colors.primary }]}>₦{total.toLocaleString()}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.checkoutBtn, selectedIds.length === 0 && { opacity: 0.5, backgroundColor: '#999' }]} 
                disabled={selectedIds.length === 0} 
                activeOpacity={0.8}
                onPress={proceedToCheckout}
              >
                <Text style={styles.checkoutText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={scale(100)} color={colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Looks like you haven&apos;t added any delicious meals yet. Browse our menu to satisfy your cravings!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/menu')}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      )}

      <QuickEditPackage 
        visible={isEditModalVisible} 
        onClose={() => setIsEditModalVisible(false)} 
        initialItem={editingItem} 
        routeOnSave={false} 
      />

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
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(280),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(25),
    marginBottom: scale(10),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    borderLeftWidth: scale(4),
    borderLeftColor: Colors.primary,
    paddingLeft: scale(10),
  },
  selectAllText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  itemsContainer: {
    marginTop: scale(10),
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: scale(20),
    marginBottom: scale(15),
    borderWidth: 1,
  },
  floatingBadge: {
    position: 'absolute',
    top: scale(5),
    left: scale(5),
    height: scale(28),
    backgroundColor: '#D32F2F',
    borderRadius: scale(14),
    zIndex: 50,
    overflow: 'hidden',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(28),
    width: scale(210),
  },
  badgeIcon: {
    width: scale(28),
    textAlign: 'center',
  },
  floatingBadgeText: {
    color: '#FFF',
    fontSize: scale(11),
    fontWeight: 'bold',
    flex: 1,
  },
  imageWrapper: {
    width: scale(105),
    position: 'relative',
    backgroundColor: '#EEE',
    borderTopLeftRadius: scale(20),
    borderBottomLeftRadius: scale(20),
    overflow: 'hidden',
  },
  itemImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  detailsWrapper: {
    flex: 1,
    padding: scale(15),
    paddingTop: scale(10),
    paddingBottom: scale(10),
    minHeight: scale(120),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229, 57, 53, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginTop: scale(5),
  },
  itemName: {
    fontSize: scale(16),
    fontWeight: 'bold',
    flex: 1,
    paddingRight: scale(10),
  },
  itemContents: {
    fontSize: scale(13),
    marginBottom: scale(10),
  },
  expandedMissingBox: {
    marginTop: scale(6),
    marginBottom: scale(8),
    backgroundColor: '#FFEBEE',
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
  },
  missingItemText: {
    color: '#D32F2F',
    fontSize: scale(12),
    fontWeight: 'bold',
    textDecorationLine: 'line-through',
    marginBottom: scale(2),
  },
  priceAndActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  itemPrice: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(12),
    marginRight: scale(10),
  },
  editBtnText: {
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: scale(5),
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(20),
    paddingHorizontal: scale(5),
    paddingVertical: scale(5),
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
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: scale(-6) 
    },
    shadowOpacity: 0.15,
    shadowRadius: scale(15),
  },
  summaryContainer: {
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  summaryTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  expandedSummaryContent: {
    overflow: 'hidden',
  },
  
  // SUB-ITEM SUMMARY STYLES
  summaryItemContainer: { borderBottomWidth: 1, paddingVertical: scale(10) },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subItemsList: { paddingLeft: scale(25), marginTop: scale(6), marginBottom: scale(2) },
  subItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(3) },
  subItemText: { fontSize: scale(12), flex: 1, paddingRight: scale(10) },
  subItemPrice: { fontSize: scale(12), fontWeight: '500' },
  
  summaryItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  snText: {
    fontSize: scale(13),
    fontWeight: '900',
    marginRight: scale(8),
  },
  summaryItemName: {
    flex: 1,
    fontSize: scale(14),
    paddingRight: scale(10),
  },
  summaryItemPrice: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(12),
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: scale(10),
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: scale(22),
    fontWeight: 'bold',
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: scale(18),
    borderRadius: scale(20),
    marginTop: scale(15),
    alignItems: 'center',
  },
  checkoutText: {
    color: '#FFF',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    marginTop: scale(40),
  },
  emptyTitle: {
    fontSize: scale(24),
    fontWeight: 'bold',
    marginTop: scale(20),
    marginBottom: scale(10),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: scale(16),
    textAlign: 'center',
    lineHeight: scale(24),
    marginBottom: scale(35),
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: scale(16),
    paddingHorizontal: scale(35),
    borderRadius: scale(30),
  },
  browseBtnText: {
    color: '#FFF',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
});