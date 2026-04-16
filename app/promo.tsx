// Note: This file requires an Expo/React Native environment to compile correctly.
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Platform,
  Alert,
//   Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const PROMO_DATA = [
  {
    id: '1',
    code: 'BWARI20',
    title: '20% Off Your Order',
    description: 'Get 20% off all orders above ₦5,000. Maximum discount ₦2,000.',
    validUntil: 'April 30, 2026',
    icon: 'restaurant',
    color: '#FF9800'
  },
  {
    id: '2',
    code: 'FREEDEL',
    title: 'Free Delivery',
    description: 'Enjoy zero delivery fees on your next 3 orders within Bwari area.',
    validUntil: 'April 20, 2026',
    icon: 'bicycle',
    color: '#4CAF50'
  },
  {
    id: '3',
    code: 'WEEKEND500',
    title: '₦500 Weekend Awoof',
    description: 'Flat ₦500 discount on any meal combo ordered this weekend.',
    validUntil: 'April 19, 2026',
    icon: 'gift',
    color: '#9C27B0'
  }
];

export default function PromoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [inputCode, setInputCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const paddingTop = Platform.OS === 'web' ? 50 : insets.top + 10;
  const paddingBottom = 15;

  const handleApplyInput = () => {
    if (!inputCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code first.');
      return;
    }
    Alert.alert('Applying Promo', `Checking validity for ${inputCode.toUpperCase()}...`);
    // Simulate backend check
    setTimeout(() => {
      Alert.alert('Invalid Code', 'This promo code does not exist or has expired.');
      setInputCode('');
    }, 1500);
  };

  const handleCopyCode = (code: string, id: string) => {
    // In a real app, you'd use expo-clipboard here: Clipboard.setStringAsync(code);
    setCopiedId(id);
    Alert.alert('Code Copied!', `${code} is copied to your clipboard.`);
    setTimeout(() => {
      setCopiedId(null);
    }, 3000);
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
          <Text style={styles.headerTitle}>Offers & Promo</Text>
        </View>
        <View style={styles.sideIcon} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        
        {/* INPUT SECTION */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Have a Promo Code?</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5', borderColor: colors.border }]}>
              <Ionicons name="ticket-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Enter code here"
                placeholderTextColor={colors.textMuted}
                value={inputCode}
                onChangeText={setInputCode}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity 
              style={[styles.applyBtn, { opacity: inputCode.length > 2 ? 1 : 0.5 }]} 
              disabled={inputCode.length <= 2}
              onPress={handleApplyInput}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROMO LIST */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AVAILABLE OFFERS</Text>

        {PROMO_DATA.map((promo) => (
          <View key={promo.id} style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Left Color Bar */}
            <View style={[styles.colorBar, { backgroundColor: promo.color }]} />
            
            <View style={styles.promoContent}>
              <View style={styles.promoHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${promo.color}20` }]}>
                  <Ionicons name={promo.icon as any} size={20} color={promo.color} />
                </View>
                <View style={styles.titleWrap}>
                  <Text style={[styles.promoTitle, { color: colors.text }]}>{promo.title}</Text>
                  <Text style={[styles.validText, { color: colors.textMuted }]}>Valid till {promo.validUntil}</Text>
                </View>
              </View>

              <Text style={[styles.promoDesc, { color: colors.textMuted }]}>
                {promo.description}
              </Text>

              <View style={[styles.dashedLine, { borderColor: colors.border }]} />

              <View style={styles.bottomRow}>
                <View style={[styles.codeBox, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                  <Text style={[styles.codeText, { color: colors.text }]}>{promo.code}</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.copyBtn, copiedId === promo.id && { backgroundColor: '#4CAF50' }]} 
                  onPress={() => handleCopyCode(promo.code, promo.id)}
                >
                  <Text style={styles.copyBtnText}>
                    {copiedId === promo.id ? 'Copied!' : 'Copy Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>More offers coming soon!</Text>
        </View>

      </ScrollView>
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
  inputCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginRight: 10,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
    letterSpacing: 1.5,
  },
  promoCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  colorBar: {
    width: 8,
    height: '100%',
  },
  promoContent: {
    flex: 1,
    padding: 20,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleWrap: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  validText: {
    fontSize: 12,
  },
  promoDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBox: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
  },
});