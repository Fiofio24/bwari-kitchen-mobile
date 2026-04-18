import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  LayoutAnimation,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../components/TopNav';

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
  const [cashOnDelivery, setCashOnDelivery] = useState(false);

  const handleSetDefault = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCards(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
    // If they set a card as default, turn off COD
    if (cashOnDelivery) setCashOnDelivery(false);
  };

  const handleToggleCOD = (value: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCashOnDelivery(value);
    // If they turn ON Cash on Delivery, remove default status from cards
    if (value) {
      setCards(prev => prev.map(card => ({ ...card, isDefault: false })));
    } else if (cards.length > 0) {
      // If they turn it off, default back to the first card
      setCards(prev => prev.map((card, index) => ({ ...card, isDefault: index === 0 })));
    }
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* UNIVERSAL TOPNAV WITH SHADOW */}
      <TopNav 
        title="Payment Methods"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}>
        
        <View style={styles.headerSection}>
          <Text style={[styles.titleText, { color: colors.text }]}>
            Payment Options
          </Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>
            Manage how you pay for your delicious Bwari Kitchen meals.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
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

        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 25 }]}>
          OTHER METHODS
        </Text>

        {/* CASH ON DELIVERY CARD */}
        <TouchableOpacity 
          style={[
            styles.codCard, 
            { backgroundColor: colors.surface, borderColor: cashOnDelivery ? Colors.primary : colors.border },
            cashOnDelivery && styles.defaultCardShadow
          ]}
          activeOpacity={0.8}
          onPress={() => handleToggleCOD(!cashOnDelivery)}
        >
          <View style={styles.codRow}>
            <View style={[styles.codIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <Ionicons name="cash-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.codTextContainer}>
              <Text style={[styles.codTitle, { color: colors.text }]}>Cash on Delivery</Text>
              <Text style={[styles.codSub, { color: colors.textMuted }]}>Pay with cash or transfer to rider</Text>
            </View>
            <Switch 
              value={cashOnDelivery} 
              onValueChange={handleToggleCOD} 
              trackColor={{ false: '#767577', true: 'rgba(211, 47, 47, 0.3)' }} 
              thumbColor={cashOnDelivery ? Colors.primary : '#f4f3f4'} 
            />
          </View>
        </TouchableOpacity>

        {/* SECURITY TRUST BADGE */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={30} color={isDark ? colors.textMuted : '#4CAF50'} />
          <View style={styles.securityTextContainer}>
            <Text style={[styles.securityTitle, { color: colors.text }]}>Bank-Grade Security</Text>
            <Text style={[styles.securitySub, { color: colors.textMuted }]}>
              Bwari Kitchen uses PCI DSS compliant 256-bit encryption. Your card details are never saved on our servers.
            </Text>
          </View>
        </View>

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
          <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Card</Text>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 5,
    letterSpacing: 1.5,
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
  codCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  codRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  codTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  codTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  codSub: {
    fontSize: 12,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  securitySub: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
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