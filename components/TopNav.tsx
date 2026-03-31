import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// 1. Add Interface
interface TopNavProps {
  address: string;
  cartCount: number;
  notificationCount: number;
}

export default function TopNav({ address, cartCount, notificationCount }: TopNavProps) {
  return (
    <View style={styles.topNavContainer}>
      <Ionicons name="menu" size={32} color="#ffffff" />
      
      <View style={styles.locationContainer}>
        <Text style={styles.deliverToText}>Deliver to</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={14} color="#FFC107" />
          {/* 2. Dynamic Address */}
          <Text style={styles.addressText}>{address}</Text>
          <Ionicons name="chevron-down" size={14} color="#FFF" style={styles.chevronIcon} />
        </View>
      </View>

      <View style={styles.headerIcons}>
        <View style={styles.iconWrapper}>
          <Ionicons name="cart-outline" size={26} color="#FFF" />
          <View style={styles.badge}>
            {/* 3. Dynamic Cart Count */}
            <Text style={styles.badgeText}>{cartCount}</Text>
          </View>
        </View>
        <View style={[styles.iconWrapper, styles.bellIcon]}>
          <Ionicons name="notifications-outline" size={26} color="#FFF" />
          <View style={styles.badge}>
            {/* 4. Dynamic Notification Count */}
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
}

// ... keep your exact same styles ...
const styles = StyleSheet.create({
  topNavContainer: { backgroundColor: Colors.primary, position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, zIndex: 10, elevation: 8, },
  locationContainer: { alignItems: 'center', },
  deliverToText: { color: '#FFCCCC', fontSize: 12, },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, },
  addressText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, marginLeft: 4, },
  chevronIcon: { marginLeft: 4, },
  headerIcons: { flexDirection: 'row', alignItems: 'center', },
  iconWrapper: { position: 'relative', },
  bellIcon: { marginLeft: 15, },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FFFFFF', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', },
  divider: { height: 2, backgroundColor: 'rgba(255, 255, 255, 0.37)', marginBottom: 0, position: 'absolute', top: 106, right: 0, left: 20, width: '90%', zIndex: 100, },
});