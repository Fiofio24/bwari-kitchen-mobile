// Note: This file requires an Expo/React Native environment to compile correctly.
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Image,
  Easing,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface ItemVariantModalProps {
  item: any;
  visible: boolean;
  onClose: () => void;
  onAddVariant: (compositeKey: string) => void;
}

export default function ItemVariantModal({ item, visible, onClose, onAddVariant }: ItemVariantModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isRendering, setIsRendering] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  useEffect(() => {
    if (visible && item) {
      setIsRendering(true);
      setSelectedVariantIndex(0); // Reset selection
      
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 250, 
          useNativeDriver: true 
        }),
        Animated.spring(slideAnim, { 
          toValue: 0, 
          friction: 8, 
          tension: 65, 
          useNativeDriver: true 
        })
      ]).start();
    } else if (!visible && isRendering) {
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 0, 
          duration: 200, 
          useNativeDriver: true 
        }),
        Animated.timing(slideAnim, { 
          toValue: height, 
          duration: 250, 
          easing: Easing.in(Easing.ease),
          useNativeDriver: true 
        })
      ]).start(() => setIsRendering(false));
    }
  }, [visible, item, fadeAnim, slideAnim, isRendering]);

  if (!isRendering || !item) return null;

  const handleAdd = () => {
    const variant = item.variants[selectedVariantIndex];
    // We create a special key combining ID, Label, and Multiplier
    const compositeKey = `${item.id}::${variant.label}::${variant.multiplier}`;
    onAddVariant(compositeKey);
  };

  // Helper function to round up to the nearest 50
  // const roundUpToNearest50 = (price: number) => {
  //   if (price % 50 === 0) return price; // Already a multiple of 50
  //   return Math.ceil(price / 50) * 50;
  // };

  // Round Up Prices To Nearest 100
    const roundUpToNearest100 = (price: number) => {
      if (price % 100 === 0) return price; 
      return Math.ceil(price / 100) * 100;
    };

  return (
    <Modal 
      visible={isRendering} 
      transparent={true} 
      animationType="none" 
      onRequestClose={onClose} 
      statusBarTranslucent={true}
    >
      <View style={[StyleSheet.absoluteFill, styles.overlayContainer]}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.sheet, 
            { 
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <View style={styles.handleWrapper}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.itemHeader}>
            <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.itemImage} resizeMode="cover" />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.itemCat, { color: colors.textMuted }]}>{item.category}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SELECT PORTION</Text>

          <View style={[styles.variantsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {item.variants && item.variants.length > 0 ? (
              item.variants.map((variant: any, idx: number) => {
                let calculatedPrice = Math.round(item.price * variant.multiplier);
                
                // Smart rounding for clean restaurant prices (rounds up to the nearest 50)
                // calculatedPrice = roundUpToNearest50(calculatedPrice);
                calculatedPrice = roundUpToNearest100(calculatedPrice); // Final rounding to nearest 100 for extra polish

                const isSelected = selectedVariantIndex === idx;

                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.variantRow, idx !== item.variants.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedVariantIndex(idx)}
                  >
                    <View style={styles.variantLeft}>
                      <Text style={[styles.variantLabel, { color: colors.text }]}>{variant.label}</Text>
                      <Text style={[styles.variantPrice, { color: Colors.primary }]}>₦{calculatedPrice.toLocaleString()}</Text>
                    </View>
                    <Ionicons 
                      name={isSelected ? "radio-button-on" : "radio-button-off"} 
                      size={24} 
                      color={isSelected ? Colors.primary : colors.textMuted} 
                    />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.variantRow}>
                <Text style={[styles.variantLabel, { color: colors.text }]}>Default Portion</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: Colors.primary }]} 
            activeOpacity={0.8}
            onPress={handleAdd}
          >
            <Text style={styles.addBtnText}>Add Selection</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  overlayContainer: {
    zIndex: 2000,
    elevation: 2000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    elevation: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
  },
  handleWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 15,
    marginRight: 15,
    backgroundColor: '#EAEAEC',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCat: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  variantsContainer: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
    overflow: 'hidden',
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  variantLeft: {
    flex: 1,
  },
  variantLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});