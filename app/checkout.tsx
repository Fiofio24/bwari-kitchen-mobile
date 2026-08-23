import React, { useState, useMemo, useRef } from 'react';
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
  DeviceEventEmitter,
  useWindowDimensions,
  Modal,
  Linking
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { useAddresses } from '../context/AddressContext'; 
import { useMenu } from '../context/MenuContext';
import AddressSelectorModal from '../components/AddressSelectorModal'; 
import TopNav from '../components/TopNav';
import HomeIcon from '../components/HomeIcon';
import api from './lib/api';
import { scale } from '../constants/Sizes'; 

const buildOrderPackagesPayload = (items: any[]) => {
  return items.map((item: any) => {
    const isRealPackageId = !String(item.id).startsWith('custom_');
    
    if (item.subItems && item.subItems.length > 0) {
      return {
        packageId: isRealPackageId ? item.id : undefined,
        name: item.name,
        quantity: item.quantity || 1,
        wasEdited: String(item.id).startsWith('custom_edit_'),
        items: item.subItems.map((sub: any) => ({
          menuItemId: sub.id,
          variantLabel: sub.variantLabel || undefined,
          quantity: sub.qty || sub.quantity || 1, 
        })),
      };
    } else {
      return {
        name: item.name,
        quantity: item.quantity || 1,
        items: [{
          menuItemId: item.id,
          quantity: 1, 
        }],
      };
    }
  });
};

