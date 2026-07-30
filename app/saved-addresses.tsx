import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useAddresses, Address } from '../context/AddressContext'; 
import TopNav from '../components/TopNav';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

export default function SavedAddressesScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { addresses, loading, removeAddress, setDefaultAddress, addCurrentLocationAddress, updateAddress } = useAddresses();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [saving, setSaving] = useState(false);

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
                      name={item.label?.toLowerCase() === 'home' ? 'home' : 'location'} 
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

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: scale(25), borderTopRightRadius: scale(25), padding: scale(20), paddingBottom: insets.bottom + scale(20) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(15) }}>
              <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.text }}>
                {editingId ? 'Edit Address' : 'New Address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={scale(26)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: scale(12) }}>
          <View>
            <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Label (e.g. Home, Work)</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Home"
              placeholderTextColor={colors.textMuted}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
            />
          </View>
          <View>
            <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Street Address *</Text>
            <TextInput
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="No 6 Kuje Street"
              placeholderTextColor={colors.textMuted}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
            />
          </View>
          <View>
            <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Landmark</Text>
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Opposite the blue gate"
              placeholderTextColor={colors.textMuted}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
            />
          </View>
          <View>
            <Text style={{ fontSize: scale(13), fontWeight: '600', marginBottom: scale(6), color: colors.text }}>Area</Text>
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="Kuje"
              placeholderTextColor={colors.textMuted}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: scale(12), padding: scale(12), color: colors.text }}
            />
          </View>

          {!editingId && (
            <Text style={{ fontSize: scale(12), color: colors.textMuted, fontStyle: 'italic' }}>
              We&apos;ll use your device&apos;s current location to pinpoint this address for delivery.
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: Colors.primary, paddingVertical: scale(14), borderRadius: scale(20), alignItems: 'center', marginTop: scale(8), opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: scale(15) }}>
                {editingId ? 'Save Changes' : 'Use Current Location & Save'}
              </Text>
            )}
          </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});