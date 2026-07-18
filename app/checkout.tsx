import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { useAddresses } from '../context/AddressContext'; 
import AddressSelectorModal from '../components/AddressSelectorModal'; 
import TopNav from '../components/TopNav';
import HomeIcon from '../components/HomeIcon';
import api from './lib/api';

// Every cart entry — real package, custom plate, or plain item — becomes
// one "package" entry for the backend, matching its package-centric order model.
const buildOrderPackagesPayload = (items: any[]) => {
  return items.map((item: any) => {
    if (item.subItems && item.subItems.length > 0) {
      const isRealPackageId = !String(item.id).startsWith('custom_');
      return {
        packageId: isRealPackageId ? item.id : undefined,
        name: item.name,
        wasEdited: String(item.id).startsWith('custom_edit_'),
        items: item.subItems.map((sub: any) => ({
          menuItemId: sub.id,
          variantLabel: sub.variantLabel || undefined,
          quantity: sub.qty * (item.quantity || 1),
        })),
      };
    } else {
      return {
        name: item.name,
        items: [{
          menuItemId: item.id,
          quantity: item.quantity || 1,
        }],
      };
    }
  });
};

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { cartItems, removeMultipleFromCart } = useCart();
  const { activeAddress } = useAddresses(); 
  
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [noCutlery, setNoCutlery] = useState(true);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false); 
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ discountAmount: number; message: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

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
  
  // Delivery fee is calculated server-side by the backend once the order is placed;
  // this is just an estimate shown before checkout so the UI isn't blank.
  const [estimatedDeliveryFee, setEstimatedDeliveryFee] = useState(0);

  React.useEffect(() => {
    const fetchFee = async () => {
      if (deliveryMethod !== 'delivery' || !activeAddress?.id) {
        setEstimatedDeliveryFee(0);
        return;
      }
      try {
        const res = await api.post('/api/addresses/delivery-fee', { addressId: activeAddress.id });
        setEstimatedDeliveryFee(res.data.deliveryFee);
      } catch (err) {
        setEstimatedDeliveryFee(0);
      }
    };
    fetchFee();
  }, [deliveryMethod, activeAddress?.id]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    try {
      const res = await api.post('/api/promotions/validate', {
        code: promoCode.trim(),
        orderAmount: subtotal,
      });
      setPromoResult({ discountAmount: res.data.discountAmount, message: res.data.message });
    } catch (err: any) {
      Alert.alert('Promo Code', err.response?.data?.message || 'Invalid promo code');
      setPromoResult(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const total = subtotal + estimatedDeliveryFee - (promoResult?.discountAmount || 0); 

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) return;

    if (deliveryMethod === 'delivery' && !activeAddress) {
      Alert.alert('Address Required', 'Please select a delivery address before placing your order.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create the order
      const orderPayload: any = {
        orderType: deliveryMethod,
        paymentMethod: 'paystack',
        packages: buildOrderPackagesPayload(checkoutItems),
        specialInstructions: orderNote || undefined,
      };

      if (deliveryMethod === 'delivery' && activeAddress) {
        orderPayload.deliveryAddressId = activeAddress.id;
      }

      if (promoResult && promoCode.trim()) {
        orderPayload.promoCode = promoCode.trim();
      }

      const orderRes = await api.post('/api/orders', orderPayload);
      const order = orderRes.data.order;

      // 2. Initialize payment for that order
      const paymentRes = await api.post('/api/payments/initialize', { orderId: order.id });
      const { paymentUrl, reference } = paymentRes.data;

      // 3. Open Paystack, waiting for redirect back to our app's custom scheme
      const redirectUrl = 'bwarikitchen://payment-complete';
      const result = await WebBrowser.openAuthSessionAsync(paymentUrl, redirectUrl);

      // 4. Regardless of how the session ended, verify with the backend directly.
      // Retry a few times with a short delay, since Paystack's own confirmation
      // can lag slightly behind the redirect completing.
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let verified = false;

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const verifyRes = await api.get(`/api/payments/verify/${reference}`);
          if (verifyRes.data.status === 'successful') {
            verified = true;
            break;
          }
        } catch (verifyErr) {
          // keep retrying — a failed verify attempt isn't necessarily final
        }
        if (attempt < 3) await wait(2000);
      }

      if (verified) {
        removeMultipleFromCart(checkoutItems.map((item: any) => item.id));
        if (Platform.OS === 'web') window.alert('Payment Successful! Order Placed.');
        else Alert.alert('Order Placed!', 'Your food is on the way.');
        router.replace('/my-orders');
      } else {
        Alert.alert('Payment Processing', 'Your payment is being confirmed. Check My Orders shortly for the latest status.');
        router.replace('/my-orders');
      }
    } catch (err: any) {
      Alert.alert('Order Failed', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Checkout"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <View style={styles.headerRight}>
            <HomeIcon onPress={() => router.push('/')} />
          </View>
        }
        isAbsolute={false} 
        showDivider={false} 
        isScrolled={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + 60 }]}>
        
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

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {deliveryMethod === 'delivery' ? (
            <>
              <View style={styles.addressRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(229, 57, 53, 0.1)' }]}>
                  <Ionicons name="location" size={24} color={Colors.primary} />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={[styles.addressTitle, { color: colors.text }]} numberOfLines={1}>
                    {activeAddress?.label || "No address selected"}
                  </Text>
                  <Text style={[styles.addressDetail, { color: colors.textMuted }]} numberOfLines={1}>
                    {activeAddress ? [activeAddress.streetAddress, activeAddress.area].filter(Boolean).join(', ') : "Please add a delivery address"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsAddressModalVisible(true)}>
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

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PAYMENT METHOD</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.paymentOption}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="card" size={20} color="#9C27B0" />
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={[styles.paymentTitle, { color: colors.text }]}>Card, Bank Transfer or USSD</Text>
              <Text style={[styles.paymentSub, { color: colors.textMuted }]}>Choose your preferred option on the next screen — secured by Paystack</Text>
            </View>
            <Ionicons name="radio-button-on" size={24} color={Colors.primary} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROMO CODE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          <TextInput
            style={[styles.noteInput, { flex: 1, backgroundColor: isDark ? colors.background : '#F5F5F5', color: colors.text, borderColor: colors.border }]}
            placeholder="Enter promo code"
            placeholderTextColor={colors.textMuted}
            value={promoCode}
            onChangeText={(text) => { setPromoCode(text); setPromoResult(null); }}
            autoCapitalize="characters"
          />
          <TouchableOpacity onPress={handleApplyPromo} disabled={applyingPromo || !promoCode.trim()} style={{ backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, opacity: applyingPromo || !promoCode.trim() ? 0.5 : 1 }}>
            {applyingPromo ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Apply</Text>}
          </TouchableOpacity>
        </View>
        {promoResult && (
          <Text style={{ color: '#4CAF50', fontSize: 13, marginTop: -18, marginBottom: 20, marginLeft: 5, fontWeight: '600' }}>
            ✓ {promoResult.message} — ₦{promoResult.discountAmount.toLocaleString()} off
          </Text>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORDER SUMMARY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {checkoutItems.map((item: any) => (
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

          <View style={styles.totalsContainer}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₦{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₦{estimatedDeliveryFee.toLocaleString()}</Text>
            </View>
            {promoResult && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-₦{promoResult.discountAmount.toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: Colors.primary }]}>₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[
        styles.stickyFooter, 
        { 
          paddingBottom: insets.bottom + 20, 
          backgroundColor: isDark ? colors.surface : '#FFF', 
          borderTopColor: colors.border 
        }
      ]}>
        <View style={styles.footerContent}>
          <View style={styles.footerTextContainer}>
            <Text style={[styles.footerTotalLabel, { color: colors.textMuted }]}>Total Payment</Text>
            <Text style={[styles.footerTotalValue, { color: colors.text }]}>₦{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={[styles.placeOrderBtn, { opacity: isProcessing ? 0.7 : 1 }]} onPress={handlePlaceOrder} disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.placeOrderText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <AddressSelectorModal 
        visible={isAddressModalVisible} 
        onClose={() => setIsAddressModalVisible(false)} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  scrollContent: { paddingTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  methodToggleContainer: { flexDirection: 'row', borderRadius: 15, padding: 5, marginBottom: 15 },
  methodToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  methodToggleBtnActive: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  methodToggleText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  addressTextContainer: { flex: 1, paddingRight: 10 },
  addressTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  addressDetail: { fontSize: 13 },
  editText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14, padding: 5 },
  noteInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 45 },
  ecoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoTextWrap: { flex: 1 },
  ecoTitle: { fontSize: 15, fontWeight: '600' },
  ecoSub: { fontSize: 12, marginTop: 2 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  paymentIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  paymentTextContainer: { flex: 1 },
  paymentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  paymentSub: { fontSize: 12 },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  summaryItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  snText: { fontSize: 14, fontWeight: '900', marginRight: 8 },
  summaryItemName: { flex: 1, fontSize: 15, fontWeight: '500', paddingRight: 10 },
  summaryItemPrice: { fontSize: 15, fontWeight: 'bold' },
  totalsContainer: { marginTop: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 15 },
  summaryValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 1, paddingTop: 20, paddingHorizontal: 20, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 15 },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTextContainer: { flex: 1 },
  footerTotalLabel: { fontSize: 13, marginBottom: 2 },
  footerTotalValue: { fontSize: 22, fontWeight: 'bold' },
  placeOrderBtn: { backgroundColor: Colors.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 20, elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, minWidth: 140, alignItems: 'center' },
  placeOrderText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});