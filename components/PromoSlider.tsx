import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext'; 
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

const { width } = Dimensions.get('window');

const PROMO_DATA = [
  { id: '3', title: 'Weekend Combo', description: 'Perfect for you and your friends', price: '₦12,000', originalPrice: '₦15,000', discount: '20% OFF', image: { uri: 'https://i.pinimg.com/736x/b6/34/81/b6348151e6180cfedf53bc08b5b21cc1.jpg' } },
  { id: '4', title: 'Family Feast', description: 'Enjoy a hearty meal with your family', price: '₦18,000', originalPrice: '₦22,000', discount: '15% OFF', image: { uri: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800&auto=format&fit=crop' } },
  { id: '5', title: 'Occasion for 200 guests', description: 'Perfect for your special event', price: '₦1,600,000', originalPrice: '₦2,000,000', discount: '20% OFF', buttonText: 'Book Now', image: { uri: 'https://i.pinimg.com/1200x/d2/2f/84/d22f84c03f838638f32ba66c2b632ef8.jpg' } },
  { id: '7', title: 'Cake Delight', description: 'Sweet treats for your sweet tooth', price: '₦2,500', originalPrice: '₦3,000', discount: 'NEW Recipe', buttonText: 'Add to Package', image: { uri: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop' } },
  { id: '10', title: 'Valentine\'s Special', description: 'Celebrate love with our special menu', price: '₦40,000', originalPrice: '₦50,000', discount: '20% OFF', image: { uri: 'https://images.unsplash.com/photo-1556911073-52527ac437f5?q=80&w=800&auto=format&fit=crop' } },
  { id: '12', title: 'Biryani Rice', description: 'Aromatic and flavorful biryani rice', price: '₦3,000', originalPrice: '₦3,500', discount: 'NEW Recipe', buttonText: 'Add to Package', image: { uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop' } },
];

export default function PromoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  const { colors, isDark } = useTheme(); 

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= PROMO_DATA.length) nextIndex = 0; 
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000); 
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const getItemLayout = (data: any, index: number) => ({ length: width, offset: width * index, index });

  const renderItem = ({ item }: { item: typeof PROMO_DATA[0] }) => (
    <View style={styles.slideContainer}>
      <ImageBackground source={item.image} style={styles.cardImage} imageStyle={styles.imageStyle}>
        
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay}>
          
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.discount}</Text>
          </View>

          <View style={styles.bottomContent}>
            <View style={styles.textColumn}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{item.price}</Text>
                <Text style={styles.originalPrice}> / {item.originalPrice}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.orderButton, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
              <Text style={styles.orderButtonText}>{item.buttonText || 'Order Now'}</Text>
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

      <View style={styles.paginationContainer}>
        {PROMO_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index 
                ? [styles.activeDot, { backgroundColor: colors.primary }] 
                : [styles.inactiveDot, { backgroundColor: isDark ? colors.border : '#FFCCCC' }],
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: scale(10), marginBottom: scale(20) },
  slideContainer: { width: width, paddingHorizontal: scale(20) }, // Kept width exact for paging
  cardImage: { width: '100%', height: scale(200), justifyContent: 'flex-end' },
  imageStyle: { borderRadius: scale(20) },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: scale(20), justifyContent: 'space-between' },
  badge: { paddingVertical: scale(6), paddingHorizontal: scale(15), borderTopLeftRadius: scale(20), borderBottomRightRadius: scale(20), alignSelf: 'flex-start' },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: scale(12) },
  bottomContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: scale(15) },
  textColumn: { flex: 1, paddingRight: scale(10) },
  title: { color: '#FFF', fontSize: scale(22), fontWeight: 'bold' },
  description: { color: '#E0E0E0', fontSize: scale(12), marginTop: scale(2), marginBottom: scale(5) },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { color: '#FFF', fontSize: scale(18), fontWeight: 'bold' },
  originalPrice: { color: '#A0A0A0', fontSize: scale(14), textDecorationLine: 'line-through' },
  orderButton: { paddingVertical: scale(10), paddingHorizontal: scale(20), borderRadius: scale(25) },
  orderButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: scale(14) },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: scale(15) },
  dot: { width: scale(6), height: scale(6), borderRadius: scale(3), marginHorizontal: scale(4) },
  activeDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
  inactiveDot: {},
});