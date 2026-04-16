// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve module resolution errors (cache bust).
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert,
  LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Mock Data for Saved Cards
const INITIAL_CARDS = [
  { 
    id: '1', 
    type: 'Visa', 
    last4: '4242', 
    expiry: '12/28', 
    isDefault: true, 
    color: '#1A1F71' // Visa Blue
  },
  { 
    id: '2', 
    type: 'Mastercard', 
    last4: '8810', 
    expiry: '09/27', 
    isDefault: false, 
    color: '#EB001B' // Mastercard Red
  },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [walletBalance] = useState(15450);

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const handleSetDefault = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCards(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
  };

  const handleDelete = (id: string, type: string, last4: string) => {
    Alert.alert(
      'Remove Card',
      `Are you sure you want to remove your ${type} ending in **${last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCards(prev => prev.filter(card => card.id !== id));
          } 
        }
      ]
    );
  };

  const handleAddCard = () => {
    Alert.alert('Add Payment Method', 'This would open a secure payment gateway (like Paystack or Flutterwave) to bind a new card.');
  };

  const handleTopUp = () => {
    Alert.alert('Top Up Wallet', 'Redirecting to wallet funding page...');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop, paddingBottom }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, styles.sideIcon]}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="none">
          <Text style={styles.headerTitle}>Payment Methods</Text>
        </View>
        <View style={styles.sideIcon} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        
        {/* BWARI WALLET CARD */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 5 }]}>
          MY WALLET
        </Text>
        
        <LinearGradient
          colors={[isDark ? '#333' : '#2C3E50', isDark ? '#111' : '#000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <View style={styles.walletTopRow}>
            <View>
              <Text style={styles.walletLabel}>Bwari Wallet Balance</Text>
              <Text style={styles.walletBalance}>₦{walletBalance.toLocaleString()}</Text>
            </View>
            <Ionicons name="wallet" size={40} color="rgba(255,255,255,0.2)" />
          </View>
          
          <TouchableOpacity 
            style={[styles.topUpBtn, { backgroundColor: Colors.primary }]}
            activeOpacity={0.8}
            onPress={handleTopUp}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.topUpBtnText}>Top Up Wallet</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>
          SAVED CARDS
        </Text>

        {cards.length > 0 ? (
          cards.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.cardItem, 
                { backgroundColor: colors.surface, borderColor: item.isDefault ? Colors.primary : colors.border },
                item.isDefault && styles.defaultCardShadow
              ]}
              activeOpacity={0.8}
              onPress={() => handleSetDefault(item.id)}
            >
              <View style={styles.cardInfoRow}>
                {/* Simulated Card Logo */}
                <View style={[styles.cardLogoBox, { backgroundColor: item.color }]}>
                  <Text style={styles.cardLogoText}>{item.type}</Text>
                </View>
                
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardName, { color: colors.text }]}>
                    •••• •••• •••• {item.last4}
                  </Text>
                  <Text style={[styles.cardExpiry, { color: colors.textMuted }]}>
                    Expires {item.expiry}
                  </Text>
                </View>

                {item.isDefault ? (
                  <View style={[styles.defaultBadge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.deleteBtn} 
                    onPress={() => handleDelete(item.id, item.type, item.last4)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={60} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Cards Saved
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Add a credit or debit card for faster checkouts.
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
          onPress={handleAddCard}
        >
          <Ionicons name="card" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Card</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  sideIcon: {
    zIndex: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: {
    padding: 5,
    marginLeft: -5,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 5,
    letterSpacing: 1.5,
  },
  walletCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  walletBalance: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  topUpBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  topUpBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardItem: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLogoBox: {
    width: 50,
    height: 35,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardLogoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 2,
  },
  cardExpiry: {
    fontSize: 12,
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 10,
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  deleteBtn: {
    padding: 10,
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
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