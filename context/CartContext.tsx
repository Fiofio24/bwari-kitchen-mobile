import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../app/lib/api'; 

const safeStorage = {
  getItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch { return null; }
    return null;
  },
  setItem: async (key: string, value: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }
};

export interface CartItem {
  id: string;
  name: string;
  category?: string;
  contents?: string;
  price: number;
  quantity: number;
  image: string;
  subItems?: any[]; 
  isAvailable?: boolean; 
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  removeMultipleFromCart: (ids: string[]) => void; 
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  syncCloudCart: () => Promise<void>; // <-- NEW: Call this on Login!
  cartCount: number; 
  
  customPlate: Record<string, number>;
  setCustomPlate: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = '@bwari_kitchen_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true); // <-- NEW: Stops accidental cloud wipes
  
  const [customPlate, setCustomPlate] = useState<Record<string, number>>({});

  // 1. FETCH CART ON LOAD
  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await safeStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) setCartItems(JSON.parse(savedCart));
      await syncCloudCart();
      setIsLoaded(true); 
    };
    loadCart();
  }, []);

  // 2. THE MANUAL SYNC FUNCTION (Call this after successful login)
  const syncCloudCart = async () => {
    try {
      const res = await api.get('/api/cart');
      if (res.data?.success && res.data?.cart?.length > 0) {
        // Temporarily disable pushing to the cloud so we don't cause a loop
        setSyncEnabled(false);
        setCartItems(res.data.cart);
        await safeStorage.setItem(CART_STORAGE_KEY, JSON.stringify(res.data.cart));
        setTimeout(() => setSyncEnabled(true), 1000); // Re-enable syncing
      }
    } catch {
      // Silently ignore if offline or not logged in yet
    }
  };

  // 3. SAVE AND PUSH CART ON CHANGE
  useEffect(() => {
    if (!isLoaded || !syncEnabled) return; 
    
    const saveAndSync = async () => {
      await safeStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      try {
        await api.post('/api/cart', { cartItems });
      } catch {}
    };
    saveAndSync();
  }, [cartItems, isLoaded, syncEnabled]);

  const addToCart = (newItem: any) => {
    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === newItem.id);
      if (existingIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingIndex];
        const newQuantity = (existingItem.quantity || 1) + (newItem.quantity || 1);
        updatedItems.splice(existingIndex, 1);
        return [{ ...existingItem, quantity: newQuantity }, ...updatedItems];
      } else {
        return [newItem, ...prevItems];
      }
    });
  };

  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(item => item.id !== id));
  
  const removeMultipleFromCart = (ids: string[]) => setCartItems(prev => prev.filter(item => !ids.includes(item.id)));
  
  const increaseQuantity = (id: string) => setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  
  const decreaseQuantity = (id: string) => setCartItems(prev => prev.map(item => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));

  // 4. BULLETPROOF CLEAR CART (Destroys local ghost cart, ignores cloud)
  const clearCart = async () => {
    setSyncEnabled(false); // Stop the effect from telling the backend the cart is empty
    setCartItems([]);
    await safeStorage.removeItem(CART_STORAGE_KEY);
    setTimeout(() => setSyncEnabled(true), 1000); // Turn it back on for the next user
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, removeMultipleFromCart, increaseQuantity, decreaseQuantity, clearCart, syncCloudCart, cartCount: cartItems.length, customPlate, setCustomPlate 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};