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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';

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
  const router = useRouter();
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
      case 'chat':
        Alert.alert('Live Chat', 'Connecting you to the next available agent...');
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* UNIVERSAL TOPNAV WITH SHADOW */}
      <TopNav 
        title="Help & Support"
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        isAbsolute={false} 
        isScrolled={true}
        showDivider={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        
        {/* GREETING */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            Hi {userData.name.split(' ')[0]},
          </Text>
          <Text style={[styles.greetingSub, { color: colors.textMuted }]}>
            How can we help you today?
          </Text>
        </View>

        {/* QUICK CONTACT CARDS */}
        <View style={styles.contactGrid}>
          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: isDark ? colors.surface : '#FFF9E6', borderColor: '#FFC107' }]}
            activeOpacity={0.8}
            onPress={() => handleContact('chat')}
          >
            <View style={[styles.contactIconBox, { backgroundColor: '#FFC107' }]}>
              <Ionicons name="chatbubbles" size={24} color="#FFF" />
            </View>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Live Chat</Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>Typical reply: 2m</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: isDark ? colors.surface : '#E8F5E9', borderColor: '#4CAF50' }]}
            activeOpacity={0.8}
            onPress={() => handleContact('call')}
          >
            <View style={[styles.contactIconBox, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="call" size={24} color="#FFF" />
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
            <Ionicons name="mail" size={24} color={Colors.primary} />
          </View>
          <View style={styles.emailTextWrap}>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Send an Email</Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>support@bwarikitchen.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* FAQ SECTION */}
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
                    size={20} 
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

        {/* LEGAL LINKS */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 10 }]}>
          LEGAL & POLICIES
        </Text>
        <View style={[styles.legalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.legalItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.textMuted} style={styles.legalIcon} />
            <Text style={[styles.legalText, { color: colors.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} style={styles.legalIcon} />
            <Text style={[styles.legalText, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
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
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  greetingSection: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 15,
  },
  contactCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  contactIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactSub: {
    fontSize: 12,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  emailIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emailTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
    letterSpacing: 1.5,
  },
  faqContainer: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
  },
  faqItem: {
    padding: 20,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    paddingRight: 15,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 15,
    paddingRight: 10,
  },
  legalContainer: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  legalIcon: {
    marginRight: 15,
  },
  legalText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});