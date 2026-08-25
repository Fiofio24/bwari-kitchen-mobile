import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface SearchBarProps {
  onPress?: () => void;
  autoFocus?: boolean;
  onSubmit?: (text: string) => void; 
  onChangeText?: (text: string) => void;
  value?: string; // FIX: Added value prop so parent screens can control the text
}

export default function SearchBar({ onPress, autoFocus, onSubmit, onChangeText, value }: SearchBarProps) {
  const { colors, isDark } = useTheme();
  
  const [searchText, setSearchText] = useState(value || '');

  // FIX: Sync internal text state with parent component's value
  useEffect(() => {
    if (value !== undefined) {
      setSearchText(value);
    }
  }, [value]);

  const handleClear = () => {
    setSearchText('');
    onChangeText?.('');
  };

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={styles.searchContainer} 
      activeOpacity={0.9} 
      onPress={onPress}
    >
      <Ionicons name="search" size={scale(20)} color={colors.textMuted} style={styles.searchIcon} />
      
      <TextInput 
        placeholder="Search food or categories..." 
        placeholderTextColor={colors.textMuted} 
        autoFocus={autoFocus}
        editable={!onPress} 
        pointerEvents={onPress ? "none" : "auto"}
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          onChangeText?.(text);
        }}
        returnKeyType="search" 
        onSubmitEditing={() => {
          if (onSubmit && searchText.trim().length > 0) {
            onSubmit(searchText);
          }
        }}
        style={[
          styles.searchInput, 
          { 
            backgroundColor: colors.surface,
            color: colors.text,
            ...Platform.select({
              ios: { shadowColor: isDark ? '#000' : '#ccc', shadowOpacity: 0.1, shadowRadius: scale(4), shadowOffset: { width: 0, height: scale(2) } },
              android: { elevation: 2 },
              web: { boxShadow: `0px ${scale(2)}px ${scale(4)}px rgba(0, 0, 0, 0.1)` } as any
            })
          }
        ]} 
      />

      {/* NEW: Clear Button (Only shows when typing and when it's an actual input box) */}
      {searchText.length > 0 && !onPress && (
        <TouchableOpacity 
          style={styles.clearIcon} 
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={scale(20)} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      
    </Container>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
  },
  searchInput: {
    flex: 1,
    height: scale(50),
    width: '100%',
    borderRadius: scale(25),
    paddingHorizontal: scale(40), // This padding already gives enough room for both left and right icons!
    fontSize: scale(15),
  },
  searchIcon: {
    position: 'absolute',
    left: scale(15),
    zIndex: 1,
  },
  clearIcon: {
    position: 'absolute',
    right: scale(15),
    zIndex: 2,
    padding: scale(2),
  },
  filterButton: {
    height: scale(50),
    width: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10),
    elevation: 2,
  },
});