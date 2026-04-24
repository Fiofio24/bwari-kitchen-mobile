// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve module resolution errors.
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

interface GridDishCardProps {
  name?: string;
  price: string;
  rating?: string;
  category?: string;
  image: string; 
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
    outputRange: [28, 140] 
  });

  // PRO UX FIX: Sold-out items have ZERO shadow to sink them into the background!
  const shadowStyle = !isAvailable 
    ? Platform.select({
        ios: { 
          shadowOpacity: 0 
        },
        android: { 
          elevation: 0 
        },
        web: { 
          boxShadow: 'none' 
        } as any 
      })
    : isDark 
      ? Platform.select({ 
          ios: { 
            shadowOpacity: 0 
          }, 
          android: { 
            elevation: 0 
          }, 
          web: { 
            boxShadow: 'none' 
          } as any 
        })
      : Platform.select({
          ios: { 
            shadowColor: '#000', 
            shadowOpacity: 0.1, 
            shadowRadius: 5, 
            shadowOffset: { 
              width: 0, 
              height: 2 
            } 
          },
          android: { 
            elevation: 4, 
            shadowColor: '#000' 
          },
          web: { 
            boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)' 
          } as any 
        });

  const handleCardPress = () => {
    if (onPress) {
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
        <Image 
          source={{ uri: image }} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover" 
        />
        
        {!isAvailable && !isCompact && (
          <Animated.View style={[styles.floatingBadge, { width: badgeWidth }]}>
            <TouchableOpacity style={styles.badgeContent} onPress={toggleExpand} activeOpacity={0.9}>
              <Ionicons name="alert" size={16} color="#FFF" style={styles.badgeIcon} />
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
              size={18} 
              color={isFavorite ? Colors.primary : "#000"} 
            />
          </TouchableOpacity>
        )}

        {isSelected && isAvailable && (
          <View style={styles.gridOverlay}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color="#000" />
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
              numberOfLines={1}
            >
              {category || name}
            </Text>
            
            {rating && (
              <View style={styles.ratingRow}>
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {rating}
                </Text>
                <Ionicons name="star" size={14} color={colors.star} />
              </View>
            )}
          </View>
        )}
        
        {((category && name) || isCompact) && (
          <Text 
            style={[styles.subText, { color: colors.textMuted }]} 
            numberOfLines={2}
          >
            {name}
          </Text>
        )}
        
        <View style={[
          styles.priceRow, 
          (!category || !name) && !isCompact && { marginTop: 8 },
          isCompact && { marginTop: 2 } 
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
              <Ionicons name="add" size={16} color={isAvailable ? "#FFF" : colors.textMuted} />
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
    borderRadius: 15, 
    marginBottom: 15, 
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1, 
  },
  imagePlaceholder: { 
    width: '100%', 
    padding: 10, 
    alignItems: 'flex-end', 
    justifyContent: 'flex-start', 
    borderTopLeftRadius: 15, 
    borderTopRightRadius: 15, 
    overflow: 'hidden',
  },
  floatingBadge: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    height: 28, 
    backgroundColor: '#D32F2F', 
    borderRadius: 14, 
    zIndex: 50, 
    overflow: 'hidden',
  },
  badgeContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 28, 
    width: 140,
  },
  badgeIcon: { 
    width: 28, 
    textAlign: 'center',
  },
  floatingBadgeText: { 
    color: '#FFF', 
    fontSize: 11, 
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
    fontSize: 11,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { 
      width: 0, 
      height: 1 
    },
    textShadowRadius: 4,
  },
  contentContainer: { 
    padding: 12, 
    paddingTop: 10,
  },
  favoriteButton: { 
    backgroundColor: '#ffffff95', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
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
    width: 24, 
    height: 24, 
    borderRadius: 12, 
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
    fontSize: 15,
    flex: 1,
    paddingRight: 5,
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  ratingText: { 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginRight: 2,
  },
  subText: { 
    fontSize: 12, 
    marginTop: 2, 
    marginBottom: 4,
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  dishPrice: { 
    fontWeight: 'bold', 
    fontSize: 16,
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 12,
  },
  addButtonText: { 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginLeft: 2,
  },
});