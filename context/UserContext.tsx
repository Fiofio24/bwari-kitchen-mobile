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

interface UserData {
  name: string;
  email: string;
  avatarUri: string | null;
}

interface UserContextType {
  userData: UserData;
  updateAvatar: (uri: string) => void;
  updateUserData: (data: Partial<UserData>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const USER_STORAGE_KEY = '@bwari_kitchen_user';

const DEFAULT_USER: UserData = {
  name: "Obansa Seriff",
  email: "seriff.dev@uplay.com",
  avatarUri: null,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await safeStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setUserData(JSON.parse(savedUser));
      }
      setIsLoaded(true);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const saveAndSync = async () => {
      await safeStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    };
    saveAndSync();
  }, [userData, isLoaded]);

  const updateAvatar = (uri: string) => {
    setUserData(prev => ({ ...prev, avatarUri: uri }));
  };

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  return (
    <UserContext.Provider value={{ userData, updateAvatar, updateUserData }}>
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