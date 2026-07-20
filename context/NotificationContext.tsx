import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // We added a 'silent' parameter. If true, it won't trigger the loading spinner!
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
    // 1. Do a normal refresh on app launch
    refresh();

    // 2. Set up a silent background poll every 30 seconds
    const intervalId = setInterval(() => {
      refresh(true); // true = silent, no loading spinner!
    }, 30000);

    // 3. Clean up the interval if the context unmounts
    return () => clearInterval(intervalId);
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