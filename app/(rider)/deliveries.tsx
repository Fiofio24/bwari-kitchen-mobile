import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Platform,
  LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

// Importing TopNav and Sidebar
import TopNav from '../../components/TopNav';
import Sidebar from '../../components/Sidebar';

// MOCK DATA for Internal Rider (Logistics focus)
const MOCK_METRICS = {
  tripsToday: 12,
  tripsMonth: 145,
  avgRating: 4.8
};

const MOCK_DELIVERIES = [
  {
    id: 'ORD-001',
    customerName: 'Aisha Bello',
    customerPhone: '08122334455',
    dropoffAddress: 'Block C, Bwari Student Hostel',
    distance: '2.5 km',
    estimatedTime: '12 mins',
    status: 'Pending', 
    timePassed: '2m ago'
  },
  {
    id: 'ORD-002',
    customerName: 'Chinedu Okeke',
    customerPhone: '08055443322',
    dropoffAddress: 'Phase 3, FHA Estate, Bwari',
    distance: '4.1 km',
    estimatedTime: '18 mins',
    status: 'Pending',
    timePassed: 'Just now'
  },
  {
    id: 'ACT-099',
    customerName: 'Mike Johnson',
    customerPhone: '07011223344',
    dropoffAddress: 'Law School Road, Bwari',
    distance: '1.2 km',
    estimatedTime: '8 mins',
    status: 'Active', 
    timePassed: 'Picked up 10m ago'
  }
];

