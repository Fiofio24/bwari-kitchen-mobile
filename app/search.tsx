import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  // Consistent dynamic top padding across the app!
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;

  const recentSearches = ['Party Jollof', 'Grilled Turkey', 'Cold Zobo', 'Amala'];
  const trendingSearches = ['Spicy Pasta', 'Peppered Snail', 'Fried Rice combo', 'Yam & Egg sauce'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      
      {/* HEADER: Back Button + Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.searchWrapper}>
          <SearchBar autoFocus={true} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* RECENT SEARCHES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.clearText, { color: colors.primary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagsContainer}>
            {recentSearches.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                activeOpacity={0.8}
                style={[styles.tag, { backgroundColor: isDark ? colors.border : '#EAEAEC' }]}
              >
                <Ionicons name="time-outline" size={14} color={colors.textMuted} style={styles.tagIcon} />
                <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* OTHERS ALSO SEARCHED */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Others also searched</Text>
          
          {trendingSearches.map((item, index) => (
            <TouchableOpacity key={index} style={styles.trendingRow} activeOpacity={0.7}>
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

// Compact styling for the search page!
const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingBottom: 20, 
    zIndex: 10 
  },
  backButton: { 
    padding: 5, 
    marginRight: -10 
  },
  searchWrapper: { 
    flex: 1, 
    // marginTop: 0 
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  section: { 
    marginBottom: 30 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  clearText: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 10 
  },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20 
  },
  tagIcon: { 
    marginRight: 5 
  },
  tagText: { 
    fontSize: 14, 
    fontWeight: '500' 
  },
  trendingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  trendingIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  trendingText: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '500' 
  },
});