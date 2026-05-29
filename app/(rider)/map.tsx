import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function RiderMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* MOCK MAP BACKGROUND (Using a professional grid or static image) */}
      <View style={[styles.mapPlaceholder, { backgroundColor: isDark ? '#1a1a1a' : '#e5e5e1' }]}>
         <Ionicons name="navigate" size={100} color={isDark ? '#333' : '#ccc'} />
         <Text style={{ color: colors.textMuted, marginTop: 20 }}>Live Map API Integration Here</Text>
         
         {/* Simulated Route Line and Pins */}
         <View style={styles.simulatedRoute}>
            <View style={[styles.pin, { backgroundColor: Colors.primary, top: 100, left: 100 }]} />
            <View style={[styles.pin, { backgroundColor: '#4CAF50', bottom: 200, right: 100 }]} />
         </View>
      </View>

      {/* FLOATING TOP NAVIGATION OVERLAY */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={[styles.navInstruction, { backgroundColor: colors.surface }]}>
           <View style={styles.turnIconBox}>
              <Ionicons name="arrow-redo" size={28} color="#FFF" />
           </View>
           <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.distanceText, { color: colors.text }]}>400m</Text>
              <Text style={[styles.streetText, { color: colors.textMuted }]}>Turn right onto Law School Road</Text>
           </View>
        </View>
      </View>

      {/* BOTTOM ACTION SHEET */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
         <View style={styles.handle} />
         
         <View style={styles.tripInfo}>
            <View>
                <Text style={[styles.timeRemaining, { color: colors.text }]}>8 mins</Text>
                <Text style={[styles.kmRemaining, { color: colors.textMuted }]}>1.2 km left</Text>
            </View>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="call" size={24} color="#4CAF50" />
            </TouchableOpacity>
         </View>

         <View style={[styles.divider, { backgroundColor: colors.border }]} />

         <View style={styles.addressRow}>
            <Ionicons name="location" size={24} color="#D32F2F" />
            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                {params.address || "Block C, Student Hostel"}
            </Text>
         </View>

         <TouchableOpacity 
            style={[styles.deliveredBtn, { backgroundColor: '#4CAF50' }]}
            onPress={() => {
                alert("Order Marked as Delivered!");
                router.back();
            }}
         >
            <Text style={styles.deliveredBtnText}>Arrived & Delivered</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  simulatedRoute: { ...StyleSheet.absoluteFillObject },
  pin: { width: 20, height: 20, borderRadius: 10, position: 'absolute', borderWidth: 3, borderColor: '#FFF' },
  
  topOverlay: { position: 'absolute', top: 0, width: '100%', paddingHorizontal: 20, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  backBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOpacity: 0.2 },
  navInstruction: { flex: 1, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, shadowOpacity: 0.2 },
  turnIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' },
  distanceText: { fontSize: 20, fontWeight: '900' },
  streetText: { fontSize: 13, fontWeight: '600' },

  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 20, shadowOpacity: 0.3 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 20 },
  tripInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  timeRemaining: { fontSize: 28, fontWeight: '900' },
  kmRemaining: { fontSize: 14, fontWeight: 'bold' },
  callBtn: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginBottom: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 10 },
  addressText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  deliveredBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  deliveredBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});