import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  LayoutAnimation,
  DimensionValue,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router'; 
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../components/TopNav';
import api from './lib/api';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface OrderPackageItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderPackage {
  packageName: string;
  totalPrice: number;
  items: OrderPackageItem[];
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: 'delivery' | 'pickup';
  status: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  createdAt: string;
  orderPackages: OrderPackage[];
  payment: { paymentMethod: string; paymentStatus: string };
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'];

const formatStatusLabel = (status: string) =>
  status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const DELIVERY_STEPS = ['pending', 'confirmed', 'preparing', 'on_the_way'];
const PICKUP_STEPS = ['pending', 'confirmed', 'preparing', 'ready'];

const getProgressStep = (status: string, orderType: string) => {
  const steps = orderType === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;
  const index = steps.indexOf(status);
  if (index === -1) return status === 'delivered' || status === 'picked_up' ? steps.length : 0;
  return index + 1;
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export default function MyOrdersScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<Record<string, { reviewed: boolean; rating: number }>>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/api/orders?limit=50');
      setOrders(res.data.orders);
    } catch (err) {
      console.warn('Failed to load orders:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      fetchOrders().finally(() => {
        if (isActive) setLoading(false);
      });

      const intervalId = setInterval(() => {
        fetchOrders();
      }, 15000);

      return () => {
        isActive = false;
        clearInterval(intervalId);
      };
    }, [fetchOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const activeOrders = orders.filter(order => ACTIVE_STATUSES.includes(order.status));
  const pastOrders = orders.filter(order => !ACTIVE_STATUSES.includes(order.status));

  const handleTabPress = (tab: 'active' | 'past') => {
    setActiveTab(tab);
    const index = tab === 'active' ? 0 : 1;
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleHorizontalScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    const newTab = index === 0 ? 'active' : 'past';
    if (activeTab !== newTab) {
      setActiveTab(newTab);
    }
  };

  const handleReorder = (order: Order) => {
    const reorderPayload = order.orderPackages.map((pkg, index) => ({
      id: `custom_reorder_${order.id}_${index}`,
      name: pkg.packageName,
      price: pkg.totalPrice,
      quantity: 1,
      subItems: pkg.items.map(item => ({
        id: item.itemName,
        name: item.itemName,
        qty: item.quantity,
        price: item.unitPrice
      }))
    }));

    const encodedPayload = encodeURIComponent(JSON.stringify(reorderPayload));

    router.push({
      pathname: '/checkout',
      params: { instantReorder: encodedPayload }
    });
  };

  const toggleExpand = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const willExpand = expandedId !== id;
    setExpandedId(willExpand ? id : null);

    if (willExpand && !reviewStatus[id]) {
      const order = orders.find(o => o.id === id);
      if (order?.status === 'delivered') {
        try {
          const res = await api.get(`/api/reviews/check/${id}`);
          setReviewStatus(prev => ({
            ...prev,
            [id]: { reviewed: res.data.reviewed, rating: res.data.review?.foodRating || 0 }
          }));
        } catch (err) {
          console.warn('Failed to check review status:', err);
        }
      }
    }
  };

  const handleSubmitRating = async (orderId: string, rating: number) => {
    setSubmittingReview(orderId);
    try {
      await api.post('/api/reviews', { orderId, foodRating: rating });
      setReviewStatus(prev => ({ ...prev, [orderId]: { reviewed: true, rating } }));
    } catch (err) {
      console.warn('Failed to submit review:', err);
    } finally {
      setSubmittingReview(null);
    }
  };

  const getOrderSummaryText = (order: Order) => {
    const allItems = order.orderPackages.flatMap(pkg => pkg.items);
    if (allItems.length === 0) return order.orderPackages.map(p => p.packageName).join(', ');
    const first = allItems[0].itemName;
    return allItems.length > 1 ? `${first} + ${allItems.length - 1} more` : first;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#757575'; 
      case 'confirmed': return '#00BCD4'; 
      case 'preparing': return '#FF9800'; 
      case 'ready': return '#FF9800';
      case 'picked_up': return '#2196F3';
      case 'on_the_way': return '#2196F3'; 
      case 'delivered': return '#4CAF50'; 
      case 'cancelled': return '#F44336'; 
      case 'refunded': return '#F44336';
      default: return colors.textMuted;
    }
  };

  const OrderProgress = ({ status, orderType }: { status: string; orderType: string }) => {
    const steps = orderType === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;
    const step = getProgressStep(status, orderType);
    const fillWidth: DimensionValue = `${(Math.max(step - 1, 0) / (steps.length - 1)) * 100}%`;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressLineBg, { backgroundColor: isDark ? '#333' : '#EAEAEC' }]}>
          <View style={[styles.progressLineFill, { width: fillWidth, backgroundColor: Colors.primary }]} />
        </View>

        <View style={styles.progressNodesContainer}>
          {steps.map((s, index) => {
            const nodeStep = index + 1;
            const isActive = step >= nodeStep;
            
            return (
              <View key={s} style={styles.nodeWrapper}>
                <View 
                  style={[
                    styles.nodeCircle, 
                    isActive 
                      ? { backgroundColor: Colors.primary, borderColor: Colors.primary } 
                      : { backgroundColor: isDark ? colors.background : '#FFF', borderColor: isDark ? '#333' : '#EAEAEC' }
                  ]}
                >
                  {isActive && <Ionicons name="checkmark" size={scale(14)} color="#FFF" />}
                </View>
                <Text 
                  style={[
                    styles.stepText, 
                    isActive ? styles.stepTextActive : { color: colors.textMuted }
                  ]}
                >
                  {formatStatusLabel(s)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderList = (list: Order[], emptyTitle: string, emptySub: string) => (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {list.length > 0 ? (
        list.map(order => {
          const isExpanded = expandedId === order.id;
          const isActive = ACTIVE_STATUSES.includes(order.status);
          const review = reviewStatus[order.id];
          
          return (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: isExpanded ? Colors.primary : colors.border }]}>
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(order.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
                      <Ionicons name="bag-handle" size={scale(20)} color={Colors.primary} />
                    </View>
                    <View style={styles.orderIdBox}>
                      <Text style={[styles.orderIdText, { color: colors.text }]}>{order.orderNumber}</Text>
                      <Text style={[styles.orderDate, { color: colors.textMuted }]}>{formatDate(order.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{formatStatusLabel(order.status)}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.cardBody}>
                  <Text style={[styles.itemSummaryText, { color: colors.text }]} numberOfLines={1}>{getOrderSummaryText(order)}</Text>
                  <View style={styles.expandRow}>
                    <Text style={[styles.totalText, { color: colors.text }]}>₦{order.totalAmount.toLocaleString()}</Text>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={scale(20)} color={colors.textMuted} style={{ marginLeft: scale(10) }} />
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedSection}>
                  
                  {isActive && (
                    <OrderProgress status={order.status} orderType={order.orderType} />
                  )}

                  <View style={[styles.receiptBox, { backgroundColor: isDark ? colors.background : '#F9F9F9' }]}>
                    <Text style={[styles.receiptTitle, { color: colors.textMuted }]}>ORDER DETAILS</Text>
                    
                    {order.orderPackages.map((pkg, pkgIndex) => (
                      <View key={pkgIndex} style={styles.packageGroupContainer}>
                        <Text style={[styles.packageGroupName, { color: colors.text }]}>
                          {pkg.packageName}
                        </Text>
                        
                        {pkg.items.map((item, itemIdx) => (
                          <View key={itemIdx} style={styles.receiptItemRow}>
                            <Text style={[styles.receiptItemName, { color: colors.textMuted }]} numberOfLines={1}>
                              {item.itemName} × {item.quantity}
                            </Text>
                            <Text style={[styles.receiptItemPrice, { color: colors.textMuted }]}>
                              ₦{item.totalPrice.toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}

                    <View style={[styles.dashedDivider, { borderColor: colors.border }]} />
                    <View style={styles.receiptItemRow}>
                      <Text style={[styles.receiptSubText, { color: colors.textMuted }]}>Subtotal</Text>
                      <Text style={[styles.receiptSubText, { color: colors.textMuted, textAlign: 'right', fontWeight: 'bold' }]}>
                        ₦{order.subtotal.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.receiptItemRow}>
                      <Text style={[styles.receiptSubText, { color: colors.textMuted }]}>Delivery Fee</Text>
                      <Text style={[styles.receiptSubText, { color: colors.textMuted, textAlign: 'right', fontWeight: 'bold' }]}>
                        ₦{order.deliveryFee.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.dashedDivider, { borderColor: colors.border }]} />
                    <View style={styles.receiptItemRow}>
                      <Text style={[styles.receiptTotalText, { color: colors.text }]}>Total</Text>
                      <Text style={[styles.receiptTotalValue, { color: Colors.primary }]}>
                        ₦{order.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {order.status === 'delivered' && (
                    <View style={styles.ratingSection}>
                      <Text style={[styles.ratingLabel, { color: colors.text }]}>
                        {review?.reviewed ? 'Your rating' : 'How was your food?'}
                      </Text>
                      <View style={styles.starsRow}>
                        {submittingReview === order.id ? (
                          <ActivityIndicator color={Colors.primary} />
                        ) : (
                          [1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity 
                              key={star} 
                              disabled={review?.reviewed}
                              onPress={() => handleSubmitRating(order.id, star)}
                            >
                              <Ionicons 
                                name={star <= (review?.rating || 0) ? "star" : "star-outline"} 
                                size={scale(26)} 
                                color={Colors.primary} 
                                style={{ marginHorizontal: scale(2) }}
                              />
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.actionFooterRow}>
                    <TouchableOpacity style={[styles.helpBtn, { borderColor: colors.border }]} onPress={() => router.push('/help')}>
                      <Ionicons name="chatbubble-ellipses-outline" size={scale(16)} color={colors.text} />
                      <Text style={[styles.helpBtnText, { color: colors.text }]}>Get Help</Text>
                    </TouchableOpacity>
                    
                    {isActive ? (
                      <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => router.push({ pathname: '/track-order', params: { orderId: order.id } })}
                      >
                        <Text style={styles.primaryActionText}>Track Order</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => handleReorder(order)}
                      >
                        <Text style={styles.primaryActionText}>Reorder</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={scale(80)} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyTitle}</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>{emptySub}</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="My Orders"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
        rightComponent={
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => router.push('/help')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={scale(24)} color="#FFF" />
          </TouchableOpacity> 
        }
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'active' ? [styles.activeTab, { borderBottomColor: Colors.primary }] : null]} 
          onPress={() => handleTabPress('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? Colors.primary : colors.textMuted }]}>Active Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'past' ? [styles.activeTab, { borderBottomColor: Colors.primary }] : null]} 
          onPress={() => handleTabPress('past')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: activeTab === 'past' ? Colors.primary : colors.textMuted }]}>Past Orders</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: scale(60) }} />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleHorizontalScroll}
        >
          {/* Note: View width is bound to window dimension here for exact paging */}
          <View style={{ width }}>
            {renderOrderList(activeOrders, 'No active orders', "You don't have any ongoing orders at the moment.")}
          </View>
          <View style={{ width }}>
            {renderOrderList(pastOrders, 'No past orders', "Your order history is empty.")}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconButton: { padding: scale(5), justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: scale(20), marginTop: scale(15), marginBottom: scale(5) },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: scale(12), borderBottomWidth: scale(2), borderBottomColor: 'transparent' },
  activeTab: { borderBottomWidth: scale(2) },
  tabText: { fontSize: scale(15), fontWeight: 'bold' },
  scrollContent: { paddingTop: scale(15), paddingHorizontal: scale(20), paddingBottom: scale(40) },
  orderCard: { borderWidth: 1, borderRadius: scale(20), padding: scale(15), marginBottom: scale(20), elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.05, shadowRadius: scale(5), overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: scale(44), height: scale(44), borderRadius: scale(15), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  orderIdBox: { justifyContent: 'center' },
  orderIdText: { fontSize: scale(16), fontWeight: 'bold', marginBottom: scale(2) },
  orderDate: { fontSize: scale(12) },
  statusBadge: { paddingHorizontal: scale(12), paddingVertical: scale(6), borderRadius: scale(12) },
  statusText: { fontSize: scale(12), fontWeight: 'bold' },
  divider: { height: 1, marginVertical: scale(15) },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemSummaryText: { fontSize: scale(14), flex: 1, paddingRight: scale(10), fontWeight: '500' },
  expandRow: { flexDirection: 'row', alignItems: 'center' },
  totalText: { fontSize: scale(16), fontWeight: 'bold' },
  expandedSection: { marginTop: scale(20) },
  progressContainer: { marginBottom: scale(25), paddingTop: scale(10), position: 'relative' },
  progressLineBg: { position: 'absolute', top: scale(21), left: '12.5%', right: '12.5%', height: scale(4), borderRadius: scale(2), zIndex: 1 },
  progressLineFill: { height: '100%', borderRadius: scale(2) },
  progressNodesContainer: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  nodeWrapper: { width: '25%', alignItems: 'center' },
  nodeCircle: { width: scale(26), height: scale(26), borderRadius: scale(13), borderWidth: scale(2), justifyContent: 'center', alignItems: 'center', marginBottom: scale(8) },
  stepText: { fontSize: scale(11), fontWeight: '600' },
  stepTextActive: { fontWeight: 'bold', color: Colors.primary },
  receiptBox: { padding: scale(15), borderRadius: scale(15), marginBottom: scale(20) },
  receiptTitle: { fontSize: scale(11), fontWeight: 'bold', letterSpacing: 1, marginBottom: scale(15) },
  
  packageGroupContainer: { marginBottom: scale(15) },
  packageGroupName: { fontSize: scale(14), fontWeight: 'bold', marginBottom: scale(8) },
  receiptItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(6) },
  receiptItemName: { flex: 1, fontSize: scale(13), paddingRight: scale(10) },
  receiptItemPrice: { fontSize: scale(13), fontWeight: '500' },
  
  dashedDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: scale(10) },
  receiptSubText: { fontSize: scale(14), flex: 1 },
  receiptTotalText: { fontSize: scale(16), fontWeight: 'bold', flex: 1 },
  receiptTotalValue: { fontSize: scale(18), fontWeight: '900' },
  ratingSection: { alignItems: 'center', marginBottom: scale(20), paddingVertical: scale(10), borderRadius: scale(15) },
  ratingLabel: { fontSize: scale(14), fontWeight: 'bold', marginBottom: scale(8) },
  starsRow: { flexDirection: 'row', minHeight: scale(30), alignItems: 'center' },
  actionFooterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: scale(15) },
  helpBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: scale(12), borderWidth: 1, borderRadius: scale(15) },
  helpBtnText: { fontWeight: 'bold', fontSize: scale(14), marginLeft: scale(6) },
  primaryActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: scale(12), borderRadius: scale(15) },
  primaryActionText: { color: '#FFF', fontWeight: 'bold', fontSize: scale(14) },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: scale(80) },
  emptyTitle: { fontSize: scale(18), fontWeight: 'bold', marginTop: scale(15), marginBottom: scale(5) },
  emptySub: { fontSize: scale(14), textAlign: 'center', paddingHorizontal: scale(30) },
});