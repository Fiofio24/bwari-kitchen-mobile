import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../app/lib/api';
import { useMenu } from './MenuContext';

export interface FavoriteItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  rating?: string;
  image: string;
  subItems?: any[];
}

interface FavoriteContextType {
  favorites: FavoriteItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const { findItem, findPackage } = useMenu();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/favorites');
      const mapped: FavoriteItem[] = res.data.favorites.map((fav: any) => {
        if (fav.menuItem) {
          return {
            id: fav.menuItem.id,
            name: fav.menuItem.name,
            category: fav.menuItem.category?.name,
            price: fav.menuItem.discountPrice || fav.menuItem.basePrice,
            image: fav.menuItem.imageUrl,
          };
        }
        return {
          id: fav.package.id,
          name: fav.package.name,
          price: fav.package.totalPrice,
          image: fav.package.imageUrl,
        };
      });
      setFavorites(mapped);
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = (id: string) => favorites.some(fav => fav.id === id);

  const toggleFavorite = async (item: FavoriteItem) => {
    const currentlyFavorited = isFavorite(item.id);

    // Optimistic update
    if (currentlyFavorited) {
      setFavorites(prev => prev.filter(fav => fav.id !== item.id));
    } else {
      setFavorites(prev => [...prev, item]);
    }

    try {
      if (currentlyFavorited) {
        // Determine whether it's a menu item or package to send the right query param
        const isPackage = !!findPackage(item.id);
        await api.delete('/api/favorites', {
          params: isPackage ? { packageId: item.id } : { menuItemId: item.id }
        });
      } else {
        const isPackage = !!findPackage(item.id);
        const isMenuItem = !!findItem(item.id);
        await api.post('/api/favorites', {
          menuItemId: isMenuItem ? item.id : undefined,
          packageId: isPackage ? item.id : undefined,
        });
      }
    } catch (err) {
      console.warn('Failed to sync favorite:', err);
      // Revert optimistic update on failure
      await refresh();
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, loading, refresh, toggleFavorite, isFavorite }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (context === undefined) throw new Error('useFavorites must be used within a FavoriteProvider');
  return context;
};