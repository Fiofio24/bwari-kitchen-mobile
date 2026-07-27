import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  TouchableWithoutFeedback, 
  Animated, 
  Easing, 
  Keyboard, 
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { useAddresses } from '../context/AddressContext'; 

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AddressSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddressSelectorModal({ visible, onClose }: AddressSelectorModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { addresses, setDefaultAddress, addCurrentLocationAddress } = useAddresses();

  const [inputText, setInputText] = useState(''); 
  const [isRendering, setIsRendering] = useState(visible);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(500)).current; 

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      setInputText('');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.poly(4)), useNativeDriver: true })
      ]).start();
    } else if (!visible && isRendering) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 500, duration: 250, useNativeDriver: true })
      ]).start(() => setIsRendering(false));
    }
  }, [visible, fadeAnim, slideAnim, isRendering]);

  const handleSelectAddress = (id: string) => { 
    setDefaultAddress(id); 
    onClose(); 
  };

  const handleUseCurrentLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const result = await addCurrentLocationAddress({
        label: 'Current Location',
        streetAddress: inputText.trim() || 'My current location',
        isDefault: true,
      });
      if (result.success) {
        onClose();
      } else {
        Alert.alert('Location Error', result.error || 'Could not get your location.');
      }
    } finally {
      setIsCapturingLocation(false);
    }
  };
  
  const handleManageAddresses = () => { 
    onClose();
    setTimeout(() => {
      router.push('/saved-addresses'); 
    }, 300);
  };

  const getAddressLine = (item: typeof addresses[number]) =>
    [item.streetAddress, item.landmark, item.area].filter(Boolean).join(', ');

  const filteredAddresses = addresses.filter(item => 
    (item.label || '').toLowerCase().includes(inputText.toLowerCase()) || 
    getAddressLine(item).toLowerCase().includes(inputText.toLowerCase())
  );

  if (!isRendering) return null;

  return (
    <Modal 
      animationType="none" 
      transparent={true} 
      visible={isRendering} 
      onRequestClose={onClose} 
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <AnimatedBlurView 
          intensity={20} 
          tint="dark" 
          experimentalBlurMethod="dimezisBlurView" 
          style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.2)' }]} 
        />
      </TouchableWithoutFeedback>

      <View style={styles.modalContentWrapper} pointerEvents="box-none">
        <Animated.View 
          style={[
            styles.modalSheet, 
            { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Address</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput 
              style={[styles.input, { color: colors.text }]} 
              value={inputText} 
              onChangeText={setInputText} 
              placeholder="Search saved addresses..." 
              placeholderTextColor={colors.textMuted} 
              autoCorrect={false} 
            />
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            <TouchableOpacity style={styles.currentLocationBtn} onPress={handleUseCurrentLocation} activeOpacity={0.7} disabled={isCapturingLocation}>
              {isCapturingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="locate" size={22} color={Colors.primary} />
              )}
              <Text style={[styles.currentLocationText, { color: Colors.primary }]}>
                {isCapturingLocation ? 'Getting your location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
            
            {inputText.length === 0 && <Text style={[styles.savedTitle, { color: colors.textMuted }]}>Saved Addresses</Text>}
            
            {filteredAddresses.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.quickAddressRow, { borderBottomColor: colors.border }]} 
                onPress={() => handleSelectAddress(item.id)}
              >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(150,150,150,0.1)' }]}>
                  <Ionicons name={item.label?.toLowerCase() === 'home' ? 'home' : 'location'} size={20} color={colors.textMuted} />
                </View>
                <View style={styles.addressTextStack}>
                  <Text style={[styles.quickAddressTitle, { color: colors.text }]}>
                    {item.label || 'Address'} {item.isDefault && <Text style={{ color: Colors.primary, fontSize: 12 }}>(Default)</Text>}
                  </Text>
                  <Text style={[styles.quickAddressDetail, { color: colors.textMuted }]}>
                    {getAddressLine(item)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {inputText.length > 0 && filteredAddresses.length === 0 && (
              <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                No saved addresses match &quot;{inputText}&quot;.
              </Text>
            )}
          </ScrollView>
          
          <TouchableOpacity style={[styles.manageBtn, { borderTopColor: colors.border }]} onPress={handleManageAddresses} activeOpacity={0.7}>
            <Text style={[styles.manageBtnText, { color: colors.text }]}>Manage Addresses</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContentWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, height: 50, marginBottom: 15 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  currentLocationBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 20 },
  currentLocationText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  savedTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, letterSpacing: 0.5 },
  quickAddressRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addressTextStack: { marginLeft: 15, justifyContent: 'center', flex: 1 },
  quickAddressTitle: { fontSize: 16, fontWeight: 'bold' },
  quickAddressDetail: { fontSize: 12, marginTop: 2 },
  noResultsText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  manageBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, marginTop: 5, borderTopWidth: 1 },
  manageBtnText: { fontSize: 16, fontWeight: 'bold' },
});