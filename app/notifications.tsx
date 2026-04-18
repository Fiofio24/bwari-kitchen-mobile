import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  LayoutAnimation,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useNotifications, AppNotification } from '../context/NotificationContext'; 
import TopNav from '../components/TopNav';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'order' | 'promo'>('all');

  const handleMarkAllAsRead = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    markAllAsRead();
  };

  const handleNotificationPress = (notification: AppNotification) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!notification.read) markAsRead(notification.id);
  };

  const handleActionPress = (notification: AppNotification) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.action?.route) {
      router.push(notification.action.route as any);
    }
  };

  const getIconConfig = (type: string) => {
    switch(type) {
      case 'order': 
        return { 
          name: 'fast-food', 
          color: '#FF9800', 
          bg: 'rgba(255, 152, 0, 0.15)' 
        };
      case 'promo': 
        return { 
          name: 'gift', 
          color: Colors.primary, 
          bg: 'rgba(211, 47, 47, 0.15)' 
        };
      case 'system': 
        return { 
          name: 'shield-checkmark', 
          color: '#4CAF50', 
          bg: 'rgba(76, 175, 80, 0.15)' 
        };
      default: 
        return { 
          name: 'notifications', 
          color: colors.textMuted, 
          bg: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' 
        };
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'all' ? true : n.type === activeTab
  );

  const recentNotifications = filteredNotifications.filter(n => 
    n.time.includes('min') || n.time.includes('hour') || n.time.includes('Today')
  );
  
  const earlierNotifications = filteredNotifications.filter(n => 
    !(n.time.includes('min') || n.time.includes('hour') || n.time.includes('Today'))
  );

  const renderNotificationCard = (notification: AppNotification) => {
    const config = getIconConfig(notification.type);
    
    return (
      <TouchableOpacity 
        key={notification.id} 
        style={[
          styles.notificationCard, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
          },
          !notification.read && { 
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
                style={[
                  styles.notificationTitle, 
                  { color: colors.text },
                  !notification.read && { fontWeight: '900' }
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {notification.time}
              </Text>
            </View>
            
            <Text 
              style={[
                styles.messageText, 
                { color: notification.read ? colors.textMuted : colors.text }
              ]}
            >
              {notification.message}
            </Text>
          </View>

          {!notification.read && (
            <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />
          )}
        </View>

        {notification.image && (
          <View style={styles.richMediaContainer}>
            <Image 
              source={{ uri: notification.image }} 
              style={styles.richMediaImage} 
            />
          </View>
        )}

        {notification.action && (
          <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}
              onPress={() => handleActionPress(notification)}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
                {notification.action.label}
              </Text>
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

      {/* PREMIUM UNIVERSAL TOPNAV */}
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
              onPress={() => router.push('/profile')}
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

      {/* FILTER TABS */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'all' ? [styles.activeTab, { backgroundColor: Colors.primary }] : { backgroundColor: isDark ? colors.surface : '#EAEAEC' }
            ]} 
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === 'all' ? '#FFF' : colors.text }]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'order' ? [styles.activeTab, { backgroundColor: Colors.primary }] : { backgroundColor: isDark ? colors.surface : '#EAEAEC' }
            ]} 
            onPress={() => setActiveTab('order')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === 'order' ? '#FFF' : colors.text }]}>
              Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'promo' ? [styles.activeTab, { backgroundColor: Colors.primary }] : { backgroundColor: isDark ? colors.surface : '#EAEAEC' }
            ]} 
            onPress={() => setActiveTab('promo')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === 'promo' ? '#FFF' : colors.text }]}>
              Promos
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* RICH NOTIFICATIONS LIST WITH DATE GROUPING */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        {filteredNotifications.length > 0 ? (
          <>
            {recentNotifications.length > 0 && (
              <View style={styles.dateGroupWrapper}>
                <Text style={[styles.dateGroupHeader, { color: colors.textMuted }]}>
                  NEW
                </Text>
                {recentNotifications.map(renderNotificationCard)}
              </View>
            )}

            {earlierNotifications.length > 0 && (
              <View style={styles.dateGroupWrapper}>
                <Text style={[styles.dateGroupHeader, { color: colors.textMuted }]}>
                  EARLIER
                </Text>
                {earlierNotifications.map(renderNotificationCard)}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
              <Ionicons name="notifications-off-outline" size={60} color={colors.textMuted} style={{ opacity: 0.5 }} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {"You're all caught up! We'll notify you when there's an update on your orders or new promotions."}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginLeft: 15,
  },
  tabContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: { 
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  dateGroupWrapper: {
    marginBottom: 10,
  },
  dateGroupHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 5,
    marginLeft: 5,
  },
  notificationCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingRight: 10,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  richMediaContainer: {
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
    height: 140,
  },
  richMediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionRow: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 22,
  },
});