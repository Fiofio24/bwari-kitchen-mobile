import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import TopNav from '../../components/TopNav';
import GreetingSection from '../../components/GreetingSection';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import CategoryFilterActive from '../../components/CategoryFilterActive';
import GridDishCard from '../../components/GridDishCard';
import PromoSlider from '../../components/PromoSlider';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      
      {/* Sticky Top Navigation */}
      <TopNav />

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* --- Responsive Top Layout --- */}
        <View style={styles.topLayoutContainer}>
          
          <GreetingSection />

          {/* Full-Width Search Bar cleanly separated from the Greeting */}
          <View style={styles.searchBarWrapper}>
            <SearchBar />
          </View>

        </View>

        <PromoSlider />

        {/* Horizontal Breakfast Row */}
        <View style={styles.bodyContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>| Breakfast For You</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft: 20,}} >
            <View style={styles.grid1}>
              <GridDishCard category="Rice" name="Party Jollof" price="₦2,000" rating="5.0" />
            </View>
            <View style={styles.grid1}>
              <GridDishCard category="Rice" name="Party Jollof" price="₦2,000" rating="5.0" />
            </View>
            <View style={styles.grid1}>
              <GridDishCard category="Rice" name="Party Jollof" price="₦2,000" rating="5.0" />
            </View>
            <View style={styles.grid1}>
              <GridDishCard category="Rice" name="Party Jollof" price="₦2,000" rating="5.0" />
            </View>
          </ScrollView>
        </View>

        {/* Category Pills */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>| Others</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
          <CategoryFilterActive category='All' />
          <CategoryFilter category='Rice' />
          <CategoryFilter category='Swallow' />
          <CategoryFilter category='Drink' />
          <CategoryFilter category='Protein' />
        </ScrollView>

        {/* 2-Column Grid Row */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            <GridDishCard category="Rice" name="Party Jollof" price="₦2,000" rating="5.0" />
          </View>
          <View style={styles.grid}>
            <GridDishCard category="Swallow" name="Semo" price="₦1,000" rating="4.5" />
          </View>
          <View style={styles.grid}>
          <GridDishCard category="Rice" name="Special Rice" price="₦3,000" rating="4.5" />
          </View>
          <View style={styles.grid}>
          <GridDishCard category="Drink" name="Coca Cola" price="₦500" rating="3.0" />
          </View>  
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
  topLayoutContainer: {
    marginBottom: 20,
    zIndex: 5,
  },
  searchBarWrapper: {
    paddingHorizontal: 10,
    marginTop: 10, 
    zIndex: 1,
  },
  bodyContainer: {
    // paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    // paddingHorizontal: 20,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 25,
  },
  seeMoreText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContainer: {
    flexDirection: 'row',
    marginHorizontal: 25,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 15, 
  },
  grid: {
    width: '48.5%',
  },
  grid1: {
    width: 300,
    marginRight: 15, 
  }
});