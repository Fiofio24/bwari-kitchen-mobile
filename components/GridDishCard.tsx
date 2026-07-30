import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Platform,
  Animated,
  DeviceEventEmitter
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 
import { Colors } from '../constants/Colors';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface GridDishCardProps {
  name?: string;
  price: string;
  rating?: string;
  category?: string;
  image: string | any; 
  isRectangle?: boolean;
  isCompact?: boolean; 
  isFavorite?: boolean; 
  isSelected?: boolean; 
  isAvailable?: boolean; 
  onAdd?: () => void;
  onToggleFavorite?: () => void; 
  onPress?: () => void; 
}

export default function GridDishCard({ 
  name, 
  price, 
  rating, 
  category, 
  image, 
  isRectangle, 
  isCompact, 
  isFavorite, 
  isSelected,
  isAvailable = true, 
  onAdd, 
  onToggleFavorite,
  onPress
}: GridDishCardProps) {
  const { colors, isDark } = useTheme();

  const cardId = useRef(Math.random().toString()).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(false);
  
  const expandAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The Tap Bouncer to prevent double-tap routing
  const isTapLocked = useRef(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('HIDE_WARNING_BADGE', (emittedId) => {
      if (emittedId !== cardId && isExpandedRef.current) {
        isExpandedRef.current = false;
        setIsExpanded(false);
        Animated.timing(expandAnim, { 
          toValue: 0, 
          duration: 250, 
          useNativeDriver: false 
        }).start();
      }
    });
    return () => subscription.remove();
  }, [expandAnim, cardId]);

  const toggleExpand = () => {
    const newValue = !isExpanded;
    isExpandedRef.current = newValue;
    setIsExpanded(newValue);
    
    if (newValue) {
      DeviceEventEmitter.emit('HIDE_WARNING_BADGE', cardId);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isExpandedRef.current) {
          isExpandedRef.current = false;
          setIsExpanded(false);
          Animated.timing(expandAnim, { 
            toValue: 0, 
            duration: 250, 
            useNativeDriver: false 
          }).start();
        }
      }, 4000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    Animated.timing(expandAnim, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: false 
    }).start();
  };

  const badgeWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [scale(28), scale(140)] 
  });

  const shadowStyle = !isAvailable 
    ? Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
        web: { boxShadow: 'none' } as any 
      })
    : isDark 
      ? Platform.select({ 
          ios: { shadowOpacity: 0 }, 
          android: { elevation: 0 }, 
          web: { boxShadow: 'none' } as any 
        })
      : Platform.select({
          ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: scale(5), shadowOffset: { width: 0, height: scale(2) } },
          android: { elevation: 4, shadowColor: '#000' },
          web: { boxShadow: `0px ${scale(2)}px ${scale(5)}px rgba(0, 0, 0, 0.1)` } as any 
        });

  const handleCardPress = () => {
    if (onPress) {
      if (isTapLocked.current) return; 
      isTapLocked.current = true;
      setTimeout(() => { isTapLocked.current = false; }, 800); 
      onPress();
    } else if (!isAvailable && !isCompact) {
      toggleExpand();
    }
  };

  const handleAddPress = () => {
    if (!isAvailable) {
      if (!isCompact) toggleExpand();
    } else if (onAdd) {
      onAdd();
    }
  };

  // BACKEND PROTECTION: Sanitize bad data from the API
  let imageSource = typeof image === 'string' ? { uri: image } : image;
  if (typeof image === 'string') {
    const cleanImage = image.trim().toLowerCase();
    if (cleanImage === '' || cleanImage === 'null' || cleanImage === 'undefined' || !cleanImage.startsWith('http')) {
      imageSource = require('../assets/images/custom-plate.png');
    }
  }

  const CardContainer: any = (onPress || onAdd) ? TouchableOpacity : View;

  return (
    <CardContainer 
      style={[
        styles.cardContainer, 
        { 
          backgroundColor: colors.surface,
          borderColor: isSelected ? Colors.primary : 'transparent',
        }, 
        shadowStyle
      ]}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      <View 
        style={[
          styles.imagePlaceholder, 
          { aspectRatio: isRectangle ? 1.8 : (isCompact ? 1.35 : 1) }, 
          { backgroundColor: isDark ? colors.border : '#EAEAEC' }
        ]}
      >
        {/* THIS IS THE FIX: Applying the safe imageSource variable! */}
        <Image 
          source={imageSource} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover" 
        />
        
        {!isAvailable && !isCompact && (
          <Animated.View style={[styles.floatingBadge, { width: badgeWidth }]}>
            <TouchableOpacity style={styles.badgeContent} onPress={toggleExpand} activeOpacity={0.9}>
              <Ionicons name="alert" size={scale(16)} color="#FFF" style={styles.badgeIcon} />
              <Text style={styles.floatingBadgeText} numberOfLines={1}>Item sold out</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!isAvailable && isCompact && (
          <View style={[
            styles.soldOutOverlay, 
            { backgroundColor: isDark ? 'rgba(40, 40, 40, 0.7)' : 'rgba(255, 255, 255, 0.7)' }
          ]}>
            <Text style={[styles.soldOutText, { color: colors.text }]}>
              Sold Out
            </Text>
          </View>
        )}

        {onToggleFavorite && (
          <TouchableOpacity 
            style={styles.favoriteButton} 
            activeOpacity={0.8} 
            onPress={onToggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={scale(18)} 
              color={isFavorite ? Colors.primary : "#000"} 
            />
          </TouchableOpacity>
        )}

        {isSelected && isAvailable && (
          <View style={styles.gridOverlay}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={scale(14)} color="#000" />
            </View>
          </View>
        )}

      </View>

      <View style={[
        styles.contentContainer,
        !isAvailable && { opacity: 0.4 } 
      ]}>
        {!isCompact && (
          <View style={styles.titleRow}>
            <Text 
              style={[styles.dishName, { color: colors.text }]} 
              numberOfLines={2}
            >
              {name}
            </Text>
          </View>
        )}
        
        {((category && name) || isCompact) && (
          <View style={styles.titleRow}>
            <Text 
              style={[styles.subText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {category || name}
            </Text>

            {rating && (
              <View style={styles.ratingRow}>
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {rating}
                </Text>
                <Ionicons name="star" size={scale(14)} color={colors.star} />
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.priceRow, 
          (!category || !name) && !isCompact && { marginTop: scale(8) },
          isCompact && { marginTop: scale(2) } 
        ]}>
          <Text style={[styles.dishPrice, { color: colors.primary }]}>
            {price}
          </Text>
          
          {onAdd && (
            <TouchableOpacity 
              style={[
                styles.addButton, 
                { backgroundColor: isAvailable ? colors.primary : colors.border }
              ]} 
              activeOpacity={0.8} 
              onPress={handleAddPress}
            >
              <Ionicons name="add" size={scale(16)} color={isAvailable ? "#FFF" : colors.textMuted} />
              <Text style={[
                styles.addButtonText, 
                { color: isAvailable ? "#FFF" : colors.textMuted }
              ]}>
                Add
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  cardContainer: { 
    borderRadius: scale(15), 
    marginBottom: scale(15), 
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1, 
  },
  imagePlaceholder: { 
    width: '100%', 
    padding: scale(10), 
    alignItems: 'flex-end', 
    justifyContent: 'flex-start', 
    borderTopLeftRadius: scale(15), 
    borderTopRightRadius: scale(15), 
    overflow: 'hidden',
  },
  floatingBadge: { 
    position: 'absolute', 
    top: scale(8), 
    left: scale(8), 
    height: scale(28), 
    backgroundColor: '#D32F2F', 
    borderRadius: scale(14), 
    zIndex: 50, 
    overflow: 'hidden',
  },
  badgeContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: scale(28), 
    width: scale(140),
  },
  badgeIcon: { 
    width: scale(28), 
    textAlign: 'center',
  },
  floatingBadgeText: { 
    color: '#FFF', 
    fontSize: scale(11), 
    fontWeight: 'bold', 
    flex: 1,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  soldOutText: {
    fontWeight: 'bold',
    fontSize: scale(11),
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: scale(2),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { 
      width: 0, 
      height: scale(1) 
    },
    textShadowRadius: scale(4),
  },
  contentContainer: { 
    padding: scale(12), 
    paddingTop: scale(10),
  },
  favoriteButton: { 
    backgroundColor: '#ffffff95', 
    width: scale(28), 
    height: scale(28), 
    borderRadius: scale(14), 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2, 
    zIndex: 10,
  },
  gridOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 5,
  },
  checkCircle: { 
    width: scale(24), 
    height: scale(24), 
    borderRadius: scale(12), 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  dishName: { 
    fontWeight: 'bold', 
    fontSize: scale(15),
    flex: 1,
    paddingRight: scale(5),
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  ratingText: { 
    fontWeight: 'bold', 
    fontSize: scale(12), 
    marginRight: scale(2),
  },
  subText: { 
    fontSize: scale(12), 
    marginTop: scale(2), 
    marginBottom: scale(4),
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  dishPrice: { 
    fontWeight: 'bold', 
    fontSize: scale(16),
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: scale(4), 
    paddingHorizontal: scale(10), 
    borderRadius: scale(12),
  },
  addButtonText: { 
    fontWeight: 'bold', 
    fontSize: scale(12), 
    marginLeft: scale(2),
  },
});