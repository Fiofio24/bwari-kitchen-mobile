import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = '@uplay_recent_searches';

// BULLETPROOF STORAGE WRAPPER
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
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const trendingSearches = ['Spicy Pasta', 'Peppered Snail', 'Fried Rice combo', 'Yam & Egg sauce'];

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.searchWrapper}>
          <SearchBar autoFocus={true} onSubmit={(text: string) => handleAddSearch(text)} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleClearAll}>
                <Text style={[styles.clearText, { color: colors.primary }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentSearches.length > 0 ? (
            <View style={styles.tagsContainer}>
              {recentSearches.map((item, index) => (
                <TouchableOpacity key={index} activeOpacity={0.8} style={[styles.tag, { backgroundColor: isDark ? colors.border : '#EAEAEC' }]} onPress={() => handleAddSearch(item)}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} style={styles.tagIcon} />
                  <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (<Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent searches</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Others also searched</Text>
          {trendingSearches.map((item, index) => (
            <TouchableOpacity key={index} style={styles.trendingRow} activeOpacity={0.7} onPress={() => handleAddSearch(item)}>
              <View style={[styles.trendingIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
                <Ionicons name="trending-up" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.trendingText, { color: colors.text }]}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, zIndex: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  searchWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  clearText: { fontSize: 14, fontWeight: 'bold' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  tagIcon: { marginRight: 5 },
  tagText: { fontSize: 14, fontWeight: '500' },
  emptyText: { fontStyle: 'italic', marginTop: 5 },
  trendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  trendingIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  trendingText: { flex: 1, fontSize: 16, fontWeight: '500' },
});