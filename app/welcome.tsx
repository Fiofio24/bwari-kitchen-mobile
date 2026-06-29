import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeroHeader from '../components/HeroHeader';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background, 
        paddingBottom: insets.bottom + 20 
      }
    ]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* REUSABLE HERO SECTION */}
      <HeroHeader 
        heightRatio={0.55} 
        logoPaddingBottom={25} 
      />

      {/* CENTER BRANDING */}
      <View style={styles.brandSection}>
        <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
          Premium meals. Rapid delivery..
        </Text>
      </View>

      {/* BOTTOM ACTION BUTTONS */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: Colors.primary }]} 
          onPress={() => router.push('/signup')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            Create an Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.secondaryBtn, 
            { 
              borderColor: colors.border, 
              backgroundColor: isDark ? colors.surface : '#FFF' 
            }
          ]} 
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            Log In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  brandSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  actionSection: {
    width: '100%',
    paddingHorizontal: 25,
    paddingBottom: 10,
    zIndex: 1,
  },
  primaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});