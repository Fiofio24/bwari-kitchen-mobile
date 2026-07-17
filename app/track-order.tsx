import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Linking,
  RefreshControl,
  DimensionValue,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../components/TopNav';
import api from './lib/api';

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderType: 'delivery' | 'pickup';
  status: string;
  totalAmount: number;
  estimatedDeliveryTime: string | null;
  deliveryAddress: { streetAddress: string; landmark: string | null; area: string | null } | null;
  rider: { id: string; fullName: string; phoneNumber: string } | null;
  statusHistory: { status: string; note: string | null; createdAt: string }[];
}

const DELIVERY_STEPS = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];
const PICKUP_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'];

const formatStatusLabel = (status: string) =>
  status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getProgressStep = (status: string, steps: string[]) => {
  const index = steps.indexOf(status);
  return index === -1 ? 0 : index + 1;
};

export default function TrackOrderScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      console.warn('Failed to load order:', err);
    }
  }, [orderId]);

  useEffect(() => {
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  };

  const handleCallRider = () => {
    if (order?.rider?.phoneNumber) {
      Linking.openURL(`tel:${order.rider.phoneNumber}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <TopNav title="Track Order" leftIcon="arrow-back" onLeftPress={() => router.back()} isAbsolute={false} isScrolled={true} showDivider={false} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const steps = order.orderType === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const step = getProgressStep(order.status, steps);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Track Order" 
        leftIcon="arrow-back" 
        onLeftPress={() => router.back()} 
        isAbsolute={false} 
        isScrolled={true} 
        showDivider={false} 
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.orderNumber, { color: colors.text }]}>{order.orderNumber}</Text>
          <Text style={[styles.orderType, { color: colors.textMuted }]}>
            {order.orderType === 'delivery' ? 'Delivery Order' : 'Pickup Order'}
          </Text>
        </View>

        {isCancelled ? (
          <View style={[styles.cancelledBox, { backgroundColor: isDark ? 'rgba(211,47,47,0.1)' : '#FFEBEE' }]}>
            <Ionicons name="close-circle" size={40} color="#D32F2F" />
            <Text style={[styles.cancelledText, { color: '#D32F2F' }]}>
              This order was {order.status}.
            </Text>
          </View>
        ) : (
          <View style={styles.stepsContainer}>
            {steps.map((s, index) => {
              const nodeStep = index + 1;
              const isActive = step >= nodeStep;
              const isCurrent = step === nodeStep;
              const historyEntry = order.statusHistory.find(h => h.status === s);

              return (
                <View key={s} style={styles.stepRow}>
                  <View style={styles.stepIndicatorColumn}>
                    <View style={[
                      styles.stepCircle,
                      isActive
                        ? { backgroundColor: Colors.primary, borderColor: Colors.primary }
                        : { backgroundColor: colors.background, borderColor: isDark ? '#333' : '#EAEAEC' }
                    ]}>
                      {isActive && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[
                        styles.stepLine,
                        { backgroundColor: step > nodeStep ? Colors.primary : (isDark ? '#333' : '#EAEAEC') }
                      ]} />
                    )}
                  </View>
                  <View style={styles.stepTextColumn}>
                    <Text style={[
                      styles.stepLabel,
                      { color: isActive ? colors.text : colors.textMuted },
                      isCurrent && { color: Colors.primary }
                    ]}>
                      {formatStatusLabel(s)}
                    </Text>
                    {historyEntry && (
                      <Text style={[styles.stepTime, { color: colors.textMuted }]}>
                        {new Date(historyEntry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {order.rider && !isCancelled && (
          <View style={[styles.riderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.riderIconBox, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
              <Ionicons name="bicycle" size={24} color={Colors.primary} />
            </View>
            <View style={styles.riderInfo}>
              <Text style={[styles.riderLabel, { color: colors.textMuted }]}>Your Rider</Text>
              <Text style={[styles.riderName, { color: colors.text }]}>{order.rider.fullName}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCallRider}>
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {order.orderType === 'delivery' && order.deliveryAddress && (
          <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={[styles.addressText, { color: colors.text }]}>
              {[order.deliveryAddress.streetAddress, order.deliveryAddress.landmark, order.deliveryAddress.area].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  headerBlock: { marginBottom: 25 },
  orderNumber: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  orderType: { fontSize: 14 },
  cancelledBox: { borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 25 },
  cancelledText: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  stepsContainer: { marginBottom: 25 },
  stepRow: { flexDirection: 'row' },
  stepIndicatorColumn: { alignItems: 'center', width: 40 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  stepLine: { width: 2, flex: 1, minHeight: 30 },
  stepTextColumn: { flex: 1, paddingBottom: 25, paddingLeft: 12 },
  stepLabel: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  stepTime: { fontSize: 12, marginTop: 2 },
  riderCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 15 },
  riderIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  riderInfo: { flex: 1 },
  riderLabel: { fontSize: 12, marginBottom: 2 },
  riderName: { fontSize: 16, fontWeight: 'bold' },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 20, padding: 15 },
  addressText: { flex: 1, fontSize: 14, lineHeight: 20 },
});