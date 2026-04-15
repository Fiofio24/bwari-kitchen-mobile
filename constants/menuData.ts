// This is our Single Source of Truth. 
export const CATEGORIES = ['All', 'Main', 'Protein', 'Swallow', 'Snacks', 'Drinks', 'Rice'];

// 1. SINGLE ITEMS (Used in the Menu Page Builder)
// Notice how we added `isAvailable: false` to Beef so you can test the new cart logic!
export const MENU_ITEMS = [
  { id: 'm1', name: 'Party Jollof', price: 2000, category: 'Rice', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop' },
  { id: 'm2', name: 'Fried Rice', price: 2000, category: 'Rice', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=800&auto=format&fit=crop' },
  { id: 'm3', name: 'White Rice', price: 1500, category: 'Rice', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop' },
  { id: 'm4', name: 'Chicken', price: 3000, category: 'Protein', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop', isAvailable: false },
  { id: 'm5', name: 'Beef', price: 2000, category: 'Protein', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', isAvailable: false }, // <-- OUT OF STOCK TEST
  { id: 'm6', name: 'Coca Cola', price: 1500, category: 'Drinks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop' },
  { id: 'm7', name: 'Semo & Egusi', price: 1000, category: 'Swallow', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop', isAvailable: false },
  { id: 'm8', name: 'Amala & Ewedu', price: 1500, category: 'Swallow', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
  { id: 'm9', name: 'Grilled Turkey', price: 4000, category: 'Protein', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop' },
  { id: 'm10', name: 'Chilled Zobo', price: 800, category: 'Drinks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop' },
  { id: 'm11', name: 'Meatpie', price: 700, category: 'Snacks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop' },
];

// 2. COMBO PACKAGES (Used in the Home Page and "For You" Section)
export const COMBO_PACKAGES = [
  {
    id: 'pkg_1', category: 'Rice', name: 'Party Jollof & Chicken', price: 5000, rating: '5.0', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop',
    subItems: [{ id: 'm1', name: 'Party Jollof', qty: 1, price: 2000 }, { id: 'm4', name: 'Chicken', qty: 1, price: 3000 }]
  },
  {
    id: 'pkg_2', category: 'Swallow', name: 'Semo, Egusi & Beef', price: 3000, rating: '4.8', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    subItems: [{ id: 'm7', name: 'Semo & Egusi', qty: 1, price: 1000 }, { id: 'm5', name: 'Beef', qty: 1, price: 2000 }] // <-- Contains Beef!
  },
  {
    id: 'pkg_3', category: 'Rice', name: 'White Rice & Turkey', price: 5500, rating: '4.9', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop',
    subItems: [{ id: 'm3', name: 'White Rice', qty: 1, price: 1500 }, { id: 'm9', name: 'Grilled Turkey', qty: 1, price: 4000 }]
  },
  {
    id: 'pkg_4', category: 'Snacks', name: 'Zobo & Meatpie', price: 1500, rating: '4.5', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop',
    subItems: [{ id: 'm10', name: 'Chilled Zobo', qty: 1, price: 800 }, { id: 'm11', name: 'Meatpie', qty: 1, price: 700 }]
  },
  {
    id: 'pkg_5', category: 'Swallow', name: 'Amala, Ewedu & Turkey', price: 5500, rating: '4.7', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
    subItems: [{ id: 'm8', name: 'Amala & Ewedu', qty: 1, price: 1500 }, { id: 'm9', name: 'Grilled Turkey', qty: 1, price: 4000 }]
  },
  {
    id: 'pkg_6', category: 'Rice', name: 'Fried Rice, Beef & Coke', price: 5500, rating: '5.0', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=800&auto=format&fit=crop',
    subItems: [{ id: 'm2', name: 'Fried Rice', qty: 1, price: 2000 }, { id: 'm5', name: 'Beef', qty: 1, price: 2000 }, { id: 'm6', name: 'Coca Cola', qty: 1, price: 1500 }] // <-- Contains Beef!
  },
];

// Helper functions for the For You Card
export const getBreakfastDishes = () => COMBO_PACKAGES.filter(item => ['Rice', 'Swallow', 'Snacks'].includes(item.category)).slice(0, 3);
export const getLunchDishes = () => COMBO_PACKAGES.filter(item => ['Rice', 'Swallow', 'Drinks'].includes(item.category)).reverse().slice(0, 3);
export const getDinnerDishes = () => COMBO_PACKAGES.filter(item => ['Rice', 'Swallow'].includes(item.category)).slice(1, 4);