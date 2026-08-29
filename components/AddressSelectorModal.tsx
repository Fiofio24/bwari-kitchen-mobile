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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import MapView, { Region } from 'react-native-maps'; // <-- MAP IMPORT
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { useAddresses } from '../context/AddressContext'; 
import { scale } from '../constants/Sizes'; 

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AddressSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

// SMART ICON IDENTIFIER
const getIconForLabel = (label?: string | null): any => {
  const text = (label || '').toLowerCase();
  if (text.includes('home')) return 'home';
  if (text.includes('work') || text.includes('office')) return 'briefcase';
  if (text.includes('school') || text.includes('college') || text.includes('university') || text.includes('campus')) return 'school';
  if (text.includes('gym') || text.includes('fitness')) return 'barbell';
  if (text.includes('friend') || text.includes('family') || text.includes('parent')) return 'people';
  if (text.includes('hotel') || text.includes('lodge')) return 'bed';
  return 'location';
};

export default function AddressSelectorModal({ visible, onClose }: AddressSelectorModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { addresses, activeAddress, setActiveAddress, addCurrentLocationAddress } = useAddresses();
  
  const [inputText, setInputText] = useState(''); 
  const [isRendering, setIsRendering] = useState(visible);
  
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const [isWaitingToSelect, setIsWaitingToSelect] = useState(false);
  const prevAddressIds = useRef(new Set(addresses.map(a => a.id)));
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // MAP STATES
  const [isMapMode, setIsMapMode] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isConfirmingMap, setIsConfirmingMap] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(scale(500))).current; 

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      setInputText('');
      
      setIsWaitingToSelect(false);
      setIsCapturingLocation(false);
      setIsSavingAddress(false);
      setIsMapMode(false);
      prevAddressIds.current = new Set(addresses.map(a => a.id));
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.poly(4)), useNativeDriver: true })
      ]).start();
    } else if (!visible && isRendering) {
      Keyboard.dismiss();
      
      setIsCapturingLocation(false);
      setIsSavingAddress(false);
      setIsWaitingToSelect(false);
      setIsConfirmingMap(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: scale(500), duration: 250, useNativeDriver: true })
      ]).start(() => setIsRendering(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, fadeAnim, slideAnim, isRendering]); 

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isWaitingToSelect) {
      const currentIds = addresses.map(a => a.id);
      const newId = currentIds.find(id => !prevAddressIds.current.has(id));

      if (newId) {
        setActiveAddress(newId);
        setIsWaitingToSelect(false);
        setTimeout(() => {
          onClose();
        }, 350);
      } else {
        timeout = setTimeout(() => {
          setIsWaitingToSelect(false);
          onClose(); 
        }, 3000);
      }
    }
    
    prevAddressIds.current = new Set(addresses.map(a => a.id));
    
    return () => clearTimeout(timeout);
  }, [addresses, isWaitingToSelect, onClose, setActiveAddress]);

  const handleSelectAddress = (id: string) => { 
    setActiveAddress(id); 
    setTimeout(() => {
      onClose(); 
    }, 350);
  };

  // OPENS THE MAP
  const handleGetLocation = async () => {
    if (isMapMode) {
      setIsMapMode(false); 
      return;
    }

    setIsCapturingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location access in your device settings.');
        setIsCapturingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setIsMapMode(true);
    } catch (err) {
      console.warn("Location fetch error:", err);
      Alert.alert('Location Error', 'Could not fetch your precise location.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  // CONFIRMS PIN AND GETS ADDRESS
  const handleConfirmMapLocation = async () => {
    if (!mapRegion) return;
    setIsConfirmingMap(true);

    try {
      let geocode = await Location.reverseGeocodeAsync({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        
        const name = place.name;
        const street = place.street;
        let localArea = '';

        if (name && street && name !== street) {
          localArea = `${name}, ${street}`; 
        } else {
          localArea = name || street || '';
        }

        const cityOrDistrict = place.city || place.district;
        const addressString = [localArea, cityOrDistrict, place.region].filter(Boolean).join(', ');
        
        setInputText(addressString); 
      } else {
        setInputText('Unknown Location');
      }
      setIsMapMode(false); 
    } catch (error) {
      console.warn("Geocode error:", error);
      Alert.alert('Location Error', 'Could not translate this pin into an address.');
    } finally {
      setIsConfirmingMap(false);
    }
  };

  const handleSaveAndUse = async () => {
    const rawText = inputText.trim() || 'My current location';
    setIsSavingAddress(true); 
    
    try {
      const parts = rawText.split(',').map(p => p.trim());
      
      let parsedStreet = rawText;
      let parsedArea = undefined;

      if (parts.length > 1) {
        parsedStreet = parts[0]; 
        parsedArea = parts.slice(1).join(', '); 
      }

      const result: any = await addCurrentLocationAddress({
        label: 'Current Location',
        streetAddress: parsedStreet,
        area: parsedArea,
      });
      
      if (result.success) {
        const newAddressId = result.id || result.address?.id || result.data?.id;
        
        if (newAddressId) {
          setActiveAddress(newAddressId);
          setTimeout(() => {
            onClose();
          }, 350);
        } else {
          setIsWaitingToSelect(true);
        }
      } else {
        Alert.alert('Location Error', result.error || 'Could not save your location.');
      }
    } catch (err) {
      console.warn("Save Error:", err);
    } finally {
      setIsSavingAddress(false); 
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
            { 
              backgroundColor: colors.background, 
              paddingBottom: Math.max(insets.bottom, scale(20)) + keyboardHeight, 
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delivery Address</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={scale(28)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={scale(20)} color={colors.textMuted} />
            <TextInput 
              style={[styles.input, { color: colors.text }]} 
              value={inputText} 
              onChangeText={setInputText} 
              placeholder="Search or enter new address..." 
              placeholderTextColor={colors.textMuted} 
              autoCorrect={false} 
            />
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.locationBtn]} 
              onPress={handleGetLocation} 
              activeOpacity={0.7} 
              disabled={isCapturingLocation || isWaitingToSelect}
            >
              {isCapturingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name={isMapMode ? "close" : "locate"} size={scale(20)} color={Colors.primary} />
              )}
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
                {isMapMode ? "Cancel Map" : "Get Location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.saveBtn, { opacity: inputText.trim().length > 0 ? 1 : 0.5 }]} 
              onPress={handleSaveAndUse} 
              activeOpacity={0.7} 
              disabled={inputText.trim().length === 0 || isSavingAddress || isWaitingToSelect || isMapMode}
            >
              {isSavingAddress || isWaitingToSelect ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save & Use</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {isMapMode && mapRegion ? (
            <View style={styles.mapContainer}>
              <MapView 
                style={styles.mapView}
                initialRegion={mapRegion}
                onRegionChangeComplete={(region) => setMapRegion(region)}
                showsUserLocation={true}
                userInterfaceStyle={isDark ? "dark" : "light"}
              />
              
              <View style={styles.mapCenterPin} pointerEvents="none">
                <Ionicons name="location" size={scale(40)} color={Colors.primary} />
                <View style={styles.pinShadow} />
              </View>

              <View style={styles.mapInstructions}>
                <Text style={[styles.mapInstructionText, { color: colors.text }]}>Drag map to adjust pin</Text>
              </View>

              <TouchableOpacity 
                style={[styles.confirmMapBtn, { backgroundColor: Colors.primary }]}
                onPress={handleConfirmMapLocation}
                disabled={isConfirmingMap}
              >
                {isConfirmingMap ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.confirmMapBtnText}>Confirm this location</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: scale(400) }}
            >
              {inputText.length === 0 && <Text style={[styles.savedTitle, { color: colors.textMuted }]}>Saved Addresses</Text>}
              
              {filteredAddresses.map((item) => {
                const isActive = activeAddress != null && String(activeAddress.id) === String(item.id);
                
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.quickAddressRow, 
                      { 
                        borderBottomColor: colors.border,
                        backgroundColor: isActive ? 'rgba(211, 47, 47, 0.05)' : 'transparent', 
                        paddingHorizontal: isActive ? scale(10) : 0, 
                        borderRadius: isActive ? scale(12) : 0,
                      }
                    ]} 
                    onPress={() => handleSelectAddress(item.id)}
                  >
                    <View style={[styles.iconBox, { backgroundColor: isActive ? 'rgba(211, 47, 47, 0.1)' : 'rgba(150,150,150,0.1)' }]}>
                      <Ionicons 
                        name={getIconForLabel(item.label)} 
                        size={scale(20)} 
                        color={isActive ? Colors.primary : colors.textMuted} 
                      />
                    </View>
                    
                    <View style={styles.addressTextStack}>
                      <Text style={[styles.quickAddressTitle, { color: isActive ? Colors.primary : colors.text }]}>
                        {item.label || 'Address'} {item.isDefault && <Text style={{ color: Colors.primary, fontSize: scale(12) }}>(Default)</Text>}
                      </Text>
                      <Text style={[styles.quickAddressDetail, { color: colors.textMuted }]}>
                        {getAddressLine(item)}
                      </Text>
                    </View>
                    
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={scale(24)} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {inputText.length > 0 && filteredAddresses.length === 0 && (
                <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                  No saved addresses match &rdquo;{inputText}&rdquo;. Hit &rdquo;Save & Use&rdquo; to add it!
                </Text>
              )}
            </ScrollView>
          )}
          
          {!isMapMode && (
            <TouchableOpacity style={[styles.manageBtn, { borderTopColor: colors.border }]} onPress={handleManageAddresses} activeOpacity={0.7}>
              <Text style={[styles.manageBtnText, { color: colors.text }]}>Manage Addresses</Text>
              <Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContentWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: scale(30), borderTopRightRadius: scale(30), paddingHorizontal: scale(20), paddingTop: scale(25) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(20) },
  modalTitle: { fontSize: scale(20), fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: scale(15), paddingHorizontal: scale(15), height: scale(50), marginBottom: scale(15) },
  input: { flex: 1, marginLeft: scale(10), fontSize: scale(16) },
  
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(20), gap: scale(10) },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: scale(45), borderRadius: scale(12) },
  locationBtn: { backgroundColor: 'rgba(229, 57, 53, 0.1)' },
  saveBtn: { backgroundColor: Colors.primary },
  actionBtnText: { fontSize: scale(14), fontWeight: 'bold', marginLeft: scale(8) },
  saveBtnText: { color: '#FFF', fontSize: scale(14), fontWeight: 'bold' },

  // MAP STYLES
  mapContainer: { height: scale(350), borderRadius: scale(15), overflow: 'hidden', marginBottom: scale(20), backgroundColor: '#EFEFEF' },
  mapView: { flex: 1 },
  mapCenterPin: { position: 'absolute', top: '50%', left: '50%', marginTop: -scale(35), marginLeft: -scale(20), alignItems: 'center' },
  pinShadow: { width: scale(10), height: scale(4), backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: scale(5), marginTop: -scale(6) },
  mapInstructions: { position: 'absolute', top: scale(15), alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: scale(15), paddingVertical: scale(8), borderRadius: scale(20), elevation: 3 },
  mapInstructionText: { fontSize: scale(12), fontWeight: 'bold' },
  confirmMapBtn: { position: 'absolute', bottom: scale(15), left: scale(15), right: scale(15), height: scale(50), borderRadius: scale(25), justifyContent: 'center', alignItems: 'center', elevation: 4 },
  confirmMapBtnText: { color: '#FFF', fontSize: scale(16), fontWeight: 'bold' },

  savedTitle: { fontSize: scale(14), fontWeight: 'bold', marginBottom: scale(5), letterSpacing: 0.5 },
  quickAddressRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(12), borderBottomWidth: 1 },
  iconBox: { width: scale(36), height: scale(36), borderRadius: scale(18), justifyContent: 'center', alignItems: 'center' },
  addressTextStack: { marginLeft: scale(15), justifyContent: 'center', flex: 1 },
  quickAddressTitle: { fontSize: scale(16), fontWeight: 'bold' },
  quickAddressDetail: { fontSize: scale(12), marginTop: scale(2) },
  noResultsText: { textAlign: 'center', marginTop: scale(20), marginBottom: scale(10), fontStyle: 'italic', paddingHorizontal: scale(10) },
  manageBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: scale(20), marginTop: scale(5), borderTopWidth: 1 },
  manageBtnText: { fontSize: scale(16), fontWeight: 'bold' },
});