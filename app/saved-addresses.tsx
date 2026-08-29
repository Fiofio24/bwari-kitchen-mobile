import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  LayoutAnimation,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import MapView, { Region } from 'react-native-maps'; // <-- MAP IMPORT
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useAddresses, Address } from '../context/AddressContext'; 
import TopNav from '../components/TopNav';
import { scale } from '../constants/Sizes'; 
import HomeIcon from '../components/HomeIcon';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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

export default function SavedAddressesScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { addresses, loading, removeAddress, setDefaultAddress, addCurrentLocationAddress, updateAddress } = useAddresses();

  const [modalVisible, setModalVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false); 
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // NEW MAP STATES
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
    if (modalVisible) {
      setIsRendering(true);
      setIsMapMode(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.poly(4)), useNativeDriver: true })
      ]).start();
    } else if (!modalVisible && isRendering) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: scale(500), duration: 250, useNativeDriver: true })
      ]).start(() => setIsRendering(false));
    }
  }, [modalVisible, fadeAnim, slideAnim, isRendering]);

  const handleSetDefault = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDefaultAddress(id);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to remove "${title}" from your saved addresses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            removeAddress(id);
          } 
        }
      ]
    );
  };

  const openAddModal = () => {
    setEditingId(null);
    setLabel('');
    setStreetAddress('');
    setLandmark('');
    setArea('');
    setModalVisible(true);
  };

  const openEditModal = (item: Address) => {
    setEditingId(item.id);
    setLabel(item.label || '');
    setStreetAddress(item.streetAddress);
    setLandmark(item.landmark || '');
    setArea(item.area || '');
    setModalVisible(true);
  };

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
    } catch (error) {
      Alert.alert('Location Error', 'Could not fetch your precise location.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  // CONFIRM PIN AND AUTO-FILL
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
        
        if (place.name && place.street && place.name !== place.street) {
          setLandmark(place.name); 
          setStreetAddress(place.street); 
        } else {
          setStreetAddress(place.name || place.street || '');
        }

        const cityOrDistrict = place.city || place.district;
        const foundArea = [cityOrDistrict, place.region].filter(Boolean).join(', ');
        
        if (foundArea) setArea(foundArea);
      } else {
        Alert.alert('Location Info', 'Coordinates fetched, but could not determine street name.');
      }
      setIsMapMode(false);
    } catch (error) {
      console.warn("Geocode error:", error);
      Alert.alert('Location Error', 'Could not translate this pin into an address.');
    } finally {
      setIsConfirmingMap(false);
    }
  };

  const handleSave = async () => {
    if (!streetAddress.trim()) {
      Alert.alert('Missing info', 'Please enter a street address.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateAddress(editingId, {
          label: label || undefined,
          streetAddress,
          landmark: landmark || undefined,
          area: area || undefined,
        });
        setModalVisible(false);
      } else {
        const result = await addCurrentLocationAddress({
          label: label || undefined,
          streetAddress,
          landmark: landmark || undefined,
          area: area || undefined,
        });
        if (result.success) {
          setModalVisible(false);
        } else {
          Alert.alert('Location Error', result.error || 'Could not save this address.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong saving this address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Saved Addresses"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <View style={styles.headerRight}>
            <HomeIcon onPress={() => router.push('/(tabs)')} />
          </View>
        }
        isAbsolute={false}
        isScrolled={true} 
        showDivider={false} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(100) }]}>
        
        <View style={styles.headerSection}>
          <Text style={[styles.titleText, { color: colors.text }]}>
            Delivery Locations
          </Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>
            Manage your saved addresses for quick and easy checkout.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: scale(40) }} />
        ) : addresses.length > 0 ? (
          addresses.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.addressCard, 
                { backgroundColor: colors.surface, borderColor: item.isDefault ? Colors.primary : colors.border },
                item.isDefault && styles.defaultCardShadow
              ]}
              activeOpacity={0.8}
              onPress={() => handleSetDefault(item.id)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[
                    styles.iconBox, 
                    { backgroundColor: item.isDefault ? 'rgba(211, 47, 47, 0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5') }
                  ]}>
                    <Ionicons 
                      name={getIconForLabel(item.label)} 
                      size={scale(20)} 
                      color={item.isDefault ? Colors.primary : colors.textMuted} 
                    />
                  </View>
                  <Text style={[styles.addressTitle, { color: colors.text }]}>
                    {item.label || 'Address'}
                  </Text>
                </View>
                
                {item.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.addressText, { color: colors.textMuted }]}>
                {[item.streetAddress, item.landmark, item.area].filter(Boolean).join(', ')}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={scale(18)} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleDelete(item.id, item.label || 'this address')}
                >
                  <Ionicons name="trash-outline" size={scale(18)} color="#D32F2F" />
                  <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={scale(60)} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Addresses Saved
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Add a delivery location to make ordering faster.
            </Text>
          </View>
        )}

      </ScrollView>

      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: insets.bottom + scale(20), 
          backgroundColor: isDark ? colors.surface : '#FFF', 
          borderTopColor: colors.border 
        }
      ]}>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: Colors.primary }]} 
          activeOpacity={0.8}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={scale(20)} color="#FFF" style={{ marginRight: scale(8) }} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      {isRendering && (
        <Modal transparent animationType="none" onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setModalVisible(false); }}>
              <AnimatedBlurView 
                intensity={20} 
                tint="dark" 
                experimentalBlurMethod="dimezisBlurView" 
                style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.2)' }]} 
              />
            </TouchableWithoutFeedback>
            
            <Animated.View style={{ 
              backgroundColor: colors.background, 
              borderTopLeftRadius: scale(25), 
              borderTopRightRadius: scale(25), 
              borderWidth: scale(1), 
              borderColor: colors.border,
              padding: scale(20), 
              paddingTop: scale(25),
              paddingBottom: Math.max(insets.bottom, scale(20)) + keyboardHeight,
              transform: [{ translateY: slideAnim }] 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(15) }}>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.text }}>
                  {editingId ? 'Edit Address' : 'New Address'}
                </Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setModalVisible(false); }}>
                  <Ionicons name="close-circle" size={scale(26)} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={{ gap: scale(12) }}>
                  
                  {!editingId && (
                    <TouchableOpacity
                      onPress={handleGetLocation}
                      disabled={isCapturingLocation}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: 'rgba(229, 57, 53, 0.1)', 
                        padding: scale(12), 
                        borderRadius: scale(12), 
                        marginBottom: scale(5),
                        justifyContent: 'center' 
                      }}
                    >
                      {isCapturingLocation ? (
                        <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: scale(8) }} />
                      ) : (
                        <Ionicons name={isMapMode ? "close" : "locate"} size={scale(20)} color={Colors.primary} style={{ marginRight: scale(8) }} />
                      )}
                      <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: scale(14) }}>
                        {isCapturingLocation ? 'Fetching...' : isMapMode ? 'Cancel Map' : 'Auto-fill with Current Location'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* MAP VIEW INJECTION */}
                  {isMapMode && mapRegion && (
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
                  )}

                  {/* ONLY SHOW INPUTS IF MAP IS CLOSED */}
                  {!isMapMode && (
                    <>
                      <View>
                        <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Label (e.g. Home, Work)</Text>
                        <TextInput
                          value={label}
                          onChangeText={setLabel}
                          placeholder="Home"
                          placeholderTextColor={colors.textMuted}
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Street Address *</Text>
                        <TextInput
                          value={streetAddress}
                          onChangeText={setStreetAddress}
                          placeholder="No 6 Kuje Street"
                          placeholderTextColor={colors.textMuted}
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Landmark</Text>
                        <TextInput
                          value={landmark}
                          onChangeText={setLandmark}
                          placeholder="Opposite the blue gate"
                          placeholderTextColor={colors.textMuted}
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Area</Text>
                        <TextInput
                          value={area}
                          onChangeText={setArea}
                          placeholder="Kuje"
                          placeholderTextColor={colors.textMuted}
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving || isCapturingLocation}
                        style={{ backgroundColor: Colors.primary, paddingVertical: scale(14), borderRadius: scale(20), alignItems: 'center', marginTop: scale(8), marginBottom: scale(20), opacity: saving || isCapturingLocation ? 0.7 : 1 }}
                      >
                        {saving ? (
                          <ActivityIndicator color="#FFF" />
                        ) : (
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: scale(15) }}>
                            {editingId ? 'Save Changes' : 'Save Address'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </  >
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: scale(10), 
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: scale(20),
    paddingHorizontal: scale(20),
  },
  headerSection: {
    marginBottom: scale(25),
    paddingHorizontal: scale(5),
  },
  titleText: {
    fontSize: scale(24),
    fontWeight: 'bold',
    marginBottom: scale(8),
  },
  subText: {
    fontSize: scale(14),
    lineHeight: scale(22),
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: scale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
  },
  defaultCardShadow: {
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  addressTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  defaultBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: scale(11),
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressText: {
    fontSize: scale(14),
    lineHeight: scale(20),
    paddingRight: scale(10),
  },
  divider: {
    height: 1,
    marginVertical: scale(15),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scale(20),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    marginLeft: scale(-10),
  },
  actionBtnText: {
    fontSize: scale(14),
    fontWeight: '600',
    marginLeft: scale(6),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(50),
  },
  emptyTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    marginTop: scale(15),
    marginBottom: scale(8),
  },
  emptySub: {
    fontSize: scale(14),
    textAlign: 'center',
    paddingHorizontal: scale(40),
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    paddingTop: scale(15),
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    borderTopWidth: 1,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(-5) },
    shadowOpacity: 0.1,
    shadowRadius: scale(10),
  },
  addBtn: {
    flexDirection: 'row',
    paddingVertical: scale(16),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(5),
  },
  addBtnText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },

  // MAP STYLES
  mapContainer: { height: scale(350), borderRadius: scale(15), overflow: 'hidden', marginBottom: scale(20), backgroundColor: '#EFEFEF' },
  mapView: { flex: 1 },
  mapCenterPin: { position: 'absolute', top: '50%', left: '50%', marginTop: -scale(35), marginLeft: -scale(20), alignItems: 'center' },
  pinShadow: { width: scale(10), height: scale(4), backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: scale(5), marginTop: -scale(6) },
  mapInstructions: { position: 'absolute', top: scale(15), alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: scale(15), paddingVertical: scale(8), borderRadius: scale(20), elevation: 3 },
  mapInstructionText: { fontSize: scale(12), fontWeight: 'bold' },
  confirmMapBtn: { position: 'absolute', bottom: scale(15), left: scale(15), right: scale(15), height: scale(50), borderRadius: scale(25), justifyContent: 'center', alignItems: 'center', elevation: 4 },
  confirmMapBtnText: { color: '#FFF', fontSize: scale(16), fontWeight: 'bold' },
});