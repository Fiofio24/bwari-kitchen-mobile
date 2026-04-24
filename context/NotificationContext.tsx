// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve system permissions and esbuild access errors.
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BULLETPROOF STORAGE WRAPPER
const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) { console.warn("Storage Error:", e); }
    return null;
  },
  setItem: async (key: string, value: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) { console.warn("Storage Error:", e); }
  }
};

// PRO UX FIX: Upgraded Interface to support Rich Media and Actionable Buttons
export interface AppNotification {
  id: string;
  type: 'order' | 'promo' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  image?: string; 
  action?: {
    label: string;
    route: string;
  };
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const NOTIFICATION_STORAGE_KEY = '@bwari_kitchen_notifications_v2';

// PRO UX FIX: High-end mock data with images and actions!
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'order',
    title: 'Order Preparing 👨‍🍳',
    message: 'The chef is currently preparing your Amala & Ewedu order. It will be handed over to the rider soon.',
    time: '2 mins ago',
    read: false,
    action: {
      label: 'Track Order',
      route: '/my-orders'
    }
  },
  {
    id: 'n2',
    type: 'promo',
    title: '20% OFF Weekend Special 🎁',
    message: 'Use code BWARIWKND at checkout to get 20% off all Combo Packages!',
    time: '2 hours ago',
    read: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
    action: {
      label: 'Order Now',
      route: '/menu'
    }
  },
  {
    id: 'n3',
    type: 'order',
    title: 'Order Delivered! 🎉',
    message: 'Your Party Jollof & Chicken has been delivered. Enjoy your meal and please rate your experience!',
    time: 'Yesterday',
    read: true,
    action: {
      label: 'Rate Order',
      route: '/my-orders'
    }
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Account Verified ✔️',
    message: 'Your email address has been successfully verified. Thank you for securing your account!',
    time: '2 days ago',
    read: true,
  },
  {
    id: 'n5',
    type: 'promo',
    title: 'Free Delivery Alert 🚚',
    message: 'Order above ₦10,000 today and get your food delivered completely free of charge!',
    time: 'Last Week',
    read: true,
    action: {
      label: 'Browse Menu',
      route: '/menu'
    }
  }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      const savedData = await safeStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (savedData) {
        setNotifications(JSON.parse(savedData));
      }
      setIsLoaded(true);
    };
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const saveAndSync = async () => {
      await safeStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    };
    saveAndSync();
  }, [notifications, isLoaded]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
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