import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// MOCK DATA: What the backend will eventually send us
const INITIAL_ORDERS = [
  {
    id: '#1024',
    customer: 'Emmanuel',
    time: 'Just now',
    status: 'pending', // 'pending' or 'cooking'
    items: [
      { qty: 2, name: 'Spicy Pasta', note: 'Extra spicy please' },
      { qty: 1, name: 'Peppered Snail', note: '' }
    ]
  },
  {
    id: '#1022',
    customer: 'Obansa',
    time: '5 mins ago',
    status: 'cooking',
    items: [
      { qty: 1, name: 'Fried Rice Combo', note: 'No onions' }
    ]
  }
];

export default function KitchenOrdersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const handleStartCooking = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'cooking' } : order
    ));
  };

  const handleMarkReady = (orderId: string) => {
    // In a real app, this tells the backend the food is ready for the rider
    // Here, we just remove it from the cook's queue
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* KITCHEN HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Active Orders
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {orders.length} orders in queue
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]} 
          onPress={() => router.replace('/login')}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
          <Text style={[styles.logoutText, { color: Colors.primary }]}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* ORDERS LIST */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={60} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              All caught up! No active orders.
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View 
              key={order.id} 
              style={[
                styles.orderCard, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: order.status === 'cooking' ? Colors.primary : colors.border,
                  borderWidth: order.status === 'cooking' ? 2 : 1 
                }
              ]}
            >
              {/* CARD HEADER */}
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.orderIdText}>{order.id}</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>
                  <Ionicons name="time-outline" size={14} /> {order.time}
                </Text>
              </View>

              {/* ORDER ITEMS */}
              <View style={styles.itemsContainer}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.qtyBox}>
                      <Text style={styles.qtyText}>{item.qty}x</Text>
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      {item.note ? (
                        <Text style={[styles.itemNote, { color: Colors.primary }]}>
                          * {item.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionContainer}>
                {order.status === 'pending' ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} 
                    activeOpacity={0.8}
                    onPress={() => handleStartCooking(order.id)}
                  >
                    <Ionicons name="flame" size={20} color="#FFF" style={styles.btnIcon} />
                    <Text style={styles.actionBtnText}>Start Cooking</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: Colors.primary }]} 
                    activeOpacity={0.8}
                    onPress={() => handleMarkReady(order.id)}
                  >
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFF" style={styles.btnIcon} />
                    <Text style={styles.actionBtnText}>Mark as Ready</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// PRO CSS COMPLIANCE
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  orderCard: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  orderIdBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  orderIdText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsContainer: {
    padding: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  qtyBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemNote: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionContainer: {
    padding: 15,
    paddingTop: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});