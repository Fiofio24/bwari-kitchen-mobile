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

export interface Address {
  id: string;
  title: string;
  address: string;
  icon: string;
  isDefault: boolean;
}

interface AddressContextType {
  addresses: Address[];
  activeAddress: Address | null;
  addAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  setTemporaryActiveAddress: (addressText: string) => void; 
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);
const ADDRESS_STORAGE_KEY = '@bwari_kitchen_addresses';

const INITIAL_ADDRESSES: Address[] = [
  { id: '1', title: 'Home', address: 'No 6 Kuje Street, FCT Abuja', icon: 'home', isDefault: true },
  { id: '2', title: 'Work', address: 'Central Business District, Zone 4', icon: 'briefcase', isDefault: false },
  { id: '3', title: 'Friend', address: 'Gwarinpa Estate, Phase 2, House 44', icon: 'people', isDefault: false },
];

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [activeAddressText, setActiveAddressText] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAddresses = async () => {
      const savedData = await safeStorage.getItem(ADDRESS_STORAGE_KEY);
      if (savedData) {
        setAddresses(JSON.parse(savedData));
      }
      setIsLoaded(true);
    };
    loadAddresses();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const saveAndSync = async () => {
      await safeStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
    };
    saveAndSync();
  }, [addresses, isLoaded]);

  const addAddress = (newAddress: Address) => {
    setAddresses(prev => [...prev, newAddress]);
  };

  const removeAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
    setActiveAddressText(null); // Clear temp override when a new default is set
  };

  const setTemporaryActiveAddress = (addressText: string) => {
    setActiveAddressText(addressText);
  };

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
  
  // If user selected a temp address from TopNav, use that, otherwise use Default
  const activeAddress = activeAddressText 
    ? { id: 'temp', title: 'Custom Location', address: activeAddressText, icon: 'location', isDefault: true } 
    : defaultAddress;

  return (
    <AddressContext.Provider value={{ 
      addresses, 
      activeAddress, 
      addAddress, 
      removeAddress, 
      setDefaultAddress,
      setTemporaryActiveAddress
    }}>
      {children}
    </AddressContext.Provider>
  );
}

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (context === undefined) throw new Error('useAddresses must be used within an AddressProvider');
  return context;
};