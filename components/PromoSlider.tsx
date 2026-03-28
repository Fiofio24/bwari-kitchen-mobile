import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ImageBackground, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors'; // <-- Now being used!
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Dummy data for the slides
const PROMO_DATA = [
  {
    id: '1',
    title: 'Special Rice',
    description: 'Get 10% off on your first full package order',
    price: '₦5,400',
    originalPrice: '₦6,000',
    discount: '10% OFF',
    image: { uri: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop' },
  },
  {
    id: '2',
    title: 'Spicy Pasta',
    description: 'Free delivery on orders above ₦10,000',
    price: '₦4,500',
    originalPrice: '₦5,000',
    discount: 'FREE DEL',
    image: { uri: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop' },
  },
  {
    id: '3',
    title: 'Weekend Combo',
    description: 'Perfect for you and your friends',
    price: '₦12,000',
    originalPrice: '₦15,000',
    discount: '20% OFF',
    image: { uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },
  },
];

export default function PromoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-slide logic
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= PROMO_DATA.length) {
        nextIndex = 0; // Loop back to the first slide
      }
      
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000); 

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Update dots when user manually swipes
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const getItemLayout = (data: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  const renderItem = ({ item }: { item: typeof PROMO_DATA[0] }) => (
    <View style={styles.slideContainer}>
      <ImageBackground source={item.image} style={styles.cardImage} imageStyle={styles.imageStyle}>
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        >
          {/* Discount Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.discount}</Text>
          </View>

          {/* Bottom Content Area */}
          <View style={styles.bottomContent}>
            
            <View style={styles.textColumn}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.price}>{item.price}</Text>
                <Text style={styles.originalPrice}> / {item.originalPrice}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.orderButton}>
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>

          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PROMO_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        snapToInterval={width} 
        decelerationRate="fast"
        getItemLayout={getItemLayout} 
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {PROMO_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20,
  },
  slideContainer: {
    width: width, 
    paddingHorizontal: 20, 
  },
  cardImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 20,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: Colors.primary, // <-- Replaced hardcoded hex
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20, 
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 15,
  },
  textColumn: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  description: {
    color: '#E0E0E0',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  originalPrice: {
    color: '#A0A0A0',
    fontSize: 14,
    textDecorationLine: 'line-through', 
  },
  orderButton: {
    backgroundColor: Colors.primary, // <-- Replaced hardcoded hex
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary, // <-- Replaced hardcoded hex
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inactiveDot: {
    backgroundColor: '#FFCCCC',
  },
});