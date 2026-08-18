// import React from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Platform, 
//   Linking,
//   Dimensions,
//   Alert
// } from 'react-native';
// import { useSafeRouter } from '../hooks/useSafeRouter';
// import { useTheme } from '../context/ThemeContext';
// import { Colors } from '../constants/Colors';
// import { Ionicons } from '@expo/vector-icons';
// import { scale } from '../constants/Sizes';
// import { StatusBar } from 'expo-status-bar';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as WebBrowser from 'expo-web-browser';

// // Reusing our safe storage wrapper
// const safeStorage = {
//   getItem: async (key: string) => {
//     try {
//       if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
//         return await AsyncStorage.getItem(key);
//       } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
//         return window.localStorage.getItem(key);
//       }
//     } catch (e) { console.warn("Storage Error:", e); }
//     return null;
//   },
//   setItem: async (key: string, value: string) => {
//     try {
//       if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
//         await AsyncStorage.setItem(key, value);
//       } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
//         window.localStorage.setItem(key, value);
//       }
//     } catch (e) { console.warn("Storage Error:", e); }
//   }
// };

// const { width } = Dimensions.get('window');

// export default function BetaIntroScreen() {
//   const router = useSafeRouter();
//   const { colors, isDark } = useTheme();
//   const insets = useSafeAreaInsets();

//   const handleContinue = async () => {
//     // 1. Mark beta as seen so it doesn't show again on every launch
//     await safeStorage.setItem('@bwari_beta_seen', 'true');
    
//     // 2. Route intelligently
//     const savedUser = await safeStorage.getItem('@bwari_kitchen_user_v2');
//     if (savedUser) {
//       router.replace('/unlock');
//     } else {
//       router.replace('/welcome');
//     }
//   };

//   const handleWhatsApp = async () => {
//     const phone = '2348108280855';
//     const message = encodeURIComponent('Hey, \nHere is my feedback on the Bwari Kitchen App:\n\n');
    
//     const appUrl = `whatsapp://send?phone=${phone}&text=${message}`;
//     const webUrl = `https://wa.me/${phone}?text=${message}`;

//     try {
//       // 1. Force the intent directly (Bypasses the Android 11+ visibility block)
//       await Linking.openURL(appUrl);
//     } catch (error) {
//       // 2. If WhatsApp app isn't installed, fallback to standard web link
//       try {
//         await Linking.openURL(webUrl);
//       } catch (fallbackError) {
//         // 3. Absolute worst-case scenario fallback
//         Alert.alert("Error", "Could not open WhatsApp. Please ensure you have a browser or WhatsApp installed.");
//       }
//     }
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
//       <StatusBar style={isDark ? "light" : "dark"} />
      
//       <View style={styles.content}>
        
//         {/* Animated/Styled Icon Container */}
//         <View style={styles.iconWrapper}>
//           <View style={[styles.iconCircle, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
//             <Ionicons name="flask" size={scale(60)} color={Colors.primary} />
//           </View>
//           <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
//             <Text style={styles.badgeText}>TESTING PHASE</Text>
//           </View>
//         </View>

//         <Text style={[styles.title, { color: colors.text }]}>
//           Welcome to the Beta!
//         </Text>
        
//         <Text style={[styles.description, { color: colors.textMuted }]}>
//           You have been granted early access to test the Bwari Kitchen mobile app before it goes live to the public.
//         </Text>

//         {/* Feature Highlights */}
//         <View style={[styles.infoBox, { backgroundColor: isDark ? colors.surface : '#FFF9E6', borderColor: '#FFC107' }]}>
//           <Ionicons name="card" size={scale(24)} color="#FFC107" style={styles.infoIcon} />
//           <View style={styles.infoTextWrap}>
//             <Text style={[styles.infoTitle, { color: colors.text }]}>No Real Money Deducted</Text>
//             <Text style={[styles.infoSub, { color: colors.textMuted }]}>
//               Feel free to build custom packages, apply promos, and place orders. It&apos;s a safe testing environment.
//             </Text>
//           </View>
//         </View>

//         <View style={[styles.infoBox, { backgroundColor: isDark ? colors.surface : '#E8F5E9', borderColor: '#4CAF50' }]}>
//           <Ionicons name="chatbubbles" size={scale(24)} color="#4CAF50" style={styles.infoIcon} />
//           <View style={styles.infoTextWrap}>
//             <Text style={[styles.infoTitle, { color: colors.text }]}>Your Feedback is Golden</Text>
//             <Text style={[styles.infoSub, { color: colors.textMuted }]}>
//               Notice a bug? Have a suggestion? We want to hear it all. Reach out directly to the developers!
//             </Text>
//           </View>
//         </View>
//       </View>

//       <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
        
//         <TouchableOpacity 
//           style={[styles.primaryBtn, { backgroundColor: Colors.primary }]} 
//           onPress={handleContinue}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.primaryBtnText}>Start Testing the App</Text>
//           <Ionicons name="arrow-forward" size={scale(18)} color="#FFF" style={{ marginLeft: scale(8) }} />
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={styles.secondaryBtn} 
//           onPress={handleWhatsApp}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="logo-whatsapp" size={scale(20)} color="#4CAF50" style={{ marginRight: scale(8) }} />
//           <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
//             Drop Feedback on WhatsApp
//           </Text>
//         </TouchableOpacity>
        
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: scale(30),
//     justifyContent: 'center',
//   },
//   iconWrapper: {
//     alignItems: 'center',
//     marginBottom: scale(30),
//   },
//   iconCircle: {
//     width: scale(120),
//     height: scale(120),
//     borderRadius: scale(60),
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   badge: {
//     position: 'absolute',
//     bottom: scale(-10),
//     paddingHorizontal: scale(12),
//     paddingVertical: scale(6),
//     borderRadius: scale(15),
//     borderWidth: 2,
//     borderColor: '#FFF',
//   },
//   badgeText: {
//     color: '#FFF',
//     fontSize: scale(12),
//     fontWeight: '900',
//     letterSpacing: 1,
//   },
//   title: {
//     fontSize: scale(28),
//     fontWeight: '900',
//     textAlign: 'center',
//     marginBottom: scale(10),
//   },
//   description: {
//     fontSize: scale(15),
//     textAlign: 'center',
//     lineHeight: scale(22),
//     marginBottom: scale(35),
//   },
//   infoBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: scale(15),
//     borderRadius: scale(15),
//     borderWidth: 1,
//     marginBottom: scale(15),
//   },
//   infoIcon: {
//     marginRight: scale(15),
//   },
//   infoTextWrap: {
//     flex: 1,
//   },
//   infoTitle: {
//     fontSize: scale(15),
//     fontWeight: 'bold',
//     marginBottom: scale(4),
//   },
//   infoSub: {
//     fontSize: scale(12),
//     lineHeight: scale(18),
//   },
//   footer: {
//     paddingHorizontal: scale(30),
//     paddingTop: scale(10),
//   },
//   primaryBtn: {
//     flexDirection: 'row',
//     height: scale(56),
//     borderRadius: scale(30),
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: scale(4) },
//     shadowOpacity: 0.2,
//     shadowRadius: scale(5),
//     marginBottom: scale(15),
//   },
//   primaryBtnText: {
//     color: '#FFF',
//     fontSize: scale(16),
//     fontWeight: 'bold',
//   },
//   secondaryBtn: {
//     flexDirection: 'row',
//     height: scale(56),
//     borderRadius: scale(30),
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(150,150,150,0.2)',
//   },
//   secondaryBtnText: {
//     fontSize: scale(15),
//     fontWeight: 'bold',
//   },
// });