import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  LayoutAnimation,
  DimensionValue
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../components/TopNav';

// Pro Mock Data with every status represented
const MOCK_ORDERS = [
  { 
    id: 'ORD-8400', 
    date: 'Today, 8:00 PM', 
    summary: 'Suya & Coke', 
    subtotal: 2500,
    deliveryFee: 500,
    total: 3000, 
    status: 'Pending', 
    active: true,
    progressStep: 1, // 1: Pending
    items: [
      { name: 'Spicy Suya', qty: 1, price: 2000 },
      { name: 'Coke', qty: 1, price: 500 }
    ]
  },
  { 
    id: 'ORD-8398', 
    date: 'Today, 7:30 PM', 
    summary: 'Fried Rice Combo', 
    subtotal: 5000,
    deliveryFee: 500,
    total: 5500, 
    status: 'Accepted', 
    active: true,
    progressStep: 2, // 2: Accepted
    items: [
      { name: 'Fried Rice & Beef', qty: 1, price: 5000 }
    ]
  },
  { 
    id: 'ORD-8392', 
    date: 'Today, 2:30 PM', 
    summary: 'Party Jollof & Chicken + 2 more', 
    subtotal: 7000,
    deliveryFee: 500,
    total: 7500, 
    status: 'Preparing', 
    active: true,
    progressStep: 3, // 3: Preparing
    items: [
      { name: 'Party Jollof & Chicken', qty: 1, price: 4000 },
      { name: 'Extra Beef', qty: 2, price: 2000 },
      { name: 'Coca Cola', qty: 1, price: 1000 }
    ]
  },
  { 
    id: 'ORD-8390', 
    date: 'Today, 1:15 PM', 
    summary: 'Amala & Ewedu', 
    subtotal: 3000,
    deliveryFee: 500,
    total: 3500, 
    status: 'Delivering', 
    active: true,
    progressStep: 4, // 4: Delivering
    items: [
      { name: 'Amala, Ewedu & Turkey', qty: 1, price: 3000 }
    ]
  },
  { 
    id: 'ORD-8385', 
    date: 'Oct 15, 2026', 
    summary: 'White Rice & Turkey', 
    subtotal: 5000,
    deliveryFee: 500,
    total: 5500, 
    status: 'Delivered', 
    active: false,
    rating: 5, 
    items: [
      { name: 'White Rice', qty: 1, price: 1000 },
      { name: 'Grilled Turkey', qty: 1, price: 4000 }
    ]
  },
  { 
    id: 'ORD-8370', 
    date: 'Oct 10, 2026', 
    summary: 'Zobo & Meatpie', 
    subtotal: 1500,
    deliveryFee: 0,
    total: 1500, 
    status: 'Cancelled', 
    active: false,
    rating: 0, 
    items: [
      { name: 'Chilled Zobo', qty: 1, price: 800 },
      { name: 'Meatpie', qty: 1, price: 700 }
    ]
  }
];

