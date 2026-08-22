import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  },
  removeItem: async (key: string) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) { console.warn("Storage Error:", e); }
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
  cartCount: number; 
  
  // NEW: Global Package Builder State
  customPlate: Record<string, number>;
  setCustomPlate: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = '@bwari_kitchen_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // NEW: Holding area for the package being built
  const [customPlate, setCustomPlate] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await safeStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) setCartItems(JSON.parse(savedCart));
      setIsLoaded(true); 
    };
    loadCart();
  }, []);

  useEffect(() => {
    if (!isLoaded) return; 
    const saveAndSync = async () => {
      await safeStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    };
    saveAndSync();
  }, [cartItems, isLoaded]);

  const addToCart = (newItem: any) => {
    setCartItems(prevItems => {
      // Check if the exact same item/package already exists in the cart
      const existingIndex = prevItems.findIndex(item => item.id === newItem.id);

      if (existingIndex > -1) {
        // 1. Item exists: update its quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingIndex];
        
        const newQuantity = (existingItem.quantity || 1) + (newItem.quantity || 1);
        const updatedItem = { ...existingItem, quantity: newQuantity };

        // 2. Remove it from its current position and move it to the TOP (index 0)
        updatedItems.splice(existingIndex, 1);
        return [updatedItem, ...updatedItems];
      } else {
        // Brand new item: add it directly to the top of the list
        return [newItem, ...prevItems];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const removeMultipleFromCart = (ids: string[]) => {
    setCartItems(prev => prev.filter(item => !ids.includes(item.id)));
  };

  const increaseQuantity = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decreaseQuantity = (id: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);
  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      removeMultipleFromCart, 
      increaseQuantity, 
      decreaseQuantity, 
      clearCart, 
      cartCount,
      customPlate, // Provided globally
      setCustomPlate // Provided globally
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