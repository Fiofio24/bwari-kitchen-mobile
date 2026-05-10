import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Platform,
  RefreshControl,
  LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

// MOCK DATA for the Dashboard
const MOCK_METRICS = {
  revenue: 245500,
  revenueTrend: '+12.5%',
  ordersToday: 42,
  ordersTrend: '+5.0%',
  activeRiders: 8,
  pendingOrders: 12
};

const MOCK_INVENTORY = [
  { id: 'r3', name: 'Party Jollof', isAvailable: true },
  { id: 'pr1', name: 'Beef', isAvailable: false },
  { id: 'pr3', name: 'Chicken', isAvailable: true },
  { id: 'sp13', name: 'Egusi Soup', isAvailable: true },
];

// Upgraded mock data with structured items and customer details for the Accordion
const MOCK_LIVE_ORDERS = [
  { 
    id: 'ORD0805260001', 
    time: 'Just now', 
    customerName: 'John Doe',
    customerPhone: '08012345678',
    orderType: 'Delivery',
    items: [
      { qty: 2, name: 'Party Jollof', price: 4000 },
      { qty: 1, name: 'Coca Cola', price: 1500 }
    ], 
    total: 5500, 
    status: 'Pending' 
  },
  { 
    id: 'ORD0805260002', 
    time: '5m ago', 
    customerName: 'Sarah Smith',
    customerPhone: '09087654321',
    orderType: 'Pickup',
    items: [
      { qty: 1, name: 'Amala & Ewedu', price: 3500 }
    ], 
    total: 3500, 
    status: 'Accepted' 
  },
  { 
    id: 'ORD0805260003', 
    time: '10m ago', 
    customerName: 'Mike Johnson',
    customerPhone: '07011223344',
    orderType: 'Delivery',
    items: [
      { qty: 1, name: 'Fried Rice Combo', price: 5000 }
    ], 
    total: 5000, 
    status: 'Preparing' 
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [refreshing, setRefreshing] = useState(false); 
  
  // State to track which order accordion is currently open
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleInventory = (id: string) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const toggleOrderExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* ADMIN HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerGreeting, { color: colors.textMuted }]}>
            Manager Portal
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Overview
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: isDark ? colors.surface : '#FFF' }]} 
          onPress={() => router.replace('/login')}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
            colors={[Colors.primary]} 
          />
        }
      >
        
        {/* EMERGENCY MASTER SWITCH */}
        <View style={[styles.masterSwitchCard, { backgroundColor: acceptingOrders ? 'rgba(76, 175, 80, 0.1)' : 'rgba(211, 47, 47, 0.1)', borderColor: acceptingOrders ? '#4CAF50' : '#D32F2F' }]}>
          <View style={styles.masterSwitchText}>
            <Text style={[styles.masterSwitchTitle, { color: acceptingOrders ? '#388E3C' : '#D32F2F' }]}>
              {acceptingOrders ? "Store is ONLINE" : "Store is PAUSED"}
            </Text>
            <Text style={[styles.masterSwitchSub, { color: colors.textMuted }]}>
              {acceptingOrders ? "Accepting new orders from customers." : "Customers cannot place new orders."}
            </Text>
          </View>
          <Switch 
            value={acceptingOrders} 
            onValueChange={setAcceptingOrders} 
            trackColor={{ false: '#D32F2F', true: '#81C784' }} 
            thumbColor={acceptingOrders ? '#4CAF50' : '#f4f3f4'} 
          />
        </View>

        {/* METRICS GRID */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 0 }]}>TODAY&apos;S METRICS</Text>
          <Text style={[styles.dateSubtitle, { color: colors.textMuted }]}>May 8, 2026</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                <Ionicons name="wallet" size={20} color="#2196F3" />
              </View>
              <View style={[styles.trendBadge, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="trending-up" size={10} color="#4CAF50" />
                <Text style={styles.trendText}>{MOCK_METRICS.revenueTrend}</Text>
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>₦{MOCK_METRICS.revenue.toLocaleString()}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Revenue</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                <Ionicons name="receipt" size={20} color="#9C27B0" />
              </View>
              <View style={[styles.trendBadge, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="trending-up" size={10} color="#4CAF50" />
                <Text style={styles.trendText}>{MOCK_METRICS.ordersTrend}</Text>
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{MOCK_METRICS.ordersToday}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Orders</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                <Ionicons name="bicycle" size={20} color="#FF9800" />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{MOCK_METRICS.activeRiders}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Active Riders</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                <Ionicons name="restaurant" size={20} color="#F44336" />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{MOCK_METRICS.pendingOrders}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Pending Orders</Text>
          </View>
        </View>

        {/* INVENTORY QUICK TOGGLES */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 0 }]}>QUICK INVENTORY</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text 
              style={[styles.seeAllText, { color: Colors.primary }]}
              onPress={() => router.push('/manage-menu')}
            >
              Manage Menu
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {inventory.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.inventoryRow, 
                index !== inventory.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
              ]}
            >
              <View style={styles.inventoryInfo}>
                <Text style={[
                  styles.inventoryName, 
                  { color: item.isAvailable ? colors.text : colors.textMuted },
                  !item.isAvailable && { textDecorationLine: 'line-through' }
                ]}>
                  {item.name}
                </Text>
                <Text style={[
                  styles.inventoryStatus, 
                  { color: item.isAvailable ? '#4CAF50' : '#D32F2F' }
                ]}>
                  {item.isAvailable ? 'In Stock' : 'Sold Out'}
                </Text>
              </View>
              <Switch 
                value={item.isAvailable} 
                onValueChange={() => toggleInventory(item.id)} 
                trackColor={{ false: 'rgba(211, 47, 47, 0.5)', true: 'rgba(76, 175, 80, 0.5)' }} 
                thumbColor={item.isAvailable ? '#4CAF50' : '#D32F2F'} 
              />
            </View>
          ))}
        </View>

        {/* LIVE ORDER QUEUE */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 0 }]}>LIVE KITCHEN FEED</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text 
              style={[styles.seeAllText, { color: Colors.primary }]}
              onPress={() => router.push('/all-orders')}
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {MOCK_LIVE_ORDERS.map((order, idx) => {
          const isExpanded = expandedOrderId === order.id;
          const summaryText = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

          return (
            <View 
              key={order.id} 
              style={[
                styles.liveOrderCard, 
                { backgroundColor: colors.surface, borderColor: isExpanded ? Colors.primary : colors.border }
              ]}
            >
              {/* CLICKABLE HEADER TO EXPAND */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => toggleOrderExpand(order.id)}
              >
                <View style={styles.liveOrderHeader}>
                  <View style={styles.liveOrderIdBox}>
                    <Text style={[styles.liveOrderId, { color: colors.text }]}>{order.id}</Text>
                    <Text style={[styles.liveOrderTime, { color: colors.textMuted }]}>{order.time}</Text>
                  </View>
                  <View style={[styles.liveOrderStatusBox, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                    <Text style={[styles.liveOrderStatusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                  </View>
                </View>
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.liveOrderBody}>
                  <View style={styles.liveOrderTextWrap}>
                    <Text style={[styles.liveOrderItems, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 2}>
                      {summaryText}
                    </Text>
                    <Text style={[styles.liveOrderTotal, { color: Colors.primary }]}>
                      ₦{order.total.toLocaleString()}
                    </Text>
                  </View>
                  {/* Changed the icon from right arrow to up/down accordion arrow */}
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
                </View>
              </TouchableOpacity>

              {/* EXPANDED DETAILS SECTION */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  
                  {/* Customer Info Box */}
                  <View style={[styles.customerBox, { backgroundColor: isDark ? colors.background : '#F9F9F9' }]}>
                    <View style={styles.customerRow}>
                      <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.customerDetailText, { color: colors.text }]}>{order.customerName}</Text>
                    </View>
                    <View style={styles.customerRow}>
                      <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.customerDetailText, { color: colors.text }]}>{order.customerPhone}</Text>
                    </View>
                    <View style={styles.customerRow}>
                      <Ionicons name={order.orderType === 'Delivery' ? "bicycle-outline" : "storefront-outline"} size={16} color={colors.textMuted} />
                      <Text style={[styles.customerDetailText, { color: colors.text }]}>Order Type: {order.orderType}</Text>
                    </View>
                  </View>

                  {/* Receipt Breakdown */}
                  <Text style={[styles.receiptHeader, { color: colors.textMuted }]}>RECEIPT BREAKDOWN</Text>
                  {order.items.map((item, i) => (
                    <View key={i} style={styles.receiptRow}>
                      <Text style={[styles.receiptQty, { color: colors.text }]}>{item.qty}x</Text>
                      <Text style={[styles.receiptName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.receiptPrice, { color: colors.text }]}>₦{item.price.toLocaleString()}</Text>
                    </View>
                  ))}
                  
                  <View style={[styles.dashedDivider, { borderColor: colors.border }]} />
                  
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptTotalLabel, { color: colors.text }]}>Total Paid</Text>
                    <Text style={[styles.receiptTotalValue, { color: Colors.primary }]}>₦{order.total.toLocaleString()}</Text>
                  </View>

                  {/* Quick Action Buttons */}
                  <View style={styles.actionFooterRow}>
                    {order.status === 'Pending' ? (
                      <>
                        <TouchableOpacity style={[styles.actionBtnSecondary, { borderColor: '#D32F2F' }]}>
                          <Text style={[styles.actionBtnSecondaryText, { color: '#D32F2F' }]}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: '#4CAF50' }]}>
                          <Text style={styles.actionBtnPrimaryText}>Accept Order</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: Colors.primary, width: '100%' }]}>
                        <Text style={styles.actionBtnPrimaryText}>Update Status</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                </View>
              )}
            </View>
          );
        })}

      </ScrollView>
    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  masterSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
  },
  masterSwitchText: {
    flex: 1,
    paddingRight: 15,
  },
  masterSwitchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  masterSwitchSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    width: '48%',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 25,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inventoryStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveOrderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
  },
  liveOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveOrderIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveOrderId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  liveOrderTime: {
    fontSize: 12,
  },
  liveOrderStatusBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveOrderStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  liveOrderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveOrderTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  liveOrderItems: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  liveOrderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // NEW ACCORDION STYLES
  expandedSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
  customerBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerDetailText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  receiptHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptQty: {
    width: 25,
    fontSize: 13,
    fontWeight: 'bold',
  },
  receiptName: {
    flex: 1,
    fontSize: 13,
    paddingRight: 10,
  },
  receiptPrice: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  receiptTotalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  actionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 20,
  },
  actionBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnPrimaryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});