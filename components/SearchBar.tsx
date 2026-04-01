import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 

interface SearchBarProps {
  onPress?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ onPress, autoFocus }: SearchBarProps) {
  const { colors, isDark } = useTheme();

  // If onPress is provided, we make the whole bar a button. Otherwise, it's a normal View.
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
        // If it's acting as a button, disable typing so the touch event registers!
        editable={!onPress} 
        pointerEvents={onPress ? "none" : "auto"}
        style={[
          styles.searchInput, 
          { 
            backgroundColor: colors.surface,
            color: colors.text,
            shadowColor: isDark ? '#000' : '#ccc' 
          }
        ]} 
      />
      
      <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="options" size={20} color="#FFF" />
      </TouchableOpacity>
    </Container>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    zIndex: 0,
  },
  searchInput: {
    flex: 1,
    height: 50,
    width: '100%',
    borderRadius: 25,
    paddingHorizontal: 40,
    fontSize: 15,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    position: 'absolute',
    left: 35,
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