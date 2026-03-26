import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors } from '../../constants/Colors';
import TopNav from '../../components/TopNav';
import GreetingSection from '../../components/GreetingSection';
import SearchBar from '../../components/SearchBar';
import DishCard from '../../components/DishCard';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      
      {/* Sticky Top Navigation */}
      <TopNav />

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={require('../../assets/images/chef.png')} 
          style={styles.chefImage} 
        />

        <GreetingSection />
        <View style={styles.searchBar}>
          <SearchBar />
        </View>

        <View style={styles.bodyContainer}>
          <Text style={styles.sectionTitle}>| Breakfast For You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <DishCard name="Party Jollof" price="₦8,500" />
            <DishCard name="Semo & Egusi" price="₦7,000" />
            <DishCard name="Fried Rice" price="₦6,500" />
          </ScrollView>
        </View>
       

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bodyContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  chefImage: {
    position: 'absolute',
    top: 110,
    left: 15,
    right: 0,
    zIndex: 10,
    elevation: 8,
    width: 110,
    height: 190,
    shadowColor: '#000',
    shadowOffset: {
      width: 5,
      height: 8,
    },
    shadowOpacity: 0.2, 
  },
  searchBar: {
    width: '100%',
    paddingLeft: 120,
  }
});