export default function CheckoutScreen() {
  const router = useSafeRouter();
  const params = useLocalSearchParams(); 
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { cartItems, removeMultipleFromCart } = useCart();
  const { activeAddress, setActiveAddress } = useAddresses(); 
  const { findItem } = useMenu();
  
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [noCutlery, setNoCutlery] = useState(false); 
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false); 
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ discountAmount: number; message: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [paymentModalData, setPaymentModalData] = useState<{ url: string; reference: string } | null>(null);

  const { width } = useWindowDimensions();
  const cardWidth = width - scale(40); 
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTabPress = (method: 'delivery' | 'pickup') => {
    setDeliveryMethod(method);
    const index = method === 'delivery' ? 0 : 1;
    scrollViewRef.current?.scrollTo({ x: index * cardWidth, animated: true });
  };

  const handleHorizontalScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);
    const newMethod = index === 0 ? 'delivery' : 'pickup';
    if (deliveryMethod !== newMethod) {
      setDeliveryMethod(newMethod);
    }
  };

  const handleCutleryToggle = (newValue: boolean) => {
    setNoCutlery(newValue);
    const CUTLERY_NOTE = "No cutlery required.";
    
    if (newValue) {
      setOrderNote(prev => {
        if (prev.includes(CUTLERY_NOTE)) return prev;
        return prev.trim() ? `${prev.trim()} - ${CUTLERY_NOTE}` : CUTLERY_NOTE;
      });
    } else {
      setOrderNote(prev => prev.replace(` - ${CUTLERY_NOTE}`, '').replace(CUTLERY_NOTE, '').trim());
    }
  };

  const bottomNavHeight = scale(70) + Math.max(insets.bottom, scale(15));

  const checkoutItems = useMemo(() => {
    if (params.instantReorder) {
      try {
        const decoded = decodeURIComponent(params.instantReorder as string);
        return JSON.parse(decoded);
      } catch (e) {
        console.warn("Failed to parse instant reorder items", e);
      }
    }

    if (params.selectedItems) {
      try {
        const selectedIds = JSON.parse(params.selectedItems as string);
        return cartItems.filter(item => selectedIds.includes(item.id));
      } catch (e) {
        console.warn("Failed to parse selected items", e);
      }
    }
    return cartItems;
  }, [params.instantReorder, params.selectedItems, cartItems]);

  const subtotal = checkoutItems.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);
  
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
      } catch {
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

  const verifyPayment = async (reference: string, isAutoDetect: boolean = false) => {
    setPaymentModalData(null); 
    setIsProcessing(true);     
    
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let verified = false;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const verifyRes = await api.get(`/api/payments/verify/${reference}`);
        if (verifyRes.data.status === 'successful' || verifyRes.data.data?.status === 'success') {
          verified = true;
          break;
        }
      } catch {
      }
      if (attempt < 3) await wait(2500); 
    }

    setIsProcessing(false);

    if (verified) {
      if (!params.instantReorder) {
        removeMultipleFromCart(checkoutItems.map((item: any) => item.id));
      }
      setActiveAddress(null); 
      DeviceEventEmitter.emit('ORDER_PLACED');
      Alert.alert('Payment Successful!', 'Your food is confirmed and processing.');
      router.replace('/my-orders');
    } else {
      DeviceEventEmitter.emit('ORDER_PLACED');
      Alert.alert(
        isAutoDetect ? 'Verifying Payment...' : 'Payment Incomplete', 
        'Your payment has not reflected yet. If you paid, check My Orders shortly for the latest status.'
      );
      router.replace('/my-orders');
    }
  };

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) return;

    if (deliveryMethod === 'delivery' && !activeAddress) {
      Alert.alert('Address Required', 'Please select a delivery address before placing your order.');
      return;
    }

    setIsProcessing(true);

    try {
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
      const order = orderRes.data.order || orderRes.data.data || orderRes.data;

      if (!order || (!order.id && !order._id)) {
        throw new Error(`Missing Order ID from backend. Response: ${JSON.stringify(orderRes.data)}`);
      }

      const actualOrderId = order.id || order._id;

      const paymentRes = await api.post('/api/payments/initialize', { orderId: actualOrderId });
      
      const paymentUrl = paymentRes.data.paymentUrl || paymentRes.data.data?.authorization_url || paymentRes.data.authorization_url;
      const reference = paymentRes.data.reference || paymentRes.data.data?.reference;

      if (!paymentUrl) {
        throw new Error(`Missing Paystack URL. Response: ${JSON.stringify(paymentRes.data)}`);
      }

      try {
        setPaymentModalData({ url: paymentUrl, reference: reference });
      } catch (browserError) {
        console.warn("WebBrowser rejected, falling back to Native Linking:", browserError);
        await Linking.openURL(paymentUrl);
      }
      
    } catch (err: any) {
      console.log("CHECKOUT ERROR:", err);
      let errorMsg = 'Something went wrong.';
      
      if (err.response) {
        const backendMsg = err.response.data?.message || err.response.data?.error || JSON.stringify(err.response.data);
        errorMsg = `Backend Error (${err.response.status}): \n\n${backendMsg}`;
      } else {
        errorMsg = `App Error: \n\n${err.message}`;
      }

      Alert.alert('Checkout Diagnostic', errorMsg);
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
            <HomeIcon onPress={() => router.push('/(tabs)')} />
          </View>
        }
        isAbsolute={false} 
        showDivider={false} 
        isScrolled={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavHeight + scale(60) }]}>
        
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORDER FULFILLMENT</Text>
        
        <View style={[styles.methodToggleContainer, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}>
          <TouchableOpacity 
            style={[
              styles.methodToggleBtn, 
              deliveryMethod === 'delivery' ? [styles.methodToggleBtnActive, { backgroundColor: Colors.primary }] : null
            ]}
            onPress={() => handleTabPress('delivery')}
            activeOpacity={0.8}
          >
            <Ionicons name="bicycle" size={scale(18)} color={deliveryMethod === 'delivery' ? '#FFF' : colors.textMuted} />
            <Text style={[styles.methodToggleText, { color: deliveryMethod === 'delivery' ? '#FFF' : colors.textMuted }]}>Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.methodToggleBtn, 
              deliveryMethod === 'pickup' ? [styles.methodToggleBtnActive, { backgroundColor: Colors.primary }] : null
            ]}
            onPress={() => handleTabPress('pickup')}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront" size={scale(18)} color={deliveryMethod === 'pickup' ? '#FFF' : colors.textMuted} />
            <Text style={[styles.methodToggleText, { color: deliveryMethod === 'pickup' ? '#FFF' : colors.textMuted }]}>Pick Up</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { padding: 0, overflow: 'hidden', backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleHorizontalScroll}
          >
            <View style={{ width: cardWidth, padding: scale(15) }}>
              <View style={styles.addressRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(229, 57, 53, 0.1)' }]}>
                  <Ionicons name="location" size={scale(24)} color={Colors.primary} />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={[styles.addressTitle, { color: colors.text }]} numberOfLines={1}>
                    {(activeAddress as any)?.title || (activeAddress as any)?.label || "No address selected"}
                  </Text>
                  <Text style={[styles.addressDetail, { color: colors.textMuted }]} numberOfLines={1}>
                    {activeAddress ? [(activeAddress as any)?.address || (activeAddress as any)?.streetAddress, (activeAddress as any)?.area].filter(Boolean).join(', ') : "Please add a delivery address"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsAddressModalVisible(true)}>
                  <Text style={styles.editText}>Change</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: scale(15) }]} />
              
              <TextInput
                style={[styles.noteInput, { backgroundColor: isDark ? colors.background : '#F5F5F5', color: colors.text, borderColor: colors.border }]}
                placeholder="Add delivery note (e.g., Leave at the gate)"
                placeholderTextColor={colors.textMuted}
                value={orderNote}
                onChangeText={setOrderNote}
              />
            </View>

            <View style={{ width: cardWidth, padding: scale(15) }}>
              <View style={styles.addressRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Ionicons name="storefront" size={scale(24)} color="#4CAF50" />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={[styles.addressTitle, { color: colors.text }]}>Bwari Kitchen Main Branch</Text>
                  <Text style={[styles.addressDetail, { color: colors.textMuted }]}>No 1 Kitchen Avenue, Central FCT</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: scale(15) }]} />
              
              <TextInput
                style={[styles.noteInput, { backgroundColor: isDark ? colors.background : '#F5F5F5', color: colors.text, borderColor: colors.border }]}
                placeholder="Add pickup note (e.g., Arriving in 20 mins)"
                placeholderTextColor={colors.textMuted}
                value={orderNote}
                onChangeText={setOrderNote}
              />
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: scale(15), paddingBottom: scale(15) }}>
            <View style={[styles.divider, { backgroundColor: colors.border, marginBottom: scale(15) }]} />
            <View style={styles.ecoRow}>
              <View style={styles.ecoTextWrap}>
                <Text style={[styles.ecoTitle, { color: colors.text }]}>No Cutlery Required</Text>
                <Text style={[styles.ecoSub, { color: colors.textMuted }]}>Help us reduce plastic waste</Text>
              </View>
              <Switch 
                value={noCutlery} 
                onValueChange={handleCutleryToggle} 
                trackColor={{ false: '#767577', true: '#81C784' }} 
                thumbColor={noCutlery ? '#388E3C' : '#f4f3f4'} 
              />
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PAYMENT METHOD</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.paymentOption}>
            <View style={[styles.paymentIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="card" size={scale(20)} color="#9C27B0" />
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={[styles.paymentTitle, { color: colors.text }]}>Card, Bank Transfer or USSD</Text>
              <Text style={[styles.paymentSub, { color: colors.textMuted }]}>Choose your preferred option on the next screen — secured by Paystack</Text>
            </View>
            <Ionicons name="radio-button-on" size={scale(24)} color={Colors.primary} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROMO CODE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: scale(10) }]}>
          <TextInput
            style={[styles.noteInput, { flex: 1, backgroundColor: isDark ? colors.background : '#F5F5F5', color: colors.text, borderColor: colors.border }]}
            placeholder="Enter promo code"
            placeholderTextColor={colors.textMuted}
            value={promoCode}
            onChangeText={(text) => { setPromoCode(text); setPromoResult(null); }}
            autoCapitalize="characters"
          />
          <TouchableOpacity onPress={handleApplyPromo} disabled={applyingPromo || !promoCode.trim()} style={{ backgroundColor: Colors.primary, paddingHorizontal: scale(18), paddingVertical: scale(12), borderRadius: scale(12), opacity: applyingPromo || !promoCode.trim() ? 0.5 : 1 }}>
            {applyingPromo ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Apply</Text>}
          </TouchableOpacity>
        </View>
        {promoResult && (
          <Text style={{ color: '#4CAF50', fontSize: scale(13), marginTop: -scale(18), marginBottom: scale(20), marginLeft: scale(5), fontWeight: '600' }}>
            ✓ {promoResult.message} — ₦{promoResult.discountAmount.toLocaleString()} off
          </Text>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORDER SUMMARY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {checkoutItems.map((item: any) => (
            <View key={item.id} style={[styles.summaryItemContainer, { borderBottomColor: colors.border }]}>
              <View style={styles.summaryItemRow}>
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

              {/* DYNAMIC MULTIPLIED SUB-ITEMS */}
              {item.subItems && item.subItems.length > 0 && (
                <View style={styles.subItemsList}>
                  {item.subItems.map((sub: any, subIdx: number) => {
                    const dbItem = sub.id ? findItem(sub.id) : null;
                    
                    // Multiply base qty by package qty
                    const baseSubQty = sub.qty ?? sub.quantity ?? 1;
                    const mainPkgQty = item.quantity || 1;
                    const displayQty = baseSubQty * mainPkgQty;
                    
                    const unitPrice = (sub.price !== undefined && sub.price !== null)
                      ? sub.price
                      : ((sub.unitPrice !== undefined && sub.unitPrice !== null)
                        ? sub.unitPrice
                        : (dbItem?.basePrice ?? 0));
                        
                    // Multiply base unit price by the scaled up quantity
                    const displayPrice = unitPrice * displayQty;
                    const name = sub.name || sub.itemName || dbItem?.name || 'Item';

                    return (
                      <View key={subIdx} style={styles.subItemRow}>
                        <Text style={[styles.subItemText, { color: colors.textMuted }]} numberOfLines={1}>
                          • {displayQty}x {name}
                        </Text>
                        <Text style={[styles.subItemPrice, { color: colors.textMuted }]}>
                          ₦{displayPrice.toLocaleString()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
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
          paddingBottom: insets.bottom + scale(20), 
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

      <Modal 
        visible={!!paymentModalData} 
        animationType="slide" 
        onRequestClose={() => paymentModalData && verifyPayment(paymentModalData.reference, false)}
      >
        <View style={[styles.webViewContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          
          <View style={[styles.webViewHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.webViewTitle, { color: colors.text }]}>Secured by Paystack</Text>
            <TouchableOpacity 
              onPress={() => paymentModalData && verifyPayment(paymentModalData.reference, false)} 
              style={styles.webViewCloseBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.webViewCloseText}>Close & Verify</Text>
            </TouchableOpacity>
          </View>

          {paymentModalData && (
            <WebView 
              source={{ uri: paymentModalData.url }}
              style={styles.webView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoader}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}
              onNavigationStateChange={(navState) => {
                if (
                  navState.url.includes('payment-complete') || 
                  navState.url.includes('callback') || 
                  navState.url.includes('success')
                ) {
                  verifyPayment(paymentModalData.reference, true);
                }
              }}
            />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: scale(10), alignItems: 'center' },
  scrollContent: { paddingTop: scale(20), paddingHorizontal: scale(20) },
  sectionTitle: { fontSize: scale(12), fontWeight: 'bold', marginBottom: scale(10), marginLeft: scale(5), letterSpacing: 1 },
  methodToggleContainer: { flexDirection: 'row', borderRadius: scale(15), padding: scale(5), marginBottom: scale(15) },
  methodToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: scale(12), borderRadius: scale(12) },
  methodToggleBtnActive: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.1, shadowRadius: scale(4) },
  methodToggleText: { fontSize: scale(14), fontWeight: 'bold', marginLeft: scale(8) },
  card: { borderRadius: scale(20), borderWidth: 1, padding: scale(15), marginBottom: scale(25), elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.1, shadowRadius: scale(5) },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: scale(44), height: scale(44), borderRadius: scale(22), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  addressTextContainer: { flex: 1, paddingRight: scale(10) },
  addressTitle: { fontSize: scale(16), fontWeight: 'bold', marginBottom: scale(2) },
  addressDetail: { fontSize: scale(13) },
  editText: { color: Colors.primary, fontWeight: 'bold', fontSize: scale(14), padding: scale(5) },
  noteInput: { borderWidth: 1, borderRadius: scale(12), padding: scale(12), fontSize: scale(14), minHeight: scale(45) },
  ecoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoTextWrap: { flex: 1 },
  ecoTitle: { fontSize: scale(15), fontWeight: '600' },
  ecoSub: { fontSize: scale(12), marginTop: scale(2) },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(15) },
  paymentIconBox: { width: scale(40), height: scale(40), borderRadius: scale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  paymentTextContainer: { flex: 1 },
  paymentTitle: { fontSize: scale(16), fontWeight: '600', marginBottom: scale(2) },
  paymentSub: { fontSize: scale(12) },
  
  summaryItemContainer: { borderBottomWidth: 1, paddingVertical: scale(10) },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subItemsList: { paddingLeft: scale(20), marginTop: scale(6), marginBottom: scale(2) },
  subItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(4) },
  subItemText: { fontSize: scale(13), flex: 1, paddingRight: scale(10) },
  subItemPrice: { fontSize: scale(13), fontWeight: '600' },
  
  summaryItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  snText: { fontSize: scale(14), fontWeight: '900', marginRight: scale(8) },
  summaryItemName: { flex: 1, fontSize: scale(15), fontWeight: '500', paddingRight: scale(10) },
  summaryItemPrice: { fontSize: scale(15), fontWeight: 'bold' },
  totalsContainer: { marginTop: scale(15) },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(12) },
  summaryLabel: { fontSize: scale(15) }, 
  summaryValue: { fontSize: scale(15), fontWeight: '600' },
  divider: { height: 1, marginVertical: scale(10) },
  totalLabel: { fontSize: scale(16), fontWeight: 'bold' },
  totalValue: { fontSize: scale(18), fontWeight: 'bold' },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: scale(30), borderTopRightRadius: scale(30), borderTopWidth: 1, paddingTop: scale(20), paddingHorizontal: scale(20), elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: scale(-6) }, shadowOpacity: 0.15, shadowRadius: scale(15) },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTextContainer: { flex: 1 },
  footerTotalLabel: { fontSize: scale(13), marginBottom: scale(2) },
  footerTotalValue: { fontSize: scale(22), fontWeight: 'bold' },
  placeOrderBtn: { backgroundColor: Colors.primary, paddingVertical: scale(15), paddingHorizontal: scale(30), borderRadius: scale(20), elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: scale(4) }, shadowOpacity: 0.3, shadowRadius: scale(5), minWidth: scale(140), alignItems: 'center' },
  placeOrderText: { color: '#FFF', fontSize: scale(16), fontWeight: 'bold' },
  
  webViewContainer: { flex: 1 },
  webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: scale(15), borderBottomWidth: 1 },
  webViewTitle: { fontSize: scale(16), fontWeight: 'bold' },
  webViewCloseBtn: { backgroundColor: 'rgba(211, 47, 47, 0.1)', paddingHorizontal: scale(15), paddingVertical: scale(8), borderRadius: scale(15) },
  webViewCloseText: { color: Colors.primary, fontWeight: 'bold' },
  webView: { flex: 1 },
  webViewLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)' },
});