import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 

interface SearchBarProps {
  onPress?: () => void;
  autoFocus?: boolean;
  onSubmit?: (text: string) => void; 
}

export default function SearchBar({ onPress, autoFocus, onSubmit }: SearchBarProps) {
  const { colors, isDark } = useTheme();
  
  const [searchText, setSearchText] = useState('');

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={styles.searchContainer} 
      activeOpacity={0.9} 
      onPress={onPress}
    >
      <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
      
      <TextInput 
        placeholder="Search food" 
        placeholderTextColor={colors.textMuted} 
        autoFocus={autoFocus}
        editable={!onPress} 
        pointerEvents={onPress ? "none" : "auto"}
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search" 
        onSubmitEditing={() => {
          if (onSubmit && searchText.trim().length > 0) {
            onSubmit(searchText);
            setSearchText(''); 
          }
        }}
        style={[
          styles.searchInput, 
          { 
            backgroundColor: colors.surface,
            color: colors.text,
            ...Platform.select({
              ios: { shadowColor: isDark ? '#000' : '#ccc', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
              android: { elevation: 2 },
              web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' } as any
            })
          }
        ]} 
      />
      
      {/* <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="options" size={20} color="#FFF" />
      </TouchableOpacity> */}
    </Container>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 20,
    zIndex: 0,
  },
  searchInput: {
    flex: 1,
    height: 50,
    width: '100%',
    borderRadius: 25,
    paddingHorizontal: 40,
    fontSize: 15,
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  filterButton: {
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
  },
});