// This is our Single Source of Truth. 
export const CATEGORIES = ['All', 'Main', 'Protein', 'Swallow', 'Snacks', 'Drinks', 'Rice'];

// 1. SINGLE ITEMS (Used in the Menu Page Builder)
// Notice how we added `isAvailable: false` to Beef so you can test the new cart logic!
export const MENU_ITEMS = [
  // Rice Category
  { id: 'm1', name: 'Party Jollof', price: 2000, category: 'Rice', image: 'https://i.pinimg.com/1200x/03/f7/66/03f766e2ea78230637756bfa0db65207.jpg' },
  { id: 'm2', name: 'Fried Rice', price: 2000, category: 'Rice', image: 'https://i.pinimg.com/1200x/4c/c7/9f/4cc79f76b53e00505c9facf01811f952.jpg' },
  { id: 'm3', name: 'White Rice & Stew', price: 1500, category: 'Rice', image: 'https://i.pinimg.com/1200x/80/dc/f3/80dcf30133b9103e42e394d6a659653c.jpg' },
  // Pasta Category
  { id: 'm15', name: 'Spaghetti', price: 2500, category: 'Pasta', image: 'https://i.pinimg.com/736x/1d/5e/14/1d5e140ce0655fa4f65a4171228db9a7.jpg' },
  { id: 'm16', name: 'Creamy Alfredo', price: 3000, category: 'Pasta', image: 'https://i.pinimg.com/1200x/70/ae/8c/70ae8c599a8c0a3ea1b150efc8f85d29.jpg' },
  // Protein Category
  { id: 'm4', name: 'Chicken', price: 3000, category: 'Protein', image: 'https://i.pinimg.com/736x/e8/aa/59/e8aa59f156cb749d253cfdc41f7664e5.jpg', isAvailable: false },
  { id: 'm5', name: 'Beef', price: 2000, category: 'Protein', image: 'https://i.pinimg.com/736x/a1/a5/35/a1a53571b1875fa1f92447d217ea3c4d.jpg', isAvailable: false }, // <-- OUT OF STOCK TEST
  { id: 'm9', name: 'Grilled Turkey', price: 4000, category: 'Protein', image: 'https://i.pinimg.com/236x/76/37/69/76376968105e7bf5647a38ac4a9ad60a.jpg' },
  // Snacks Category
  { id: 'm11', name: 'Meatpie', price: 700, category: 'Snacks', image: 'https://i.pinimg.com/1200x/8d/9d/e0/8d9de09b8acd3c17ef7ab8b14b9c97c0.jpg' },
  { id: 'm12', name: 'Plantain', price: 500, category: 'Snacks', image: 'https://i.pinimg.com/736x/de/1a/1d/de1a1d9f9a533c49b49ee90f644a5dec.jpg' },
  // Drinks Category
  { id: 'm6', name: 'Coca Cola', price: 1500, category: 'Drinks', image: 'https://i.pinimg.com/736x/e3/8f/af/e38faf15d4545d6da4073b0cfde5c2ea.jpg' },
  { id: 'm10', name: 'Zobo', price: 800, category: 'Drinks', image: 'https://i.pinimg.com/1200x/f8/ef/c9/f8efc94596458cb09b68a93f73c3287d.jpg' },
  // Swallow Category
  { id: 'm7', name: 'Semo', price: 1000, category: 'Swallow', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop', isAvailable: false },
  { id: 'm8', name: 'Amala', price: 1500, category: 'Swallow', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
  // Soup Category (for future expansion)
  { id: 'm13', name: 'Egusi Soup', price: 1200, category: 'Soup', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
  { id: 'm14', name: 'Ewedu Soup', price: 1000, category: 'Soup', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
];

// 2. COMBO PACKAGES (Used in the Home Page and "For You" Section)
export const COMBO_PACKAGES = [
  {
    id: 'pkg_1', category: 'Rice', name: 'Party Jollof | Chicken | Plantain', price: 5000, rating: '5.0', image: 'https://i.pinimg.com/736x/94/01/d3/9401d323126f8440305b83e4538ef026.jpg',
    subItems: [{ id: 'm1', name: 'Party Jollof', qty: 1, price: 2000 }, { id: 'm4', name: 'Chicken', qty: 1, price: 3000 }, { id: 'm12', name: 'Plantain', qty: 1, price: 500 }] // <-- Contains Chicken which is out of stock!
  },
  {
    id: 'pkg_2', category: 'Swallow', name: 'Semo | Egusi | Beef', price: 3000, rating: '4.8', image: 'https://i.pinimg.com/1200x/f6/21/8a/f6218a246ea386776dad0423aca17a38.jpg',
    subItems: [{ id: 'm7', name: 'Semo & Egusi', qty: 1, price: 1000 }, { id: 'm5', name: 'Beef', qty: 1, price: 2000 }] // <-- Contains Beef!
  },
  {
    id: 'pkg_3', category: 'Rice', name: 'White Rice | Stew | Turkey | Plantain', price: 5500, rating: '4.9', image: 'https://i.pinimg.com/736x/bb/11/ac/bb11ac0c894c4ff646200254b665b54a.jpg',
    subItems: [{ id: 'm3', name: 'White Rice', qty: 1, price: 1500 }, { id: 'm9', name: 'Grilled Turkey', qty: 1, price: 4000 }]
  },
  {
    id: 'pkg_4', category: 'Snacks', name: 'Meatpie | Zobo', price: 1500, rating: '4.5', image: 'https://i.pinimg.com/1200x/8d/9d/e0/8d9de09b8acd3c17ef7ab8b14b9c97c0.jpg',
    subItems: [{ id: 'm10', name: 'Chilled Zobo', qty: 1, price: 800 }, { id: 'm11', name: 'Meatpie', qty: 1, price: 700 }]
  },
  {
    id: 'pkg_5', category: 'Swallow', name: 'Amala | Ewedu | Turkey', price: 5500, rating: '4.7', image: 'https://i.pinimg.com/736x/42/2f/f9/422ff9e5957843170d10025a9516cc0a.jpg',
    subItems: [{ id: 'm8', name: 'Amala & Ewedu', qty: 1, price: 1500 }, { id: 'm9', name: 'Grilled Turkey', qty: 1, price: 4000 }]
  },
  {
    id: 'pkg_6', category: 'Rice', name: 'Fried Rice | Beef | Coke', price: 5500, rating: '5.0', image: 'https://i.pinimg.com/1200x/4c/c7/9f/4cc79f76b53e00505c9facf01811f952.jpg',
    subItems: [{ id: 'm2', name: 'Fried Rice', qty: 1, price: 2000 }, { id: 'm5', name: 'Beef', qty: 1, price: 2000 }, { id: 'm6', name: 'Coca Cola', qty: 1, price: 1500 }] // <-- Contains Beef!
  },
];

// Helper functions for the For You Card
export const getBreakfastDishes = () => COMBO_PACKAGES.filter(item => ['Rice', 'Swallow', 'Snacks'].includes(item.category)).slice(0, 3);
export const getLunchDishes = () => COMBO_PACKAGES.filter(item => ['Rice', 'Swallow', 'Drinks'].includes(item.category)).reverse().slice(0, 3);
export const getDinnerDishes = () => COMBO_PACKAGES.filter(item => ['Rice', 'Swallow'].includes(item.category)).slice(1, 4);