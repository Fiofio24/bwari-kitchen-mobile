import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function SearchBar() {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
      <TextInput 
        placeholder="Search food" 
        placeholderTextColor={Colors.textMuted} 
        style={styles.searchInput} 
      />
      <View style={styles.filterButton}>
        <Ionicons name="options" size={20} color="#FFF" />
      </View>
    </View>
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
    backgroundColor: '#FFFFFF',
    height: 50,
    width: '100%',
    borderRadius: 25,
    paddingHorizontal: 40,
    fontSize: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    position: 'absolute',
    left: 35,
    zIndex: 1,
  },
  filterButton: {
    backgroundColor: Colors.primary,
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
  },
});