import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../app/lib/api';

export interface MenuItemVariant {
  id: string;
  label: string;
  price: number;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  discountPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  category: { id: string; name: string };
  variants: MenuItemVariant[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface PackageSubItem {
  quantity: number;
  menuItem: {
    id: string;
    name: string;
    basePrice: number;
    discountPrice: number | null;
    imageUrl: string | null;
    category: { id: string; name: string };
  };
}

export interface MenuPackage {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalPrice: number;
  isFeatured: boolean;
  tags: string[];
  items: PackageSubItem[];
}

interface MenuContextType {
  items: MenuItem[];
  categories: MenuCategory[];
  packages: MenuPackage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  findItem: (id: string) => MenuItem | undefined;
  findPackage: (id: string) => MenuPackage | undefined;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [packages, setPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, categoriesRes, packagesRes] = await Promise.all([
        api.get('/api/menu/items?limit=200'),
        api.get('/api/menu/categories'),
        api.get('/api/menu/packages'),
      ]);
      setItems(itemsRes.data.items);
      setCategories(categoriesRes.data.categories);
      setPackages(packagesRes.data.packages);
    } catch (err) {
      console.warn('Menu fetch error:', err);
      setError('Failed to load menu. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const findItem = (id: string) => items.find(i => i.id === id);
  const findPackage = (id: string) => packages.find(p => p.id === id);

  return (
    <MenuContext.Provider value={{ items, categories, packages, loading, error, refresh: fetchAll, findItem, findPackage }}>
      {children}
    </MenuContext.Provider>
  );
}

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) throw new Error('useMenu must be used within a MenuProvider');
  return context;
};