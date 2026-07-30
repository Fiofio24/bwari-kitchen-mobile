import React from 'react';
import { 
  View, 
  Image, 
  ImageBackground, 
  StyleSheet, 
  useWindowDimensions 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface HeroHeaderProps {
  heightRatio?: number;
  logoPath?: any;
  bgImagePath?: any;
  logoPaddingBottom?: number;
}

export default function HeroHeader({
  heightRatio = 0.55,
  logoPath = require('../assets/splash.png'),
  bgImagePath = require('../assets/RicePack.jpg'),
  logoPaddingBottom = scale(25) // Scaled default
}: HeroHeaderProps) {
  const { width, height } = useWindowDimensions();
  const { isDark } = useTheme();

  const heroHeight = height * heightRatio;

  return (
    <View style={[styles.heroContainer, { height: heroHeight }]}>
      
      {/* The Outer Red Curve (Acts as the thick red bottom border) */}
      <View style={[
        styles.redCurveShape, 
        { 
          width: width * 1.5, 
          height: heroHeight, 
          borderBottomLeftRadius: width * 0.75, 
          borderBottomRightRadius: width * 0.75 
        }
      ]} />
      
      {/* The Inner Image Curve (15px shorter to reveal the red border underneath) */}
      <View style={[
        styles.imageCurveShape, 
        { 
          width: width * 1.5, 
          height: heroHeight - scale(15), 
          borderBottomLeftRadius: width * 0.75, 
          borderBottomRightRadius: width * 0.75 
        }
      ]}>
        <ImageBackground 
          source={bgImagePath}
          style={styles.heroBgImage}
          resizeMode="cover"
        >
          {/* DYNAMIC OVERLAY: Dark in Dark Mode, Lightish Red in Light Mode */}
          <View style={[
            styles.heroOverlay, 
            { 
              backgroundColor: isDark ? 'rgba(31, 0, 0, 0.65)' : 'rgba(255, 219, 219, 0.65)',
              paddingBottom: logoPaddingBottom
            }
          ]}>
            <Image 
              source={logoPath} 
              style={[styles.logoImage, { tintColor: Colors.primary }]} 
              resizeMode="contain" 
            />
          </View>
        </ImageBackground>
      </View>

    </View>
  );
}

// PRO CSS COMPLIANCE: Every property strictly on its own line
const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 1000,
  },
  redCurveShape: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    // backgroundColor: Colors.primary,
  },
  imageCurveShape: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  heroBgImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoImage: {
    width: scale(200),
    height: scale(110),
  },
});