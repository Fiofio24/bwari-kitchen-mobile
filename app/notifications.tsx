import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  LayoutAnimation,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useNotifications, AppNotification } from '../context/NotificationContext'; 
import TopNav from '../components/TopNav';

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (date.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isRecent = (isoString: string) => {
  const diffMs = new Date().getTime() - new Date(isoString).getTime();
  return diffMs < 24 * 60 * 60 * 1000; // within last 24h
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { notifications, markAsRead, markAllAsRead, unreadCount, loading, refresh } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'order_update' | 'promotion'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    markAllAsRead();
  };

  const handleNotificationPress = (notification: AppNotification) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!notification.isRead) markAsRead(notification.id);
  };

  const handleViewOrder = (notification: AppNotification) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.relatedOrderId) {
      router.push({ pathname: '/track-order', params: { orderId: notification.relatedOrderId } });
    }
  };

  const getIconConfig = (type: string) => {
    switch(type) {
      case 'order_update': 
        return { name: 'fast-food', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)' };
      case 'promotion': 
        return { name: 'gift', color: Colors.primary, bg: 'rgba(211, 47, 47, 0.15)' };
      case 'review_request':
        return { name: 'star', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.15)' };
      case 'system': 
        return { name: 'shield-checkmark', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)' };
      default: 
        return { name: 'notifications', color: colors.textMuted, bg: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' };
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'all' ? true : n.type === activeTab
  );

  const recentNotifications = filteredNotifications.filter(n => isRecent(n.createdAt));
  const earlierNotifications = filteredNotifications.filter(n => !isRecent(n.createdAt));

  const renderNotificationCard = (notification: AppNotification) => {
    const config = getIconConfig(notification.type);
    
    return (
      <TouchableOpacity 
        key={notification.id} 
        style={[
          styles.notificationCard, 
          { backgroundColor: colors.surface, borderColor: colors.border },
          !notification.isRead && { 
            backgroundColor: isDark ? 'rgba(211,47,47,0.05)' : '#FFF5F5',
            borderColor: isDark ? 'rgba(211,47,47,0.3)' : '#FFD6D6'
          }
        ]}
        activeOpacity={0.9}
        onPress={() => handleNotificationPress(notification)}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
            <Ionicons name={config.name as any} size={22} color={config.color} />
          </View>
          
          <View style={styles.contentBox}>
            <View style={styles.titleRow}>
              <Text 
                style={[styles.notificationTitle, { color: colors.text }, !notification.isRead && { fontWeight: '900' }]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatTime(notification.createdAt)}
              </Text>
            </View>
            
            <Text style={[styles.messageText, { color: notification.isRead ? colors.textMuted : colors.text }]}>
              {notification.body}
            </Text>
          </View>

          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />
          )}
        </View>

        {notification.relatedOrderId && (
          <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}
              onPress={() => handleViewOrder(notification)}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: Colors.primary }]}>View Order</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Notifications"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
        rightComponent={
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.actionIcon} 
              onPress={() => router.push('/notification-preferences')}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={24} color="#FFF" />
            </TouchableOpacity> 
            <TouchableOpacity 
              style={styles.actionIcon} 
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="checkmark-done-outline" 
                size={26} 
                color={unreadCount > 0 ? "#FFF" : "rgba(255,255,255,0.4)"} 
              />
            </TouchableOpacity> 
          </View>
        }
      />

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'all' ? [styles.activeTab, { backgroundColor: Colors.primary }] : { backgroundColor: isDark ? colors.surface : '#EAEAEC' }]} 
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === 'all' ? '#FFF' : colors.text }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'order_update' ? [styles.activeTab, { backgroundColor: Colors.primary }] : { backgroundColor: isDark ? colors.surface : '#EAEAEC' }]} 
            onPress={() => setActiveTab('order_update')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === 'order_update' ? '#FFF' : colors.text }]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'promotion' ? [styles.activeTab, { backgroundColor: Colors.primary }] : { backgroundColor: isDark ? colors.surface : '#EAEAEC' }]} 
            onPress={() => setActiveTab('promotion')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === 'promotion' ? '#FFF' : colors.text }]}>Promos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {filteredNotifications.length > 0 ? (
            <>
              {recentNotifications.length > 0 && (
                <View style={styles.dateGroupWrapper}>
                  <Text style={[styles.dateGroupHeader, { color: colors.textMuted }]}>NEW</Text>
                  {recentNotifications.map(renderNotificationCard)}
                </View>
              )}
              {earlierNotifications.length > 0 && (
                <View style={styles.dateGroupWrapper}>
                  <Text style={[styles.dateGroupHeader, { color: colors.textMuted }]}>EARLIER</Text>
                  {earlierNotifications.map(renderNotificationCard)}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
                <Ionicons name="notifications-off-outline" size={60} color={colors.textMuted} style={{ opacity: 0.5 }} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {"You're all caught up! We'll notify you when there's an update on your orders or new promotions."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// styles unchanged from your original — reuse exactly as-is, minus richMediaContainer/richMediaImage (no longer used, safe to leave in file unused or remove)
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginLeft: 15 },
  tabContainer: { marginTop: 15, marginBottom: 10 },
  tabScrollContent: { paddingHorizontal: 20, gap: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  activeTab: { elevation: 2, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingTop: 10, paddingHorizontal: 20 },
  dateGroupWrapper: { marginBottom: 10 },
  dateGroupHeader: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginTop: 5, marginLeft: 5 },
  notificationCard: { padding: 15, borderRadius: 20, borderWidth: 1, marginBottom: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  contentBox: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  notificationTitle: { flex: 1, fontSize: 15, fontWeight: '700', paddingRight: 10 },
  timeText: { fontSize: 11, fontWeight: '600' },
  messageText: { fontSize: 13, lineHeight: 20 },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5 },
  actionRow: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 15 },
  actionButtonText: { fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 30, lineHeight: 22 },
});