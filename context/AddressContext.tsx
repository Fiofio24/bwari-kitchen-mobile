import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import api from '../app/lib/api';

export interface Address {
  id: string;
  label: string | null;
  streetAddress: string;
  landmark: string | null;
  area: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

interface AddressContextType {
  addresses: Address[];
  activeAddress: Address | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addAddress: (address: {
    label?: string;
    streetAddress: string;
    landmark?: string;
    area?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
  }) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateAddress: (id: string, updates: {
    label?: string;
    streetAddress?: string;
    landmark?: string;
    area?: string;
    latitude?: number; 
    longitude?: number;
  }) => Promise<void>;
  addCurrentLocationAddress: (details: {
    label?: string;
    streetAddress: string;
    landmark?: string;
    area?: string;
    isDefault?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  setActiveAddress: (id: string | null) => void; 
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempActiveId, setTempActiveId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/addresses');
      setAddresses(res.data.addresses);
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAddress = async (address: {
    label?: string;
    streetAddress: string;
    landmark?: string;
    area?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
  }) => {
    try {
      const res = await api.post('/api/addresses', address);
      await refresh();
      return { success: true, id: res.data.address.id };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const updateAddress = async (id: string, updates: {
    label?: string;
    streetAddress?: string;
    landmark?: string;
    area?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    await api.patch(`/api/addresses/${id}`, updates);
    await refresh();
  };

  const addCurrentLocationAddress = async (details: {
    label?: string;
    streetAddress: string;
    landmark?: string;
    area?: string;
    isDefault?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Location permission was denied. Please enable it in settings.' };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await addAddress({
        ...details,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      return { success: true };
    } catch (err) {
      console.warn('Failed to get current location:', err);
      return { success: false, error: 'Could not get your location. Please try again.' };
    }
  };

  const removeAddress = async (id: string) => {
    await api.delete(`/api/addresses/${id}`);
    await refresh();
  };

  const setDefaultAddress = async (id: string) => {
    await api.patch(`/api/addresses/${id}/default`);
    setTempActiveId(null); 
    await refresh();
  };

  const setActiveAddress = (id: string | null) => {
    setTempActiveId(id);
  };

  const activeAddress = 
    (tempActiveId ? addresses.find((a: Address) => a.id === tempActiveId) : null) || 
    addresses.find((a: Address) => a.isDefault) || 
    addresses[0] || 
    null;

  return (
    <AddressContext.Provider value={{
      addresses,
      activeAddress,
      loading,
      refresh,
      addAddress,
      addCurrentLocationAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      setActiveAddress, 
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