// NEW: Custom Rider Menu Items mapped to their specific routes!
const RIDER_MENU_ITEMS = [
  { name: 'Dashboard', icon: 'home-outline', route: '/(rider)/deliveries' },
  { name: 'Delivery History', icon: 'time-outline', route: '/(rider)/history' },
  { name: 'Vehicle Settings', icon: 'bicycle-outline', route: '/(rider)/vehicle' },
  { name: 'Rider Support', icon: 'chatbubbles-outline', route: '/help' },
];

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'Requests' | 'Active'>('Requests');
  const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);
  
  // State to control Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const displayedDeliveries = deliveries.filter(d => 
    activeTab === 'Requests' ? d.status === 'Pending' : d.status === 'Active'
  );

  const handleTabSwitch = (tab: 'Requests' | 'Active') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const acceptRequest = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'Active' } : d));
  };

  const completeDelivery = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDeliveries(prev => prev.filter(d => d.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* UNIVERSAL TOPNAV FOR THE RIDER */}
      <TopNav 
        title="Rider Dashboard"
        leftIcon="menu-outline"
        onLeftPress={() => setIsSidebarOpen(true)}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      <View style={styles.responsiveWrapper}>
        <View style={styles.responsiveInner}>

          <View style={styles.header}>
            <View style={styles.headerProfile}>
              <View style={[styles.avatarBox, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarText}>E</Text>
              </View>
              <View>
                <Text style={[styles.headerGreeting, { color: colors.textMuted }]}>Logistics Staff,</Text>
                <Text style={[styles.headerName, { color: colors.text }]}>Emmanuel</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.logoutBtn, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}
              onPress={() => router.replace('/login')}
            >
              <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
            
            <View style={[styles.statusCard, { backgroundColor: isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(150, 150, 150, 0.1)', borderColor: isOnline ? '#4CAF50' : colors.border }]}>
              <View style={styles.statusTextWrap}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' }]} />
                  <Text style={[styles.statusTitle, { color: isOnline ? '#388E3C' : colors.text }]}>
                    {isOnline ? "Active for Shift" : "On Break / Offline"}
                  </Text>
                </View>
                <Text style={[styles.statusSub, { color: colors.textMuted }]}>
                  {isOnline ? "Ready for dispatch..." : "You won't receive new orders."}
                </Text>
              </View>
              <Switch 
                value={isOnline} 
                onValueChange={setIsOnline} 
                trackColor={{ false: colors.border, true: '#81C784' }} 
                thumbColor={isOnline ? '#4CAF50' : '#f4f3f4'} 
              />
            </View>

            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Today</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{MOCK_METRICS.tripsToday}</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>This Month</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{MOCK_METRICS.tripsMonth}</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Performance</Text>
                <View style={styles.ratingRow}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{MOCK_METRICS.avgRating}</Text>
                  <Ionicons name="star" size={14} color="#FF9800" style={{ marginLeft: 2 }} />
                </View>
              </View>
            </View>

            <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'Requests' && [styles.tabBtnActive, { backgroundColor: colors.surface }]]}
                onPress={() => handleTabSwitch('Requests')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'Requests' ? colors.text : colors.textMuted }]}>New Dispatches</Text>
                {isOnline && deliveries.filter(d => d.status === 'Pending').length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{deliveries.filter(d => d.status === 'Pending').length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'Active' && [styles.tabBtnActive, { backgroundColor: colors.surface }]]}
                onPress={() => handleTabSwitch('Active')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'Active' ? colors.text : colors.textMuted }]}>In Box</Text>
              </TouchableOpacity>
            </View>

            {!isOnline && activeTab === 'Requests' ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="moon-outline" size={60} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>You are offline</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Toggle your status to online to start receiving delivery requests from Bwari Kitchen.</Text>
              </View>
            ) : displayedDeliveries.length > 0 ? (
              displayedDeliveries.map((delivery) => (
                <View key={delivery.id} style={[styles.deliveryCard, { backgroundColor: colors.surface, borderColor: activeTab === 'Active' ? Colors.primary : colors.border }]}>
                  
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.deliveryId, { color: colors.text }]}>{delivery.id}</Text>
                      <Text style={[styles.deliveryDistance, { color: colors.textMuted }]}>{delivery.distance} • ~{delivery.estimatedTime}</Text>
                    </View>
                    <Text style={[styles.deliveryTime, { color: colors.textMuted }]}>{delivery.timePassed}</Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={24} color="#D32F2F" />
                    <View style={styles.locationTextWrap}>
                      <Text style={[styles.locationLabel, { color: colors.textMuted }]}>DROP-OFF</Text>
                      <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={2}>{delivery.dropoffAddress}</Text>
                    </View>
                  </View>

                  {activeTab === 'Active' && (
                    <View style={[styles.customerBox, { backgroundColor: isDark ? colors.background : '#F9F9F9' }]}>
                      <View style={styles.customerHeader}>
                        <Ionicons name="person-circle-outline" size={32} color={colors.textMuted} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={[styles.customerName, { color: colors.text }]}>{delivery.customerName}</Text>
                          <Text style={[styles.customerPhone, { color: colors.textMuted }]}>{delivery.customerPhone}</Text>
                        </View>
                        <TouchableOpacity style={[styles.callBtn, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                          <Ionicons name="call" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    {activeTab === 'Requests' ? (
                      <>
                        <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.border }]}>
                          <Text style={[styles.btnSecondaryText, { color: colors.text }]}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.primary }]} onPress={() => acceptRequest(delivery.id)}>
                          <Text style={styles.btnPrimaryText}>Start Pickup</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={[styles.btnSecondary, { borderColor: Colors.primary }]}
                          onPress={() => router.push({
                              pathname: '/(rider)/map',
                              params: { id: delivery.id, address: delivery.dropoffAddress }
                          })}
                        >
                          <Ionicons name="navigate" size={18} color={Colors.primary} style={{ marginRight: 5 }} />
                          <Text style={[styles.btnSecondaryText, { color: Colors.primary }]}>Navigate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#4CAF50' }]} onPress={() => completeDelivery(delivery.id)}>
                          <Text style={styles.btnPrimaryText}>Delivered</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="bicycle-outline" size={60} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No {activeTab} Orders</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  {activeTab === 'Requests' 
                    ? "Waiting for the kitchen to dispatch new orders..." 
                    : "You don't have any active deliveries in your box."}
                </Text>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
      
      {/* NEW: Pass the RIDER_MENU_ITEMS into the Sidebar explicitly */}
      <Sidebar 
        visible={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        menuItems={RIDER_MENU_ITEMS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  responsiveWrapper: { 
    flex: 1, 
    alignItems: 'center', 
    width: '100%' 
  },
  responsiveInner: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 600 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 15,
    paddingTop: 10
  },
  headerProfile: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatarBox: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  avatarText: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: '900' 
  },
  headerGreeting: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  headerName: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  logoutBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  statusCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: 20 
  },
  statusTextWrap: { 
    flex: 1, 
    paddingRight: 15 
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  statusDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 8 
  },
  statusTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  statusSub: { 
    fontSize: 13, 
    lineHeight: 18 
  },
  metricsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25, 
    gap: 10 
  },
  metricCard: { 
    flex: 1, 
    padding: 15, 
    borderRadius: 16, 
    borderWidth: 1, 
    alignItems: 'center' 
  },
  metricLabel: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    marginBottom: 5 
  },
  metricValue: { 
    fontSize: 18, 
    fontWeight: '900' 
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  tabContainer: { 
    flexDirection: 'row', 
    borderRadius: 15, 
    padding: 5, 
    marginBottom: 20 
  },
  tabBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    paddingVertical: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 12 
  },
  tabBtnActive: { 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  badge: { 
    backgroundColor: '#D32F2F', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 10, 
    marginLeft: 6 
  },
  badgeText: { 
    color: '#FFF', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  deliveryCard: { 
    borderRadius: 20, 
    borderWidth: 1, 
    padding: 20, 
    marginBottom: 15 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  deliveryId: { 
    fontSize: 20, 
    fontWeight: '900', 
    marginBottom: 2 
  },
  deliveryDistance: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  deliveryTime: { 
    fontSize: 12, 
    fontWeight: '500' 
  },
  divider: { 
    height: 1, 
    marginVertical: 15 
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  locationTextWrap: { 
    marginLeft: 12, 
    flex: 1 
  },
  locationLabel: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    letterSpacing: 1, 
    marginBottom: 2 
  },
  locationAddress: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    lineHeight: 22 
  },
  customerBox: { 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 20 
  },
  customerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  customerName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    marginBottom: 2 
  },
  customerPhone: { 
    fontSize: 13 
  },
  callBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  btnSecondary: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  btnSecondaryText: { 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  btnPrimary: { 
    flex: 1.5, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16 
  },
  btnPrimaryText: { 
    color: '#FFF', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 40 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 15, 
    marginBottom: 8 
  },
  emptySub: { 
    fontSize: 14, 
    textAlign: 'center', 
    paddingHorizontal: 30, 
    lineHeight: 20 
  }
});