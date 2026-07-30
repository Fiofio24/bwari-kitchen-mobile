import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  LayoutAnimation,
  Linking,
  Alert
} from 'react-native';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

const FAQ_DATA = [
  {
    id: '1',
    question: 'Where is my order?',
    answer: 'You can track your order in real-time by going to the "My Orders" tab. If your order is delayed beyond the estimated time, please use the Live Chat option to speak with support.'
  },
  {
    id: '2',
    question: 'Can I cancel or change my order?',
    answer: 'Orders can only be cancelled or modified while they are in the "Pending" state. Once the restaurant accepts and starts preparing your food, cancellations are no longer possible.'
  },
  {
    id: '3',
    question: 'I received the wrong item. What do I do?',
    answer: 'We apologize for the mix-up! Please take a picture of the food you received and contact our Live Chat support immediately so we can process a refund or replacement.'
  },
  {
    id: '4',
    question: 'How do I use a promo code?',
    answer: 'You can enter your promo code in the "Offers & Promo" section from the sidebar, or directly apply it during the Checkout process before making your payment.'
  },
  {
    id: '5',
    question: 'What are your delivery hours?',
    answer: 'Bwari Kitchen delivers hot and fresh meals from 7:00 AM to 10:00 PM, Monday through Sunday.'
  }
];

export default function HelpScreen() {
  const router = useSafeRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userData } = useUser();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContact = (method: string) => {
    if (Platform.OS === 'web') {
      window.alert(`Opening ${method}...`);
      return;
    }
    
    switch (method) {
      case 'call':
        Linking.openURL('tel:+2348000000000').catch(() => Alert.alert('Error', 'Unable to open dialer.'));
        break;
      case 'email':
        Linking.openURL('mailto:support@bwarikitchen.com?subject=App Support').catch(() => Alert.alert('Error', 'Unable to open email client.'));
        break;
      case 'chat': {
        const phone = '2349123901489';
        const message = encodeURIComponent('Hi, I have enquiries/complaints.');
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        Linking.openURL(whatsappUrl).catch(() => Alert.alert('Error', 'Unable to open WhatsApp. Please make sure it is installed.'));
        break;
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <TopNav 
        title="Help & Support"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + scale(40) }]}>
        
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            Hi {userData.name.split(' ')[0]},
          </Text>
          <Text style={[styles.greetingSub, { color: colors.textMuted }]}>
            How can we help you today?
          </Text>
        </View>

        <View style={styles.contactGrid}>
          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: isDark ? colors.surface : '#FFF9E6', borderColor: '#FFC107' }]}
            activeOpacity={0.8}
            onPress={() => handleContact('chat')}
          >
            <View style={[styles.contactIconBox, { backgroundColor: '#FFC107' }]}>
              <Ionicons name="chatbubbles" size={scale(24)} color="#FFF" />
            </View>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Chat us on WhatsApp</Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>Chat with our team</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: isDark ? colors.surface : '#E8F5E9', borderColor: '#4CAF50' }]}
            activeOpacity={0.8}
            onPress={() => handleContact('call')}
          >
            <View style={[styles.contactIconBox, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="call" size={scale(24)} color="#FFF" />
            </View>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Call Us</Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>Toll-free line</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.emailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => handleContact('email')}
        >
          <View style={[styles.emailIconBox, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
            <Ionicons name="mail" size={scale(24)} color={Colors.primary} />
          </View>
          <View style={styles.emailTextWrap}>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Send an Email</Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>support@bwarikitchen.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={scale(20)} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>

        <View style={[styles.faqContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {FAQ_DATA.map((faq, index) => {
            const isExpanded = expandedId === faq.id;
            const isLast = index === FAQ_DATA.length - 1;

            return (
              <TouchableOpacity 
                key={faq.id} 
                style={[
                  styles.faqItem, 
                  !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                activeOpacity={0.7}
                onPress={() => toggleFaq(faq.id)}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={[
                    styles.faqQuestionText, 
                    { color: isExpanded ? Colors.primary : colors.text }
                  ]}>
                    {faq.question}
                  </Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={scale(20)} 
                    color={isExpanded ? Colors.primary : colors.textMuted} 
                  />
                </View>
                
                {isExpanded && (
                  <Text style={[styles.faqAnswerText, { color: colors.textMuted }]}>
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: scale(10) }]}>
          LEGAL & POLICIES
        </Text>
        <View style={[styles.legalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.legalItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => Alert.alert('Coming Soon', 'Our Terms of Service will be available here shortly.')}
          >
            <Ionicons name="document-text-outline" size={scale(20)} color={colors.textMuted} style={styles.legalIcon} />
            <Text style={[styles.legalText, { color: colors.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={scale(18)} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => Alert.alert('Coming Soon', 'Our Privacy Policy will be available here shortly.')}
          >
            <Ionicons name="shield-checkmark-outline" size={scale(20)} color={colors.textMuted} style={styles.legalIcon} />
            <Text style={[styles.legalText, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={scale(18)} color={colors.border} />
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  greetingSection: {
    marginBottom: scale(25),
    paddingHorizontal: scale(5),
  },
  greetingTitle: {
    fontSize: scale(28),
    fontWeight: '900',
    marginBottom: scale(4),
  },
  greetingSub: {
    fontSize: scale(16),
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(15),
    gap: scale(15),
  },
  contactCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scale(20),
    padding: scale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
  },
  contactIconBox: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  contactTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: scale(4),
  },
  contactSub: {
    fontSize: scale(12),
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: scale(30),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
  },
  emailIconBox: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  emailTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: scale(12),
    fontWeight: 'bold',
    marginBottom: scale(15),
    marginLeft: scale(5),
    letterSpacing: 1.5,
  },
  faqContainer: {
    borderWidth: 1,
    borderRadius: scale(20),
    overflow: 'hidden',
    marginBottom: scale(25),
  },
  faqItem: {
    padding: scale(20),
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: scale(15),
    fontWeight: '600',
    flex: 1,
    paddingRight: scale(15),
  },
  faqAnswerText: {
    fontSize: scale(14),
    lineHeight: scale(22),
    marginTop: scale(15),
    paddingRight: scale(10),
  },
  legalContainer: {
    borderWidth: 1,
    borderRadius: scale(20),
    overflow: 'hidden',
    marginBottom: scale(20),
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(18),
  },
  legalIcon: {
    marginRight: scale(15),
  },
  legalText: {
    fontSize: scale(15),
    fontWeight: '500',
    flex: 1,
  },
});