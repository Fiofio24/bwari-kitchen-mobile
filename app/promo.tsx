import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import TopNav from '../components/TopNav';
import api from './lib/api';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE
import HomeIcon from '../components/HomeIcon';

interface Promo {
  id: string;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo';
  value: number;
  minOrderAmount: number;
  validUntil: string | null;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  percentage: { icon: 'pricetag', color: '#FF9800' },
  fixed: { icon: 'cash', color: '#9C27B0' },
  free_delivery: { icon: 'bicycle', color: '#4CAF50' },
  bogo: { icon: 'gift', color: '#E91E63' },
};

const formatValue = (promo: Promo) => {
  switch (promo.type) {
    case 'percentage': return `${promo.value}% Off`;
    case 'fixed': return `₦${promo.value.toLocaleString()} Off`;
    case 'free_delivery': return 'Free Delivery';
    case 'bogo': return 'Buy One Get One';
    default: return '';
  }
};

export default function PromoScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPromos = async () => {
    try {
      const res = await api.get('/api/promotions');
      setPromos(res.data.promos);
    } catch (err) {
      console.warn('Failed to load promos:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPromos().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPromos();
    setRefreshing(false);
  };

  const handleCopyCode = async (code: string, id: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Offers & Promo"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightComponent={
          <View style={styles.headerRight}>
            <HomeIcon onPress={() => router.push('/(tabs)')} />
          </View>
        }
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: scale(60) }} />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(40) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AVAILABLE OFFERS</Text>

          {promos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={scale(40)} color={colors.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No offers available right now. Check back soon!</Text>
            </View>
          ) : (
            promos.map((promo) => {
              const meta = TYPE_META[promo.type] || TYPE_META.percentage;
              return (
                <View key={promo.id} style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.colorBar, { backgroundColor: meta.color }]} />
                  
                  <View style={styles.promoContent}>
                    <View style={styles.promoHeader}>
                      <View style={[styles.iconBox, { backgroundColor: `${meta.color}20` }]}>
                        <Ionicons name={meta.icon as any} size={scale(20)} color={meta.color} />
                      </View>
                      <View style={styles.titleWrap}>
                        <Text style={[styles.promoTitle, { color: colors.text }]}>{formatValue(promo)}</Text>
                        {promo.validUntil && (
                          <Text style={[styles.validText, { color: colors.textMuted }]}>
                            Valid till {new Date(promo.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </Text>
                        )}
                      </View>
                    </View>

                    {promo.description && (
                      <Text style={[styles.promoDesc, { color: colors.textMuted }]}>
                        {promo.description}
                      </Text>
                    )}

                    {promo.minOrderAmount > 0 && (
                      <Text style={[styles.minOrderText, { color: colors.textMuted }]}>
                        Minimum order: ₦{promo.minOrderAmount.toLocaleString()}
                      </Text>
                    )}

                    <View style={[styles.dashedLine, { borderColor: colors.border }]} />

                    <View style={styles.bottomRow}>
                      <View style={[styles.codeBox, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                        <Text style={[styles.codeText, { color: colors.text }]} numberOfLines={1}>{promo.code}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.copyIconBtn, copiedId === promo.id && { backgroundColor: '#4CAF50' }]} 
                        onPress={() => handleCopyCode(promo.code, promo.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={copiedId === promo.id ? "checkmark" : "copy-outline"} 
                          size={scale(20)} 
                          color="#FFF" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { 
    flexDirection: 'row', 
    gap: scale(10), 
    alignItems: 'center',
  },
  scrollContent: { paddingTop: scale(20), paddingHorizontal: scale(20) },
  sectionTitle: { fontSize: scale(12), fontWeight: 'bold', marginBottom: scale(15), marginLeft: scale(5), letterSpacing: 1.5 },
  promoCard: { flexDirection: 'row', borderRadius: scale(20), borderWidth: 1, marginBottom: scale(20), overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: scale(4) }, shadowOpacity: 0.1, shadowRadius: scale(6) },
  colorBar: { width: scale(8), height: '100%' },
  promoContent: { flex: 1, padding: scale(20) },
  promoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(12) },
  iconBox: { width: scale(40), height: scale(40), borderRadius: scale(12), justifyContent: 'center', alignItems: 'center', marginRight: scale(15) },
  titleWrap: { flex: 1 },
  promoTitle: { fontSize: scale(17), fontWeight: 'bold', marginBottom: scale(2) },
  validText: { fontSize: scale(12) },
  promoDesc: { fontSize: scale(14), lineHeight: scale(20), marginBottom: scale(10) },
  minOrderText: { fontSize: scale(12), fontWeight: '600', marginBottom: scale(10) },
  dashedLine: { borderBottomWidth: 1, borderStyle: 'dashed', marginBottom: scale(20) },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeBox: { flex: 1, marginRight: scale(15), paddingVertical: scale(12), paddingHorizontal: scale(15), borderRadius: scale(12), borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  codeText: { fontSize: scale(15), fontWeight: '900', letterSpacing: 2 },
  copyIconBtn: { width: scale(46), height: scale(46), backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: scale(12) },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: scale(40) },
  emptyText: { fontSize: scale(14), marginTop: scale(10), textAlign: 'center', paddingHorizontal: scale(30) },
});