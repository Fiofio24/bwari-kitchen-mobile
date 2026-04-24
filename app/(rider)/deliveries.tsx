import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Switch,
  Linking,
  Alert,
  LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// MOCK DATA: What the backend will send to the rider
const MOCK_DELIVERIES = [
  {
    id: 'DEL-1024',
    customerName: 'Emmanuel',
    customerPhone: '+234 800 111 2222',
    dropoffAddress: 'No 6 Kuje Street, FCT Abuja',
    pickupAddress: 'Bwari Kitchen Main Branch',
    distance: '2.5 km',
    payout: 500,
    status: 'available', // 'available', 'picking_up', 'delivering'
  },
  {
    id: 'DEL-1022',
    customerName: 'Obansa Seriff',
    customerPhone: '+234 800 333 4444',
    dropoffAddress: 'Central Business District, Zone 4',
    pickupAddress: 'Bwari Kitchen Main Branch',
    distance: '4.2 km',
    payout: 800,
    status: 'delivering',
  }
];

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');
  const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);

  const filteredDeliveries = deliveries.filter(del => 
    activeTab === 'available' ? del.status === 'available' : del.status !== 'available'
  );

  const handleAction = (id: string, currentStatus: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (currentStatus === 'available') {
      // Accept Delivery
      setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'picking_up' } : d));
      setActiveTab('active');
    } else if (currentStatus === 'picking_up') {
      // Picked up from Kitchen
      setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'delivering' } : d));
    } else if (currentStatus === 'delivering') {
      // Confirm Delivered
      Alert.alert(
        'Confirm Delivery',
        'Have you successfully handed over the order to the customer?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            style: 'default',
            onPress: () => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setDeliveries(prev => prev.filter(d => d.id !== id));
            }
          }
        ]
      );
    }
  };

  const handleCall = (phone: string) => {
    if (Platform.OS === 'web') {
      window.alert(`Calling ${phone}...`);
    } else {
      Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Unable to open dialer.'));
    }
  };

  const handleMap = (address: string) => {
    if (Platform.OS === 'web') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)
        .catch(() => Alert.alert('Error', 'Unable to open maps.'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* RIDER HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]} 
            onPress={() => router.replace('/login')}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Rider Portal
            </Text>
            <Text style={[styles.headerSubtitle, { color: isOnline ? '#4CAF50' : colors.textMuted }]}>
              {isOnline ? '● Online & Accepting Orders' : '○ Offline'}
            </Text>
          </View>
        </View>
        
        <Switch 
          value={isOnline} 
          onValueChange={setIsOnline} 
          trackColor={{ false: '#767577', true: '#81C784' }} 
          thumbColor={isOnline ? '#4CAF50' : '#f4f3f4'} 
        />
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'available' ? [styles.activeTab, { borderBottomColor: Colors.primary }] : null]} 
          onPress={() => setActiveTab('available')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: activeTab === 'available' ? Colors.primary : colors.textMuted }]}>
            New Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'active' ? [styles.activeTab, { borderBottomColor: Colors.primary }] : null]} 
          onPress={() => setActiveTab('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? Colors.primary : colors.textMuted }]}>
            Active Deliveries
          </Text>
        </TouchableOpacity>
      </View>

      {/* DELIVERIES LIST */}
      {!isOnline && activeTab === 'available' ? (
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={60} color={colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            You are currently offline.
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Toggle your status to online to start receiving delivery requests.
          </Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredDeliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={60} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No {activeTab} deliveries at the moment.
              </Text>
            </View>
          ) : (
            filteredDeliveries.map((delivery) => (
              <View 
                key={delivery.id} 
                style={[
                  styles.deliveryCard, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: delivery.status === 'available' ? colors.border : Colors.primary,
                    borderWidth: delivery.status === 'available' ? 1 : 2 
                  }
                ]}
              >
                {/* CARD HEADER */}
                <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.deliveryIdBadge}>
                    <Text style={styles.deliveryIdText}>{delivery.id}</Text>
                  </View>
                  <View style={styles.payoutBadge}>
                    <Text style={styles.payoutText}>Earn ₦{delivery.payout}</Text>
                  </View>
                </View>

                {/* ROUTE VISUALIZATION */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeTimeline}>
                    <View style={styles.routeDotStart} />
                    <View style={[styles.routeLine, { borderColor: colors.border }]} />
                    <View style={styles.routeDotEnd} />
                  </View>
                  
                  <View style={styles.routeDetails}>
                    <View style={styles.routeStop}>
                      <Text style={[styles.routeLabel, { color: colors.textMuted }]}>PICKUP</Text>
                      <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={1}>
                        {delivery.pickupAddress}
                      </Text>
                    </View>
                    <View style={styles.routeStop}>
                      <Text style={[styles.routeLabel, { color: colors.textMuted }]}>DROPOFF</Text>
                      <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={2}>
                        {delivery.dropoffAddress}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.distanceBox}>
                    <Ionicons name="navigate" size={16} color={Colors.primary} />
                    <Text style={[styles.distanceText, { color: Colors.primary }]}>
                      {delivery.distance}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER CONTACT (Only show if active) */}
                {delivery.status !== 'available' && (
                  <View style={[styles.contactRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                    <View style={styles.customerInfo}>
                      <Text style={[styles.customerName, { color: colors.text }]}>
                        {delivery.customerName}
                      </Text>
                      <Text style={[styles.customerPhone, { color: colors.textMuted }]}>
                        {delivery.customerPhone}
                      </Text>
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity 
                        style={[styles.iconActionBtn, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}
                        onPress={() => handleCall(delivery.customerPhone)}
                      >
                        <Ionicons name="call" size={20} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.iconActionBtn, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}
                        onPress={() => handleMap(delivery.dropoffAddress)}
                      >
                        <Ionicons name="map" size={20} color="#2196F3" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* MAIN ACTION BUTTON */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.actionBtn, 
                      { 
                        backgroundColor: 
                          delivery.status === 'available' ? '#4CAF50' : 
                          delivery.status === 'picking_up' ? '#FF9800' : 
                          Colors.primary 
                      }
                    ]} 
                    activeOpacity={0.8}
                    onPress={() => handleAction(delivery.id, delivery.status)}
                  >
                    <Ionicons 
                      name={
                        delivery.status === 'available' ? "bicycle" : 
                        delivery.status === 'picking_up' ? "cube-outline" : 
                        "checkmark-done-circle"
                      } 
                      size={20} 
                      color="#FFF" 
                      style={styles.btnIcon} 
                    />
                    <Text style={styles.actionBtnText}>
                      {
                        delivery.status === 'available' ? "Accept Delivery" :
                        delivery.status === 'picking_up' ? "Confirm Picked Up" :
                        "Confirm Delivered"
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextWrapper: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
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
    padding: 20,
    paddingBottom: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  deliveryCard: {
    borderRadius: 20,
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
  deliveryIdBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deliveryIdText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  payoutBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  payoutText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  routeContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  routeTimeline: {
    width: 20,
    alignItems: 'center',
    marginRight: 15,
  },
  routeDotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginBottom: 4,
  },
  routeLine: {
    height: 30,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  routeDotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  routeDetails: {
    flex: 1,
  },
  routeStop: {
    marginBottom: 10,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: '600',
  },
  distanceBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
    padding: 10,
    borderRadius: 12,
    marginLeft: 10,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    padding: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});