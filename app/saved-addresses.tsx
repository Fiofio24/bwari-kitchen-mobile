// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve ESLint unused variable warning.
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useAddresses } from '../context/AddressContext'; 
import TopNav from '../components/TopNav';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { addresses, removeAddress, setDefaultAddress } = useAddresses();

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

  const handleAddNew = () => {
    Alert.alert('Add New Address', 'This would open a map or form to enter a new location.');
  };

  const handleEdit = (title: string) => {
    Alert.alert('Edit Address', `Edit details for ${title}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* USING THE NEW UNIVERSAL TOPNAV */}
      <TopNav 
        title="Saved Addresses"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        showDivider={false} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        
        <View style={styles.headerSection}>
          <Text style={[styles.titleText, { color: colors.text }]}>
            Delivery Locations
          </Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>
            Manage your saved addresses for quick and easy checkout.
          </Text>
        </View>

        {addresses.length > 0 ? (
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
                      name={item.icon as any} 
                      size={20} 
                      color={item.isDefault ? Colors.primary : colors.textMuted} 
                    />
                  </View>
                  <Text style={[styles.addressTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>
                
                {item.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.addressText, { color: colors.textMuted }]}>
                {item.address}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleEdit(item.title)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                  <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={60} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Addresses Saved
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Add a delivery location to make ordering faster.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* BOTTOM ADD BUTTON */}
      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: insets.bottom + 20, 
          backgroundColor: isDark ? colors.surface : '#FFF', 
          borderTopColor: colors.border 
        }
      ]}>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: Colors.primary }]} 
          activeOpacity={0.8}
          onPress={handleAddNew}
        >
          <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    lineHeight: 22,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  defaultCardShadow: {
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: -10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: -5 
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  addBtn: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});