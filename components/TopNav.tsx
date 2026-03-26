import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function TopNav() {
  return (
    <View style={styles.topNavContainer}>
      <Ionicons name="menu" size={32} color="#FFF" />
      
      <View style={styles.locationContainer}>
        <Text style={styles.deliverToText}>Deliver to</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={14} color="#FFC107" />
          <Text style={styles.addressText}>No 6 Kuje Street...</Text>
          <Ionicons name="chevron-down" size={14} color="#FFF" style={styles.chevronIcon} />
        </View>
      </View>

      <View style={styles.headerIcons}>
        <View style={styles.iconWrapper}>
          <Ionicons name="cart-outline" size={26} color="#FFF" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </View>
        <View style={[styles.iconWrapper, styles.bellIcon]}>
          <Ionicons name="notifications-outline" size={26} color="#FFF" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  topNavContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    // borderBottomColor: '#ffffff2e',
    // borderBottomWidth: 2,
    zIndex: 10,
    elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.15,
    // shadowRadius: 10,
  },
  locationContainer: {
    alignItems: 'center',
  },
  deliverToText: {
    color: '#FFCCCC',
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  bellIcon: {
    marginLeft: 15,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 0,
    position: 'absolute',
    top: 107,
    right: 0,
    left: 20,
    width: '90%',
    zIndex: 100,
  },
});