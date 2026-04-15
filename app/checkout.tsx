// Note: This file requires an Expo/React Native environment to compile correctly.
// Triggering a fresh build to resolve module resolution errors.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartItems, clearCart } = useCart();
  
  // States
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery'); 
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success'>('pending');
  const [timer, setTimer] = useState(600); // 10 minutes in seconds

  const [orderNote, setOrderNote] = useState('');
  const [noCutlery, setNoCutlery] = useState(true);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Layout calculations
  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;
  const bottomNavHeight = 70 + Math.max(insets.bottom, 15);

  const checkoutItems = useMemo(() => {
    if (params.selectedItems) {
      try {
        const selectedIds = JSON.parse(params.selectedItems as string);
        return cartItems.filter(item => selectedIds.includes(item.id));
      } catch (e) {
        console.warn("Failed to parse selected items", e);
      }
    }
    return cartItems;
  }, [params.selectedItems, cartItems]);

  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  
  const deliveryFee = (deliveryMethod === 'delivery' && subtotal > 0) ? 500 : 0;
  const total = subtotal + deliveryFee; 

  // Timer Effect for Bank Transfer
  useEffect(() => {
    let interval: any;
    if (showVerification && timer > 0 && verificationStatus === 'pending') {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showVerification, timer, verificationStatus]);

  // Pulse Effect for Loading
  useEffect(() => {
    if (verificationStatus === 'verifying') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [verificationStatus, pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlaceOrder = () => {
    if (selectedPayment === 'bank') {
      setShowVerification(true);
    } else {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        finalizeOrder();
      }, 2000);
    }
  };

  const handleVerifyPayment = () => {
    setVerificationStatus('verifying');
    setTimeout(() => {
      setVerificationStatus('success');
      setTimeout(() => {
        finalizeOrder();
      }, 1500);
    }, 3000);
  };

  const finalizeOrder = () => {
    clearCart();
    if (Platform.OS === 'web') window.alert('Payment Successful! Order Placed.');
    else Alert.alert('Order Placed!', 'Your food is on the way.');
    router.replace('/(tabs)');
  };

  if (showVerification) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
        <View style={styles.verifyHeader}>
          <TouchableOpacity onPress={() => setShowVerification(false)}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.verifyTitle, { color: colors.text }]}>Payment Verification</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.verifyContent}>
          {verificationStatus !== 'success' ? (
            <>
              <View style={[styles.timerBox, { backgroundColor: timer < 60 ? '#FFEBEE' : colors.surface }]}>
                <Text style={[styles.timerLabel, { color: colors.textMuted }]}>Account expires in</Text>
                <Text style={[styles.timerText, { color: timer < 60 ? '#D32F2F' : Colors.primary }]}>{formatTime(timer)}</Text>
              </View>

              <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.bankInfoLabel, { color: colors.textMuted }]}>TRANSFER EXACTLY</Text>
                <Text style={[styles.transferAmount, { color: colors.text }]}>₦{total.toLocaleString()}</Text>
                
                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 20 }]} />
                
                <View style={styles.bankDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Bank Name</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>Wema Bank / Bwari Kitchen</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account Number</Text>
                  <View style={styles.copyRow}>
                    <Text style={[styles.accountNumber, { color: Colors.primary }]}>7820119344</Text>
                    <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                  </View>
                </View>
              </View>

              <View style={styles.instructionBox}>
                <Ionicons name="information-circle" size={20} color={colors.textMuted} />
                <Text style={[styles.instructionText, { color: colors.textMuted }]}>
                  Please stay on this screen after making your transfer. Confirmation is automatic.
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.verifyBtn, { backgroundColor: Colors.primary }]} 
                onPress={handleVerifyPayment}
                disabled={verificationStatus === 'verifying'}
              >
                {verificationStatus === 'verifying' ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.verifyBtnText}>I have transferred the money</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
              </Animated.View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Payment Confirmed!</Text>
              <Text style={[styles.successSub, { color: colors.textMuted }]}>We&apos;ve received your transfer. Preparing your meal now.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop, paddingBottom }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, styles.sideIcon]}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={[styles.centerWrapper, { top: paddingTop, bottom: paddingBottom }]} pointerEvents="none">
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.sideIcon} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 60 }]}>
        
        {/* ETA BANNER */}
        <View style={[styles.etaBanner, { backgroundColor: isDark ? colors.surface : '#E8F5E9', borderColor: '#81C784' }]}>
          <Ionicons name="time" size={24} color="#388E3C" />
          <View style={styles.etaTextContainer}>
            <Text style={[styles.etaTitle, { color: colors.text }]}>Estimated {deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'} Time</Text>
            <Text style={[styles.etaValue, { color: '#388E3C' }]}>{deliveryMethod === 'delivery' ? '30 - 45' : '15 - 20'} Minutes</Text>
          </View>
        </View>

        {/* ORDER FULFILLMENT TOGGLE */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORDER FULFILLMENT</Text>
        
        <View style={[styles.methodToggleContainer, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
          <TouchableOpacity 
            style={[
              styles.methodToggleBtn, 
              deliveryMethod === 'delivery' ? [styles.methodToggleBtnActive, { backgroundColor: Colors.primary }] : null
            ]}
            onPress={() => setDeliveryMethod('delivery')}
            activeOpacity={0.8}
          >
            <Ionicons name="bicycle" size={18} color={deliveryMethod === 'delivery' ? '#FFF' : colors.textMuted} />
            <Text style={[styles.methodToggleText, { color: deliveryMethod === 'delivery' ? '#FFF' : colors.textMuted }]}>Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.methodToggleBtn, 
              deliveryMethod === 'pickup' ? [styles.methodToggleBtnActive, { backgroundColor: Colors.primary }] : null
            ]}
            onPress={() => setDeliveryMethod('pickup')}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront" size={18} color={deliveryMethod === 'pickup' ? '#FFF' : colors.textMuted} />
            <Text style={[styles.methodToggleText, { color: deliveryMethod === 'pickup' ? '#FFF' : colors.textMuted }]}>Pick Up</Text>
          </TouchableOpacity>
        </View>

        {/* CONDITIONAL DETAILS CARD */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {deliveryMethod === 'delivery' ? (
            <>
              <View style={styles.addressRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(229, 57, 53, 0.1)' }]}>
                  <Ionicons name="location" size={24} color={Colors.primary} />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={[styles.addressTitle, { color: colors.text }]}>Home</Text>
                  <Text style={[styles.addressDetail, { color: colors.textMuted }]}>No 6 Kuje Street, FCT Abuja</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.editText}>Change</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 15 }]} />
              
              <TextInput
                style={[styles.noteInput, { backgroundColor: isDark ? colors.background : '#F5F5F5', color: colors.text, borderColor: colors.border }]}
                placeholder="Add delivery note (e.g., Leave at the gate)"
                placeholderTextColor={colors.textMuted}
                value={orderNote}
                onChangeText={setOrderNote}
              />
            </>
          ) : (
            <View style={styles.addressRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="storefront" size={24} color="#4CAF50" />
              </View>
              <View style={styles.addressTextContainer}>
                <Text style={[styles.addressTitle, { color: colors.text }]}>Bwari Kitchen Main Branch</Text>
                <Text style={[styles.addressDetail, { color: colors.textMuted }]}>No 1 Kitchen Avenue, Central FCT</Text>
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 15 }]} />
          
          <View style={styles.ecoRow}>
            <View style={styles.ecoTextWrap}>
              <Text style={[styles.ecoTitle, { color: colors.text }]}>No Cutlery Required</Text>
              <Text style={[styles.ecoSub, { color: colors.textMuted }]}>Help us reduce plastic waste</Text>
            </View>
            <Switch 
              value={noCutlery} 
              onValueChange={setNoCutlery} 
              trackColor={{ false: '#767577', true: '#81C784' }} 
              thumbColor={noCutlery ? '#388E3C' : '#f4f3f4'} 
            />
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PAYMENT METHOD</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.paymentOption, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => setSelectedPayment('card')}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#F3E5F5' }]}><Ionicons name="card" size={20} color="#9C27B0" /></View>
            <View style={styles.paymentTextContainer}><Text style={[styles.paymentTitle, { color: colors.text }]}>Credit/Debit Card</Text><Text style={[styles.paymentSub, { color: colors.textMuted }]}>Visa or Mastercard</Text></View>
            <Ionicons name={selectedPayment === 'card' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedPayment === 'card' ? Colors.primary : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => setSelectedPayment('bank')}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#E3F2FD' }]}><Ionicons name="business" size={20} color="#1976D2" /></View>
            <View style={styles.paymentTextContainer}><Text style={[styles.paymentTitle, { color: colors.text }]}>Bank Transfer</Text><Text style={[styles.paymentSub, { color: colors.textMuted }]}>Instant live verification</Text></View>
            <Ionicons name={selectedPayment === 'bank' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedPayment === 'bank' ? Colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ORDER SUMMARY */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORDER SUMMARY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Display Items List */}
          {checkoutItems.map((item: any, idx: number) => (
            <View key={item.id} style={[styles.summaryItemRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={styles.summaryItemLeft}>
                <Text style={[styles.snText, { color: Colors.primary }]}>
                  {item.quantity || 1}x
                </Text>
                <Text style={[styles.summaryItemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
              <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                ₦{(item.price * (item.quantity || 1)).toLocaleString()}
              </Text>
            </View>
          ))}

          {/* Subtotal & Delivery Breakdown */}
          <View style={styles.totalsContainer}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₦{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₦{deliveryFee.toLocaleString()}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: Colors.primary }]}>₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: isDark ? colors.surface : '#FFF', borderTopColor: colors.border }]}>
        <View style={styles.footerContent}>
          <View style={styles.footerTextContainer}>
            <Text style={[styles.footerTotalLabel, { color: colors.textMuted }]}>Total Payment</Text>
            <Text style={[styles.footerTotalValue, { color: colors.text }]}>₦{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={[styles.placeOrderBtn, { opacity: isProcessing ? 0.7 : 1 }]} onPress={handlePlaceOrder} disabled={isProcessing}>
            <Text style={styles.placeOrderText}>{isProcessing ? "Processing..." : (selectedPayment === 'bank' ? "Generate Account" : "Place Order")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 25,
  },
  etaTextContainer: {
    marginLeft: 15,
  },
  etaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  methodToggleContainer: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 5,
    marginBottom: 15,
  },
  methodToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  methodToggleBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addressDetail: {
    fontSize: 13,
  },
  editText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    padding: 5,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 45,
  },
  ecoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ecoTextWrap: {
    flex: 1,
  },
  ecoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  ecoSub: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentSub: {
    fontSize: 12,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  snText: {
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingRight: 10,
  },
  summaryItemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  totalsContainer: {
    marginTop: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  placeOrderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  verifyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  verifyContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  timerBox: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  accountCard: {
    width: '100%',
    borderRadius: 25,
    borderWidth: 1,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center',
  },
  bankInfoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  transferAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  bankDetailRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 13,
    marginLeft: 10,
    lineHeight: 18,
  },
  verifyBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  successSub: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 30,
  }
});