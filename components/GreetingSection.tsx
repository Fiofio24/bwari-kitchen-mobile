import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface GreetingProps {
  userName: string;
}

export default function GreetingSection({ userName }: GreetingProps) {
  
  // 1. Helper function to determine the meal based on the device's current time
  const getMealTime = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return 'breakfast';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'lunch';
    } else {
      return 'dinner';
    }
  };

  // 2. Store the result in a variable
  const currentMeal = getMealTime();

  return (
    <View style={styles.greetingBackground}>    
      <View style={styles.greetingRow}> 
        <Image 
          source={require('../assets/images/chef.png')} 
          style={styles.chefImage} 
          resizeMode="contain"
        />
        <View style={styles.greetingTextContainer}>
          <Text style={styles.helloText}>Hello, {userName}!</Text>
          {/* 3. Dynamically inject the meal time! */}
          <Text style={styles.subGreetingText}>What would you like for {currentMeal}?</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="restaurant" size={16} color="#000" />
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
    marginTop: 120, 
    flexDirection: 'row',
    alignItems: 'center', 
  },
  chefImage: {
    width: 90, 
    height: 150,
    marginRight: 15, 
  },
  greetingTextContainer: {
    flex: 1, 
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
    textTransform: 'capitalize', // <-- Bonus: This forces the first letter of breakfast/lunch/dinner to be uppercase if you want! Just remove it if you prefer lowercase.
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