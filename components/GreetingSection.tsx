import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// 1. Add Interface
interface GreetingProps {
  userName: string;
}

export default function GreetingSection({ userName }: GreetingProps) {
  return (
    <View style={styles.greetingBackground}>    
      <View style={styles.greetingRow}> 
        <Image 
          source={require('../assets/images/chef.png')} 
          style={styles.chefImage} 
          resizeMode="contain"
        />
        <View style={styles.greetingTextContainer}>
          {/* 2. Use the dynamic name */}
          <Text style={styles.helloText}>Hello, {userName}!</Text>
          <Text style={styles.subGreetingText}>What would you like for breakfast</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="restaurant" size={16} color="#000" />
          <Text style={styles.menuButtonText}>Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ... keep your exact same styles ...
const styles = StyleSheet.create({
  greetingBackground: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, },
  greetingRow: { marginTop: 120, flexDirection: 'row', alignItems: 'center', },
  chefImage: { width: 90, height: 150, marginRight: 15, },
  greetingTextContainer: { flex: 1, paddingRight: 10, },
  helloText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', },
  subGreetingText: { color: '#FFCCCC', fontSize: 15, marginTop: 2, },
  menuButton: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, },
  menuButtonText: { marginLeft: 5, fontWeight: 'bold', fontSize: 14, },
});