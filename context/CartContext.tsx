import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  name: string;
  contents?: string;
  price: number;
  quantity: number;
  image: string;
  isAvailable?: boolean; 
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  cartCount: number; 
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = '@bwari_kitchen_cart';

// SIMULATING THE BACKEND: 
// THE FIX: We moved this to the top level so every function in the file can see it!
// Notice ID '1' (Party Jollof) is missing from this list.
const LIVE_AVAILABLE_IDS = ['2', '3', '4', '5', '6', '7', '8', 'b1', 'b2', 'b3', 'l1', 'l2', 'l3', 'd1', 'd2', 'd3']; 

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart: CartItem[] = JSON.parse(savedCart);
          
          // Validate the saved cart against the live menu
          const validatedCart = parsedCart.map(item => ({
            ...item,
            isAvailable: LIVE_AVAILABLE_IDS.includes(item.id) 
          }));

          setCartItems(validatedCart);
        }
      } catch (error) {
        console.error("Failed to load cart from disk", error);
      } finally {
        setIsLoaded(true); 
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    if (!isLoaded) return; 

    const saveAndSync = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error("Failed to save/sync cart", error);
      }
    };

    saveAndSync();
  }, [cartItems, isLoaded]);

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id);
      
      // THE FIX: Real-time verification when the button is pressed!
      const isActuallyAvailable = LIVE_AVAILABLE_IDS.includes(newItem.id);

      if (existingItem) {
        return prev.map(item => 
          item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity, isAvailable: isActuallyAvailable } : item
        );
      }
      // THE FIX: Prepend the new item to the top of the list!
      return [{ ...newItem, isAvailable: isActuallyAvailable }, ...prev];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const increaseQuantity = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id && item.isAvailable ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decreaseQuantity = (id: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id && item.quantity > 1 && item.isAvailable) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  // Only count available items in the badge!
  const cartCount = cartItems.reduce((total, item) => total + (item.isAvailable ? item.quantity : 0), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};