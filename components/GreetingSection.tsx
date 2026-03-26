import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function GreetingSection() {
  return (
    <View style={styles.greetingBackground}>    
      <View style={styles.greetingRow}>        
        <View style={styles.greetingTextContainer}>
          <Text style={styles.helloText}>Hello, User!</Text>
          <Text style={styles.subGreetingText}>What would you like for breakfast</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="list" size={16} color="#000" />
          <Text style={styles.menuButtonText}>Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingBackground: {
    backgroundColor: Colors.primary,
    paddingTop: 142, 
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 120,
  },
  greetingTextContainer: {
    flex: 1,
    paddingRight: 20,
  },
  helloText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subGreetingText: {
    color: '#FFCCCC',
    fontSize: 15,
    marginTop: 2,
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  menuButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 14,
  },
});