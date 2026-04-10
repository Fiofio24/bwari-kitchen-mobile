import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
// 1. Import the physical storage engine!
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// A constant key so we don't misspell our database name
const STORAGE_KEY = '@uplay_recent_searches';

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const trendingSearches = ['Spicy Pasta', 'Peppered Snail', 'Fried Rice combo', 'Yam & Egg sauce'];

  // 2. LOAD ON STARTUP: When the screen opens, fetch the saved list from the phone
  useEffect(() => {
    const loadSearches = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData !== null) {
          // Convert the text string back into a JavaScript array
          setRecentSearches(JSON.parse(savedData)); 
        }
      } catch (error) {
        console.error("Failed to load searches from storage", error);
      }
    };
    
    loadSearches();
  }, []);

  // Helper function to save to the phone's hard drive
  const saveToDisk = async (newSearches: string[]) => {
    try {
      // Convert the array into a text string and save it
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
    } catch (error) {
      console.error("Failed to save searches to storage", error);
    }
  };

  const handleAddSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setRecentSearches(prevSearches => {
      const filtered = prevSearches.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
      const updatedList = [searchTerm, ...filtered].slice(0, 10);
      
      // 3. SAVE ON ADD: Instantly write the new list to the hard drive!
      saveToDisk(updatedList); 
      
      return updatedList;
    });
    
    Keyboard.dismiss();
  };

  const handleClearAll = async () => {
    // Clear the visual UI
    setRecentSearches([]); 
    try {
      // 4. DELETE FROM DISK: Completely erase the record from the phone
      await AsyncStorage.removeItem(STORAGE_KEY); 
    } catch (error) {
      console.error("Failed to clear storage", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      
      {/* Dynamically change the status bar ONLY for this screen! */}
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.searchWrapper}>
          <SearchBar 
            autoFocus={true} 
            onSubmit={(text: string) => handleAddSearch(text)} 
          />
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
                <TouchableOpacity 
                  key={index} 
                  activeOpacity={0.8}
                  style={[styles.tag, { backgroundColor: isDark ? colors.border : '#EAEAEC' }]}
                  onPress={() => handleAddSearch(item)}
                >
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} style={styles.tagIcon} />
                  <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent searches</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Others also searched</Text>
          
          {trendingSearches.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.trendingRow} 
              activeOpacity={0.7}
              onPress={() => handleAddSearch(item)}
            >
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 20, zIndex: 10 },
  backButton: { padding: 5, marginRight: -10 },
  searchWrapper: { flex: 1, },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  clearText: { fontSize: 14, fontWeight: 'bold' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  tagIcon: { marginRight: 5 },
  tagText: { fontSize: 14, fontWeight: '500' },
  emptyText: { fontStyle: 'italic', marginTop: 5, },
  trendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  trendingIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  trendingText: { flex: 1, fontSize: 16, fontWeight: '500' },
});