export default function MyOrdersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOrders = MOCK_ORDERS.filter(order => 
    activeTab === 'active' ? order.active : !order.active
  );

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#757575'; 
      case 'Accepted': return '#00BCD4'; 
      case 'Preparing': return '#FF9800'; 
      case 'Delivering': return '#2196F3'; 
      case 'Delivered': return '#4CAF50'; 
      case 'Cancelled': return '#F44336'; 
      default: return colors.textMuted;
    }
  };

  const OrderProgress = ({ step }: { step: number }) => {
    const steps = ['Pending', 'Accepted', 'Preparing', 'Delivering'];
    
    // Explicitly cast to DimensionValue to resolve strict TypeScript errors
    const fillWidth: DimensionValue = `${((step - 1) / 3) * 100}%`;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressLineBg, { backgroundColor: isDark ? '#333' : '#EAEAEC' }]}>
          <View style={[styles.progressLineFill, { width: fillWidth, backgroundColor: Colors.primary }]} />
        </View>

        <View style={styles.progressNodesContainer}>
          {steps.map((label, index) => {
            const nodeStep = index + 1;
            const isActive = step >= nodeStep;
            
            return (
              <View key={label} style={styles.nodeWrapper}>
                <View 
                  style={[
                    styles.nodeCircle, 
                    isActive 
                      ? { backgroundColor: Colors.primary, borderColor: Colors.primary } 
                      : { backgroundColor: isDark ? colors.background : '#FFF', borderColor: isDark ? '#333' : '#EAEAEC' }
                  ]}
                >
                  {isActive && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text 
                  style={[
                    styles.stepText, 
                    isActive ? styles.stepTextActive : { color: colors.textMuted }
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* UNIVERSAL TOPNAV WITH SHADOW AND CHAT ICON */}
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
            <Ionicons name="chatbubbles-outline" size={24} color="#FFF" />
          </TouchableOpacity> 
        }
      />

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'active' ? [styles.activeTab, { borderBottomColor: Colors.primary }] : null]} 
          onPress={() => setActiveTab('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? Colors.primary : colors.textMuted }]}>Active Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'past' ? [styles.activeTab, { borderBottomColor: Colors.primary }] : null]} 
          onPress={() => setActiveTab('past')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: activeTab === 'past' ? Colors.primary : colors.textMuted }]}>Past Orders</Text>
        </TouchableOpacity>
      </View>

      {/* ORDERS LIST */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => {
            const isExpanded = expandedId === order.id;
            
            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: isExpanded ? Colors.primary : colors.border }]}>
                
                {/* CARD HEADER */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(order.id)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
                        <Ionicons name="bag-handle" size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.orderIdBox}>
                        <Text style={[styles.orderIdText, { color: colors.text }]}>{order.id}</Text>
                        <Text style={[styles.orderDate, { color: colors.textMuted }]}>{order.date}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.cardBody}>
                    <Text style={[styles.itemSummaryText, { color: colors.text }]} numberOfLines={1}>{order.summary}</Text>
                    <View style={styles.expandRow}>
                      <Text style={[styles.totalText, { color: colors.text }]}>₦{order.total.toLocaleString()}</Text>
                      <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} style={{ marginLeft: 10 }} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* EXPANDED DETAILS */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    
                    {/* Active Order Progress */}
                    {order.active && order.progressStep && (
                      <OrderProgress step={order.progressStep} />
                    )}

                    {/* Receipt Breakdown */}
                    <View style={[styles.receiptBox, { backgroundColor: isDark ? colors.background : '#F9F9F9' }]}>
                      <Text style={[styles.receiptTitle, { color: colors.textMuted }]}>ORDER DETAILS</Text>
                      {order.items.map((item, idx) => (
                        <View key={idx} style={styles.receiptItemRow}>
                          <Text style={[styles.receiptItemQty, { color: colors.text }]}>{item.qty}x</Text>
                          <Text style={[styles.receiptItemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                          <Text style={[styles.receiptItemPrice, { color: colors.text }]}>₦{item.price.toLocaleString()}</Text>
                        </View>
                      ))}
                      <View style={[styles.dashedDivider, { borderColor: colors.border }]} />
                      <View style={styles.receiptItemRow}>
                        <Text style={[styles.receiptSubText, { color: colors.textMuted }]}>Subtotal</Text>
                        <Text style={[styles.receiptSubText, { color: colors.textMuted }]}>₦{order.subtotal.toLocaleString()}</Text>
                      </View>
                      <View style={styles.receiptItemRow}>
                        <Text style={[styles.receiptSubText, { color: colors.textMuted }]}>Delivery Fee</Text>
                        <Text style={[styles.receiptSubText, { color: colors.textMuted }]}>₦{order.deliveryFee.toLocaleString()}</Text>
                      </View>
                    </View>

                    {/* Past Order Rating Prompt */}
                    {!order.active && (
                      <View style={styles.ratingSection}>
                        <Text style={[styles.ratingLabel, { color: colors.text }]}>How was your food?</Text>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star}>
                              <Ionicons 
                                name={star <= (order.rating || 0) ? "star" : "star-outline"} 
                                size={26} 
                                color={Colors.primary} 
                                style={{ marginHorizontal: 2 }}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionFooterRow}>
                      <TouchableOpacity style={[styles.helpBtn, { borderColor: colors.border }]} onPress={() => router.push('/help')}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.text} />
                        <Text style={[styles.helpBtnText, { color: colors.text }]}>Get Help</Text>
                      </TouchableOpacity>
                      
                      {order.active ? (
                        <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: Colors.primary }]}>
                          <Text style={styles.primaryActionText}>Track Rider</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: Colors.primary }]}>
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
            <Ionicons name="receipt-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No {activeTab} orders</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {activeTab === 'active' ? "You don't have any ongoing orders at the moment." : "Your order history is empty."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  iconButton: { 
    padding: 5, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  scrollContent: { 
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  orderIdBox: {
    justifyContent: 'center',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSummaryText: {
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
    fontWeight: '500',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedSection: {
    marginTop: 20,
  },
  progressContainer: {
    marginBottom: 25,
    paddingTop: 10,
    position: 'relative',
  },
  progressLineBg: {
    position: 'absolute',
    top: 21, 
    left: '12.5%', 
    right: '12.5%', 
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressNodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  nodeWrapper: {
    width: '25%',
    alignItems: 'center',
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepTextActive: {
    fontWeight: 'bold',
  },
  receiptBox: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptItemQty: {
    width: 25,
    fontSize: 13,
    fontWeight: 'bold',
  },
  receiptItemName: {
    flex: 1,
    fontSize: 13,
    paddingRight: 10,
  },
  receiptItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  receiptSubText: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
    paddingRight: 10,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
  },
  actionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  helpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 15,
  },
  helpBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  primaryActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
  },
  primaryActionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
  }
});