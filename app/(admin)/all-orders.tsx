// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to bypass local module resolution in preview.
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../../components/TopNav';
import CategoryFilter from '../../components/CategoryFilter';

// EXTENDED MOCK DATA: Simulating a full database of historical and active orders
const MOCK_ALL_ORDERS = [
  { id: 'ORD0805260001', time: 'Today, 2:45 PM', customerName: 'John Doe', customerPhone: '08012345678', orderType: 'Delivery', items: [{ qty: 2, name: 'Party Jollof', price: 4000 }, { qty: 1, name: 'Coca Cola', price: 1500 }], total: 5500, status: 'Pending' },
  { id: 'ORD0805260002', time: 'Today, 2:30 PM', customerName: 'Sarah Smith', customerPhone: '09087654321', orderType: 'Pickup', items: [{ qty: 1, name: 'Amala & Ewedu', price: 3500 }], total: 3500, status: 'Accepted' },
  { id: 'ORD0805260003', time: 'Today, 2:15 PM', customerName: 'Mike Johnson', customerPhone: '07011223344', orderType: 'Delivery', items: [{ qty: 1, name: 'Fried Rice Combo', price: 5000 }], total: 5000, status: 'Preparing' },
  { id: 'ORD0805260004', time: 'Today, 1:00 PM', customerName: 'Aisha Bello', customerPhone: '08122334455', orderType: 'Delivery', items: [{ qty: 3, name: 'Meatpie', price: 4500 }, { qty: 2, name: 'Zobo', price: 2000 }], total: 6500, status: 'Delivering' },
  { id: 'ORD0805260005', time: 'Today, 11:30 AM', customerName: 'Chinedu Okeke', customerPhone: '08055443322', orderType: 'Delivery', items: [{ qty: 1, name: 'White Rice & Turkey', price: 5500 }], total: 5500, status: 'Delivered' },
  { id: 'ORD0805260006', time: 'Today, 10:00 AM', customerName: 'Grace Etim', customerPhone: '09011221122', orderType: 'Pickup', items: [{ qty: 2, name: 'EggRoll', price: 1400 }, { qty: 2, name: 'Bottle Water', price: 400 }], total: 1800, status: 'Cancelled' },
  { id: 'ORD0804260099', time: 'Yesterday', customerName: 'Daniel Mark', customerPhone: '07099887766', orderType: 'Delivery', items: [{ qty: 1, name: 'Special Rice', price: 3000 }, { qty: 1, name: 'Chicken', price: 5000 }], total: 8000, status: 'Delivered' },
  { id: 'ORD0804260098', time: 'Yesterday', customerName: 'Fatima Umar', customerPhone: '08177665544', orderType: 'Delivery', items: [{ qty: 1, name: 'Porridge Beans', price: 2000 }, { qty: 2, name: 'Plantain', price: 1000 }], total: 3000, status: 'Delivered' },
];

const ORDER_FILTERS = ['All', 'Pending', 'Accepted', 'Preparing', 'Delivering', 'Delivered', 'Cancelled'];

export default function AllOrdersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Live Filtering Logic
  const filteredOrders = MOCK_ALL_ORDERS.filter(order => {
    const matchesFilter = activeFilter === 'All' || order.status === activeFilter;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const toggleOrderExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(prev => prev === id ? null : id);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* TOP NAV stays full width at the top */}
      <TopNav 
        title="All Orders"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      {/* RESPONSIVE WRAPPER: Centers content and prevents extreme stretching on Web/Tablets */}
      <View style={styles.responsiveWrapper}>
        <View style={styles.responsiveInner}>
          
          {/* LIVE SEARCH BAR */}
          <View style={[styles.searchWrapper, { backgroundColor: colors.background }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput 
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by Order ID, Name, or Phone..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* STATUS FILTERS */}
          <View style={styles.filterWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {ORDER_FILTERS.map(filter => (
                <CategoryFilter 
                  key={filter} 
                  category={filter} 
                  isActive={activeFilter === filter} 
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActiveFilter(filter);
                  }} 
                />
              ))}
            </ScrollView>
          </View>

          {/* ORDERS LIST */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}>
            
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsText, { color: colors.textMuted }]}>
                Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </Text>
            </View>

            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
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
                    <TouchableOpacity activeOpacity={0.8} onPress={() => toggleOrderExpand(order.id)}>
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
                          {(order.status === 'Delivered' || order.status === 'Cancelled') ? (
                            <TouchableOpacity style={[styles.actionBtnSecondary, { borderColor: colors.border }]}>
                              <Text style={[styles.actionBtnSecondaryText, { color: colors.text }]}>Print Receipt</Text>
                            </TouchableOpacity>
                          ) : (
                            <>
                              <TouchableOpacity style={[styles.actionBtnSecondary, { borderColor: '#D32F2F' }]}>
                                <Text style={[styles.actionBtnSecondaryText, { color: '#D32F2F' }]}>Cancel Order</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: Colors.primary }]}>
                                <Text style={styles.actionBtnPrimaryText}>Update Status</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>

                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={60} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  No {activeFilter.toLowerCase()} orders match your current search criteria.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Responsive Wrapper Styles (NEW)
  responsiveWrapper: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  responsiveInner: {
    flex: 1,
    width: '100%',
    maxWidth: 800, // Caps the width on Desktop/Tablets!
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    zIndex: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  clearSearchBtn: {
    padding: 5,
  },
  filterWrapper: {
    zIndex: 1,
  },
  filterScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  resultsHeader: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: 'bold',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});