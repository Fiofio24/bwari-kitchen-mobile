import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router'; // 1. Added the router!

interface GreetingProps {
  userName: string;
}

export default function GreetingSection({ userName }: GreetingProps) {
  const router = useRouter(); // 2. Initialized the router

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
          <Text style={styles.subGreetingText}>What would you like for {currentMeal}?</Text>
        </View>
        
        {/* 3. Added the onPress event to route to the menu! */}
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/menu')} activeOpacity={0.8}>
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
    marginBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greetingRow: {
    marginTop: 70, 
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
    textTransform: 'capitalize', 
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