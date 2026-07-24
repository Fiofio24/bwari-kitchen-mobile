import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* BACKGROUND IMAGE */}
      <ImageBackground 
        source={require('../assets/RicePack.jpg')} // Make sure you have a nice high-res image here
        style={styles.bgImage}
        resizeMode="cover"
      >
        {/* SEMI-TRANSPARENT OVERLAY FOR LEGIBILITY BEFORE THE BLUR */}
        <View style={styles.darkOverlay} />

        {/* PUSH CONTENT TO BOTTOM */}
        <View style={{ flex: 1 }} />

        {/* BOTTOM HALF BLURRED DOME CONTAINER */}
        <View style={styles.domeWrapper}>
          <View style={styles.domeClip}>
            
            {/* PLATFORM-SPECIFIC BLUR */}
            {Platform.OS === 'android' ? (
              <View style={[styles.blurView, { backgroundColor: 'rgba(25, 10, 5, 0.85)' }]} />
            ) : (
              <BlurView intensity={80} tint="dark" style={styles.blurView} />
            )}

            {/* CONTENT INNER CONTAINER */}
            {/* Notice the paddingBottom here fixes the minimize bar issue! */}
            <View style={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
              
              {/* LOGO */}
              <View style={styles.logoWrapper}>
                <Image 
                  source={require('../assets/splash.png')} // Replace with your exact red logo path if needed
                  style={styles.logoIcon}
                  resizeMode="contain"
                />
              </View>

              {/* TWO-TONE WELCOME TEXT */}
              <Text style={styles.welcomeTextRow}>
                <Text style={styles.textRed}>Wel</Text>
                <Text style={styles.textWhite}>come to</Text>
              </Text>
              <Text style={styles.brandTitle}>Bwari Kitchen Mobile</Text>

              {/* SUBTLE DIVIDER */}
              <View style={styles.divider} />

              {/* SUBTITLE */}
              <Text style={styles.descriptionText}>
                Create an account to get the best meals{'\n'}at your comfort zone.
              </Text>

              {/* ACTION BUTTONS */}
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
                  style={styles.secondaryBtn} 
                  onPress={() => router.push('/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>
                    Login
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  // MAGIC DOME TRICK
  domeWrapper: {
    width: width,
    alignItems: 'center',
    overflow: 'visible',
  },
  domeClip: {
    // Make the clip wider than the screen to create a perfect arc
    width: width * 1.5,
    borderTopLeftRadius: width * 0.75,
    borderTopRightRadius: width * 0.75,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 40, 
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    // Constrain inner content back to standard screen width
    width: width,
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  // INTERNAL ELEMENTS
  logoWrapper: {
    marginBottom: 10,
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    tintColor: Colors.primary, // Applies the red color to the logo
  },
  welcomeTextRow: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: -5, 
  },
  textRed: {
    color: Colors.primary,
  },
  textWhite: {
    color: '#FFF',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  divider: {
    width: '70%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  actionSection: {
    width: '100%',
    gap: 15,
  },
  primaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    borderRadius: 30,
    backgroundColor: 'rgba(40, 40, 40, 0.8)', // Dark translucent button from design
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});