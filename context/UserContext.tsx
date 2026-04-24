// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve module resolution errors.
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BULLETPROOF STORAGE WRAPPER
// This ensures the app works on Web (localStorage) and Mobile (AsyncStorage)
const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) { 
      console.warn("Storage Error:", e); 
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) { 
      console.warn("Storage Error:", e); 
    }
  },
  removeItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) { 
      console.warn("Storage Error:", e); 
    }
  }
};

interface UserData {
  name: string;
  email: string;
  avatarUri: string | null;
}

interface UserContextType {
  userData: UserData;
  updateAvatar: (uri: string) => void;
  updateUserData: (data: Partial<UserData>) => void;
  resetToDefault: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * PRO TIP: By changing '_v1' to '_v2', we force the app to ignore 
 * old saved data and use the new DEFAULT_USER values below.
 */
const USER_STORAGE_KEY = '@bwari_kitchen_user_v3'; 

const DEFAULT_USER: UserData = {
  name: "Emmanuel Ovie",
  email: "user-emmanuel@gmail.com",
  avatarUri: null,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user data on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await safeStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          setUserData(JSON.parse(savedUser));
        } else {
          // If no saved user, we stay with DEFAULT_USER
          setUserData(DEFAULT_USER);
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadUser();
  }, []);

  // Save user data whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const saveAndSync = async () => {
      await safeStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    };
    saveAndSync();
  }, [userData, isLoaded]);

  const updateAvatar = (uri: string) => {
    setUserData(prev => ({ 
      ...prev, 
      avatarUri: uri 
    }));
  };

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ 
      ...prev, 
      ...data 
    }));
  };

  const resetToDefault = async () => {
    await safeStorage.removeItem(USER_STORAGE_KEY);
    setUserData(DEFAULT_USER);
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      updateAvatar, 
      updateUserData, 
      resetToDefault 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};