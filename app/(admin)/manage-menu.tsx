// Note: This file requires an Expo/React Native environment to compile correctly.
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Platform,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

// Importing our shared UI components
import TopNav from '../../components/TopNav';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import GridDishCard from '../../components/GridDishCard';
import { MENU_ITEMS } from '../../constants/menuData';

const MENU_CATEGORIES = ['All', 'Drinks', 'Snacks', 'Swallow', 'Soup', 'Protein', 'Sides', 'Yam & Beans', 'Pasta', 'Rice'];

export default function ManageMenuScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Local state to simulate Database
  const [menuData, setMenuData] = useState<any[]>(MENU_ITEMS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  // Form States
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formVariants, setFormVariants] = useState<any[]>([]);

  // Grid Dimensions Calculation (Same as customer menu)
  const { width } = Dimensions.get('window');
  const GRID_PADDING = 20; 
  const GRID_GAP = 10; 
  // Max width constraint for responsive wrapper
  const USABLE_WIDTH = Math.min(width, 800) - (GRID_PADDING * 2);
  const MIN_CARD_WIDTH = 105; 
  const NUM_COLUMNS = Math.max(3, Math.floor((USABLE_WIDTH + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const CARD_WIDTH = Math.floor((USABLE_WIDTH - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

  const filteredItems = menuData.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openEditor = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
      setFormPrice(item.price.toString());
      setFormCategory(item.category);
      setFormImage(typeof item.image === 'string' ? item.image : '');
      setFormIsAvailable(item.isAvailable !== false);
      setFormVariants(item.variants ? [...item.variants] : []);
    } else {
      // New Item Template
      setEditingItem(null);
      setFormName('');
      setFormPrice('');
      setFormCategory('Rice'); // Default
      setFormImage('');
      setFormIsAvailable(true);
      setFormVariants([]);
    }
    
    setIsEditModalOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true
    }).start();
  };

  const closeEditor = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true
    }).start(() => setIsEditModalOpen(false));
  };

  const saveItem = () => {
    const newItem = {
      id: editingItem ? editingItem.id : `new_${Date.now()}`,
      name: formName || 'Unnamed Item',
      price: parseInt(formPrice) || 0,
      category: formCategory,
      image: formImage || 'https://cdn-icons-png.flaticon.com/512/684/684045.png',
      isAvailable: formIsAvailable,
      variants: formVariants.length > 0 ? formVariants : undefined
    };

    if (editingItem) {
      setMenuData(prev => prev.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      setMenuData(prev => [newItem, ...prev]);
    }
    closeEditor();
  };

  const addVariant = () => setFormVariants([...formVariants, { label: 'New Portion', price: parseInt(formPrice) || 0 }]);
  
  const updateVariant = (index: number, key: 'label' | 'price', value: string) => {
    const updated = [...formVariants];
    if (key === 'price') updated[index][key] = parseInt(value) || 0;
    else updated[index][key] = value;
    setFormVariants(updated);
  };

  const removeVariant = (index: number) => setFormVariants(formVariants.filter((_, i) => i !== index));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* UNIVERSAL TOPNAV */}
      <TopNav 
        title="Manage Menu" 
        leftIcon="arrow-back" 
        onLeftPress={() => router.back()} 
        isAbsolute={false}
        isScrolled={true}
        showDivider={false}
        rightComponent={
          <TouchableOpacity onPress={() => openEditor()} style={styles.headerAddBtn}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.headerAddText}>New Item</Text>
          </TouchableOpacity>
        }
      />

      {/* RESPONSIVE WRAPPER */}
      <View style={styles.responsiveWrapper}>
        <View style={styles.responsiveInner}>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
            
            <View style={styles.titlesWrapper}>
              <Text style={[styles.specialsText, { color: colors.textMuted }]}>Admin Controls</Text>
              <Text style={[styles.mainTitle, { color: Colors.primary }]}>Menu Database</Text>
            </View>

            <View style={styles.searchContainer}>
               <SearchBar onSubmit={(text) => setSearchQuery(text)} />
            </View>

            <View style={styles.menuTitleRow}>
              <View style={styles.redLine} />
              <Text style={[styles.menuTitle, { color: colors.text }]}>Tap to Edit Item</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {MENU_CATEGORIES.map(category => (
                <CategoryFilter 
                  key={category} 
                  category={category} 
                  isActive={activeCategory === category} 
                  onPress={() => setActiveCategory(category)} 
                />
              ))}
            </ScrollView>

            {/* THE GRID LAYOUT (Matches customer menu) */}
            <View style={[styles.gridContainer, { gap: GRID_GAP }]}>
              {filteredItems.map(item => (
                <View key={item.id} style={{ width: CARD_WIDTH }}>
                  <GridDishCard 
                    name={item.name} 
                    price={`₦${item.price.toLocaleString()}`}
                    image={typeof item.image === 'string' ? item.image : 'https://cdn-icons-png.flaticon.com/512/684/684045.png'}
                    isAvailable={item.isAvailable !== false} 
                    onPress={() => openEditor(item)} // Opens God Mode Editor!
                    isCompact={true}
                  />
                </View>
              ))}
            </View>

          </ScrollView>
        </View>
      </View>

      {/* GOD MODE EDITOR MODAL */}
      <Modal visible={isEditModalOpen} transparent={true} animationType="none" onRequestClose={closeEditor}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeEditor} />
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <Animated.View style={[styles.editorSheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] }]}>
              
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{editingItem ? 'Edit Item' : 'Create New Item'}</Text>
                <TouchableOpacity onPress={closeEditor} style={[styles.closeBtn, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editorScroll}>
                
                {/* Basic Info */}
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>ITEM NAME</Text>
                <TextInput style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} value={formName} onChangeText={setFormName} placeholder="e.g. Party Jollof" placeholderTextColor={colors.textMuted} />

                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>BASE PRICE (₦)</Text>
                    <TextInput style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" placeholder="2000" placeholderTextColor={colors.textMuted} />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniCatScroll}>
                      {MENU_CATEGORIES.filter(c => c !== 'All').map(cat => (
                        <TouchableOpacity 
                          key={cat} 
                          style={[styles.miniCatChip, { backgroundColor: formCategory === cat ? Colors.primary : colors.surface, borderColor: formCategory === cat ? Colors.primary : colors.border }]} 
                          onPress={() => setFormCategory(cat)}
                        >
                          <Text style={{ color: formCategory === cat ? '#FFF' : colors.text, fontSize: 12, fontWeight: 'bold' }}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>IMAGE URL</Text>
                <TextInput style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} value={formImage} onChangeText={setFormImage} placeholder="https://..." placeholderTextColor={colors.textMuted} />

                <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.toggleTitle, { color: colors.text }]}>Item Availability</Text>
                    <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Is this item currently in stock?</Text>
                  </View>
                  <Switch value={formIsAvailable} onValueChange={setFormIsAvailable} trackColor={{ false: '#D32F2F', true: '#81C784' }} thumbColor={formIsAvailable ? '#4CAF50' : '#f4f3f4'} />
                </View>

                {/* Variants Manager */}
                <View style={styles.variantSectionHeader}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted, marginBottom: 0 }]}>PORTION VARIANTS (OPTIONAL)</Text>
                  <TouchableOpacity onPress={addVariant}>
                    <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 14 }}>+ Add Portion</Text>
                  </TouchableOpacity>
                </View>

                {formVariants.map((variant, index) => (
                  <View key={index} style={[styles.variantEditRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9F9F9', borderColor: colors.border }]}>
                    <View style={styles.variantEditLeft}>
                      <TextInput 
                        style={[styles.variantInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} 
                        value={variant.label} 
                        onChangeText={(text) => updateVariant(index, 'label', text)} 
                        placeholder="Portion Name" 
                        placeholderTextColor={colors.textMuted} 
                      />
                    </View>
                    <View style={styles.variantEditRight}>
                      <Text style={{ color: colors.textMuted, fontWeight: 'bold', marginRight: 5 }}>₦</Text>
                      <TextInput 
                        style={[styles.variantInput, { flex: 1, color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} 
                        value={variant.price.toString()} 
                        onChangeText={(text) => updateVariant(index, 'price', text)} 
                        keyboardType="numeric" 
                      />
                      <TouchableOpacity onPress={() => removeVariant(index)} style={styles.variantTrash}>
                        <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {formVariants.length === 0 && (
                  <Text style={[styles.noVariantsText, { color: colors.textMuted }]}>No manual variants assigned. Item will sell at base price.</Text>
                )}

              </ScrollView>

              <View style={[styles.editorFooter, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} activeOpacity={0.8} onPress={saveItem}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  headerAddText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, marginLeft: 4 },
  
  // Responsive Wrapper Styles
  responsiveWrapper: { flex: 1, alignItems: 'center', width: '100%' },
  responsiveInner: { flex: 1, width: '100%', maxWidth: 800 },
  
  scrollContent: { paddingTop: 10 },
  titlesWrapper: { marginTop: 10, marginBottom: 15, paddingHorizontal: 20 },
  specialsText: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  mainTitle: { fontSize: 24, fontWeight: '900' },
  searchContainer: { marginBottom: 20, paddingHorizontal: 20 },
  
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
  redLine: { width: 4, height: 18, backgroundColor: Colors.primary, marginRight: 8, borderRadius: 2 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginRight: 5 },
  
  categoryScroll: { marginBottom: 20, paddingLeft: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%', maxHeight: '90%' },
  editorSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: -5 } },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  editorScroll: { padding: 20 },
  
  inputLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, marginBottom: 20 },
  rowInputs: { flexDirection: 'row', gap: 15 },
  halfInput: { flex: 1 },
  miniCatScroll: { flexDirection: 'row', marginBottom: 20 },
  miniCatChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 8, height: 35, justifyContent: 'center' },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 25 },
  toggleTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  toggleSub: { fontSize: 12 },

  variantSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  variantEditRow: { flexDirection: 'row', padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 10 },
  variantEditLeft: { flex: 2 },
  variantEditRight: { flex: 1.5, flexDirection: 'row', alignItems: 'center' },
  variantInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 14 },
  variantTrash: { padding: 5, marginLeft: 5 },
  noVariantsText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 10, marginBottom: 20 },

  editorFooter: { paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 16, borderRadius: 20, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});