import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function GreetingSection() {
  return (
    <View style={styles.greetingBackground}>    
      
      <View style={styles.greetingRow}> 
        
        {/* 1. Image is now a "normal" element in the flex row */}
        <Image 
          source={require('../assets/images/chef.png')} 
          style={styles.chefImage} 
          resizeMode="contain"
        />

        {/* 2. Greeting Text taking up the middle space */}
        <View style={styles.greetingTextContainer}>
          <Text style={styles.helloText}>Hello, User!</Text>
          <Text style={styles.subGreetingText}>What would you like for breakfast</Text>
        </View>
        
        {/* 3. Menu Button on the right */}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greetingRow: {
    marginTop: 120, // You can adjust this value depending on how much space your TopNav takes
    flexDirection: 'row',
    alignItems: 'center', // This is the magic line that vertically centers the Image, Text, and Button!
  },
  chefImage: {
    width: 90, // Scaled down slightly so it fits neatly inside the row without making the header too massive
    height: 150,
    marginRight: 15, // Pushes the text away from the image
  },
  greetingTextContainer: {
    flex: 1, // Ensures the text wraps nicely and pushes the Menu button to the edge
    paddingRight: 10,
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