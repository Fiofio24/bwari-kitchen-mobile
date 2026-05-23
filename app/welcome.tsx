import React from 'react';
import { 
  ScrollView,
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ImageBackground,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background, 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom + 20 
      }
    ]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TOP DECORATION: Circular Background + Food Watermark + Logo */}
        <View style={styles.topDecoration}>
          <ImageBackground 
            source={require('../assets/RicePack.jpg')}
            style={styles.circleDeco}
            imageStyle={{ opacity: 0.15, borderRadius: width * 0.6 }}
          >
            <View style={[
              styles.circleDeco, 
              { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(211,0,0,0.05)' }
            ]}>
              {/* LOGO CONTAINER: Red-tinted logo centered inside circle */}
              <Image 
                source={require('../assets/splash.png')} 
                style={[styles.logoImage, { tintColor: Colors.primary }]} 
                resizeMode="contain" 
              />
            </View>
          </ImageBackground>
        </View>

        {/* CENTER BRANDING: Subtitle positioned below the circle */}
        <View style={styles.brandSection}>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            Premium meals. Rapid delivery.
          </Text>
        </View>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 20,
  },
  topDecoration: {
    width: width,
    alignItems: 'center',
    marginTop: -width * 0.5,
  },
  circleDeco: {
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  logoImage: {
    width: '30%',
    height: '30%',
  },
  brandSection: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brandSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 10,
    fontWeight: '500',
  },
  actionSection: {
    width: '100%',
    paddingHorizontal: 25,
    paddingBottom: 10,
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