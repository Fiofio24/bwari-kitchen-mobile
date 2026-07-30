import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Keyboard,
  Image,
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
import { useMenu } from '../context/MenuContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

const STORAGE_KEY = '@bwari_kitchen_recent_searches';

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

export default function SearchScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const { items, packages } = useMenu();
  
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? scale(50) : insets.top + scale(10);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const loadSearches = async () => {
      const savedData = await safeStorage.getItem(STORAGE_KEY);
      if (savedData !== null) setRecentSearches(JSON.parse(savedData)); 
    };
    loadSearches();
  }, []);

  const saveToDisk = async (newSearches: string[]) => {
    await safeStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
  };

  const handleAddSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setRecentSearches(prevSearches => {
      const filtered = prevSearches.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
      const updatedList = [searchTerm, ...filtered].slice(0, 10);
      saveToDisk(updatedList); 
      return updatedList;
    });
    Keyboard.dismiss();
  };

  const handleClearAll = async () => {
    setRecentSearches([]); 
    await safeStorage.removeItem(STORAGE_KEY);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { itemResults: [], packageResults: [] };

    const itemResults = items.filter(item => item.name.toLowerCase().includes(q));
    const packageResults = packages.filter(pkg => pkg.name.toLowerCase().includes(q));

    return { itemResults, packageResults };
  }, [query, items, packages]);

  const hasResults = results.itemResults.length > 0 || results.packageResults.length > 0;
  const isSearching = query.trim().length > 0;

  // Trending searches remain a static suggestion list for now — no analytics
  // backend exists yet to compute genuinely popular terms.
  const trendingSearches = ['Jollof Rice', 'Egusi Soup', 'Suya', 'Pounded Yam'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.primary }]} 
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={scale(24)} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.searchWrapper}>
          <SearchBar 
            autoFocus={true} 
            onSubmit={(text: string) => handleAddSearch(text)} 
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {isSearching ? (
          hasResults ? (
            <View style={styles.section}>
              {results.itemResults.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: scale(15) }]}>Menu Items</Text>
                  {results.itemResults.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.resultRow} 
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
                    >
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
                      ) : (
                        <View style={[styles.resultImage, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.resultTextWrap}>
                        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.resultPrice, { color: Colors.primary }]}>₦{item.basePrice.toLocaleString()}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {results.packageResults.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginTop: scale(20), marginBottom: scale(15) }]}>Packages</Text>
                  {results.packageResults.map((pkg) => (
                    <TouchableOpacity 
                      key={pkg.id} 
                      style={styles.resultRow} 
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/details', params: { id: pkg.id } })}
                    >
                      {pkg.imageUrl ? (
                        <Image source={{ uri: pkg.imageUrl }} style={styles.resultImage} />
                      ) : (
                        <View style={[styles.resultImage, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.resultTextWrap}>
                        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{pkg.name}</Text>
                        <Text style={[styles.resultPrice, { color: Colors.primary }]}>₦{pkg.totalPrice.toLocaleString()}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={scale(50)} color={colors.textMuted} style={{ opacity: 0.4 }} />
              <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                No results for &quot;{query}&quot;
              </Text>
            </View>
          )
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent Searches
                </Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity activeOpacity={0.7} onPress={handleClearAll}>
                    <Text style={[styles.clearText, { color: colors.primary }]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {recentSearches.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {recentSearches.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      activeOpacity={0.8} 
                      style={[styles.tag, { backgroundColor: isDark ? colors.border : '#EAEAEC' }]} 
                      onPress={() => handleAddSearch(item)}
                    >
                      <Ionicons name="time-outline" size={scale(14)} color={colors.textMuted} style={styles.tagIcon} />
                      <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No recent searches
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: scale(15) }]}>
                Others also searched
              </Text>
              {trendingSearches.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.trendingRow} 
                  activeOpacity={0.7} 
                  onPress={() => handleAddSearch(item)}
                >
                  <View style={[styles.trendingIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
                    <Ionicons name="trending-up" size={scale(18)} color={colors.primary} />
                  </View>
                  <Text style={[styles.trendingText, { color: colors.text }]}>{item}</Text>
                  <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingBottom: scale(20), zIndex: 10 },
  backButton: { width: scale(44), height: scale(44), borderRadius: scale(22), justifyContent: 'center', alignItems: 'center', marginRight: scale(15), elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.2, shadowRadius: scale(3) },
  searchWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: scale(20), paddingBottom: scale(40) },
  section: { marginBottom: scale(30) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(15) },
  sectionTitle: { fontSize: scale(18), fontWeight: 'bold' },
  clearText: { fontSize: scale(14), fontWeight: 'bold' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(10) },
  tag: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(8), paddingHorizontal: scale(15), borderRadius: scale(20) },
  tagIcon: { marginRight: scale(5) },
  tagText: { fontSize: scale(14), fontWeight: '500' },
  emptyText: { fontStyle: 'italic', marginTop: scale(5) },
  trendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(15) },
  trendingIconBox: { width: scale(40), height: scale(40), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  trendingText: { flex: 1, fontSize: scale(16), fontWeight: '500' },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(15) },
  resultImage: { width: scale(50), height: scale(50), borderRadius: scale(12), marginRight: scale(15) },
  resultTextWrap: { flex: 1 },
  resultName: { fontSize: scale(15), fontWeight: '600', marginBottom: scale(3) },
  resultPrice: { fontSize: scale(13), fontWeight: 'bold' },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', marginTop: scale(60) },
  noResultsText: { fontSize: scale(15), marginTop: scale(15), textAlign: 'center' },
});