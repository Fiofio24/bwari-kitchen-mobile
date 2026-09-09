import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../app/lib/api';

export interface AppNotification {
  id: string;
  type: 'order_update' | 'promotion' | 'system' | 'review_request';
  title: string;
  body: string;
  isRead: boolean;
  relatedOrderId: string | null;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: (silent?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/notifications?limit=50');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const registerPushToken = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D32F2F',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // <-- ADD THIS LINE
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert("Permission Denied", "You need to allow notifications in your phone settings!");
          return; 
        }
        
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
          
          if (!projectId) {
            Alert.alert("Missing Project ID", "Expo needs an EAS Project ID to generate a token. You need to run 'eas init' in your terminal.");
            return;
          }

          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
          
          if (tokenData.data) {
             console.log("PUSH TOKEN GENERATED:", tokenData.data);
             // Alert.alert("Token Success!", "Your phone successfully generated a push token."); // Uncomment if you want to be annoyed by success popups
             await api.patch('/api/auth/device-token', { deviceToken: tokenData.data });
          }
        } catch (error: any) {
          console.warn('Push token generation failed:', error);
          Alert.alert("Push Token Error", error?.message || "Failed to generate token");
        }
      } else {
        Alert.alert("Emulator Detected", "Push notifications rarely work on emulators. You usually need a physical phone to test them.");
      }
    };

    registerPushToken();
    refresh();

    const intervalId = setInterval(() => {
      refresh(true); 
    }, 30000);

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      refresh(true); 
    });

    return () => {
      clearInterval(intervalId);
      notificationListener.remove(); 
    };
  }, [refresh]);

  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || target.isRead) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch('/api/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const deleteNotificationFn = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification: deleteNotificationFn,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};