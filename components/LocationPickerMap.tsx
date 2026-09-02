import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { scale } from '../constants/Sizes';

export interface ConfirmedLocation {
  latitude: string;
  longitude: string;
  streetAddress: string;
  landmark: string;
  area: string;
  isFallback: boolean; // NEW: Tells the form if it should unlock the input
}

interface LocationPickerMapProps {
  initialRegion: Region;
  onConfirm: (locationData: ConfirmedLocation) => void;
  onCancel?: () => void;
}

export default function LocationPickerMap({ initialRegion, onConfirm, onCancel }: LocationPickerMapProps) {
  const { colors, isDark } = useTheme();
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);
  const [isConfirmingMap, setIsConfirmingMap] = useState(false);

  const handleConfirmMapLocation = async () => {
    setIsConfirmingMap(true);
    try {
      const lat = mapRegion.latitude.toFixed(6);
      const lng = mapRegion.longitude.toFixed(6);
      let localStreet = 'Unknown Location';
      let localLandmark = '';
      let localArea = '';

      // ATTEMPT 1: Try Expo's Native Geocoding
      try {
        let geocode = await Location.reverseGeocodeAsync({
          latitude: mapRegion.latitude,
          longitude: mapRegion.longitude
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          
          localStreet = place.street || place.name || place.district || 'Unnamed Area';
          localLandmark = (place.name && place.name !== localStreet) ? place.name : '';
          
          const cityOrDistrict = place.city || place.subregion || place.district;
          localArea = [cityOrDistrict, place.region].filter(Boolean).join(', ');
          
          // Native map success! Lock the input (isFallback: false)
          onConfirm({ latitude: lat, longitude: lng, streetAddress: localStreet, landmark: localLandmark, area: localArea, isFallback: false });
          return;
        }
      } catch (nativeError) {
        console.log("Native geocoding failed, trying fallback...", nativeError);
      }

      // ATTEMPT 2: Fallback to OpenStreetMap
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapRegion.latitude}&lon=${mapRegion.longitude}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'BwariKitchenApp/1.0' 
        }
      });
      
      const data = await response.json();
      
      if (data && data.address) {
        localStreet = data.address.road || data.address.neighbourhood || data.address.residential || data.address.village || data.address.suburb || data.name || 'Unnamed Area';
        localLandmark = data.address.amenity || data.address.building || '';
        localArea = data.address.city || data.address.town || data.address.state || '';
      }

      // Fallback used! Unlock the input (isFallback: true)
      onConfirm({ latitude: lat, longitude: lng, streetAddress: localStreet, landmark: localLandmark, area: localArea, isFallback: true });
    } catch (error) {
      console.warn("Total geocode failure:", error);
      Alert.alert('Location Info', 'Coordinates saved, but we could not find the street name. Please type it in manually.');
      
      // Total failure! Unlock the input (isFallback: true)
      onConfirm({ 
        latitude: mapRegion.latitude.toFixed(6), 
        longitude: mapRegion.longitude.toFixed(6), 
        streetAddress: 'Unknown Location', 
        landmark: '', 
        area: '',
        isFallback: true 
      });
    } finally {
      setIsConfirmingMap(false);
    }
  };

  return (
    <View style={styles.mapContainer}>
      {onCancel && (
        <TouchableOpacity style={styles.cancelMapBtn} onPress={onCancel}>
          <Ionicons name="arrow-back-circle" size={scale(36)} color={colors.text} />
        </TouchableOpacity>
      )}
      <MapView 
        style={styles.mapView}
        initialRegion={initialRegion}
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
  );
}

const styles = StyleSheet.create({
  mapContainer: { height: scale(350), borderRadius: scale(15), overflow: 'hidden', marginBottom: scale(20), backgroundColor: '#EFEFEF' },
  mapView: { flex: 1 },
  mapCenterPin: { position: 'absolute', top: '50%', left: '50%', marginTop: -scale(35), marginLeft: -scale(20), alignItems: 'center' },
  pinShadow: { width: scale(10), height: scale(4), backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: scale(5), marginTop: -scale(6) },
  mapInstructions: { position: 'absolute', top: scale(15), alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: scale(15), paddingVertical: scale(8), borderRadius: scale(20), elevation: 3 },
  mapInstructionText: { fontSize: scale(12), fontWeight: 'bold' },
  confirmMapBtn: { position: 'absolute', bottom: scale(15), left: scale(15), right: scale(15), height: scale(50), borderRadius: scale(25), justifyContent: 'center', alignItems: 'center', elevation: 4 },
  confirmMapBtnText: { color: '#FFF', fontSize: scale(16), fontWeight: 'bold' },
  cancelMapBtn: { position: 'absolute', top: scale(15), left: scale(15), zIndex: 10, elevation: 5, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: scale(20) }
});