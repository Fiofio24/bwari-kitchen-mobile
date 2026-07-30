import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeRouter } from '../hooks/useSafeRouter'; 
import { useUser } from '../context/UserContext'; 
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface GreetingProps {
  userName: string;
}

export default function GreetingSection({ userName }: GreetingProps) {
  const router = useSafeRouter(); 
  const { userData } = useUser(); 

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
          <Text style={styles.helloText}>Hello, {userData.name.split(' ')[0]}!</Text>
          <Text style={styles.subGreetingText}>What would you like for {currentMeal}?</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/menu')} activeOpacity={0.8}>
          <Ionicons name="restaurant" size={scale(16)} color="#000" />
          <Text style={styles.menuButtonText}>Menu</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingBackground: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    paddingTop: scale(30),
    marginBottom: scale(15),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  greetingRow: {
    marginTop: scale(70), 
    flexDirection: 'row',
    alignItems: 'center', 
  },
  chefImage: {
    width: scale(90), 
    height: scale(150),
    marginRight: scale(15), 
  },
  greetingTextContainer: {
    flex: 1, 
    paddingRight: scale(10),
  },
  helloText: {
    color: '#FFFFFF',
    fontSize: scale(20),
    fontWeight: 'bold',
  },
  subGreetingText: {
    color: '#FFCCCC',
    fontSize: scale(15),
    marginTop: scale(2),
    textTransform: 'capitalize', 
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(20),
  },
  menuButtonText: {
    marginLeft: scale(5),
    fontWeight: 'bold',
    fontSize: scale(14),
  },
});