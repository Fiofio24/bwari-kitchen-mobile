// import React, { useRef, useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Animated, 
//   TouchableWithoutFeedback,
//   Linking,
//   Alert
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useTheme } from '../context/ThemeContext';
// import { Colors } from '../constants/Colors';
// import { scale } from '../constants/Sizes';
// import * as WebBrowser from 'expo-web-browser';

// interface FeedbackExitModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onExit: () => void;
// }

// export default function FeedbackExitModal({ visible, onClose, onExit }: FeedbackExitModalProps) {
//   const { colors, isDark } = useTheme();
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const [isRendering, setIsRendering] = useState(visible);

//   useEffect(() => {
//     if (visible) {
//       setIsRendering(true);
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
//         Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
//       ]).start();
//     } else if (!visible && isRendering) {
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
//         Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true })
//       ]).start(() => setIsRendering(false));
//     }
//   }, [visible, isRendering, fadeAnim, scaleAnim]);

//   const handleWhatsApp = async () => {
//     const phone = '2348108280855';
//     const message = encodeURIComponent('Hey, \nHere is my feedback on the Bwari Kitchen App:\n\n');
    
//     const appUrl = `whatsapp://send?phone=${phone}&text=${message}`;
//     const webUrl = `https://wa.me/${phone}?text=${message}`;

//     try {
//       // 1. Force the intent directly
//       await Linking.openURL(appUrl);
//     } catch (error) {
//       // 2. Fallback to standard web intent
//       try {
//         await Linking.openURL(webUrl);
//       } catch (fallbackError) {
//         Alert.alert("Error", "Could not open WhatsApp. Please ensure you have a browser or WhatsApp installed.");
//       }
//     }
//   };

//   if (!isRendering) return null;

//   return (
//     <View style={[StyleSheet.absoluteFill, styles.overlay]}>
//       {/* Background shadow */}
//       <TouchableWithoutFeedback onPress={onClose}>
//         <Animated.View style={[styles.backdrop, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }]} />
//       </TouchableWithoutFeedback>
      
//       {/* The Alert Box */}
//       <Animated.View style={[
//         styles.card, 
//         { 
//           backgroundColor: colors.surface, 
//           borderColor: colors.border,
//           opacity: fadeAnim,
//           transform: [{ scale: scaleAnim }] 
//         }
//       ]}>
//         <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]}>
//           <Ionicons name="chatbubbles" size={scale(32)} color="#4CAF50" />
//         </View>
        
//         <Text style={[styles.title, { color: colors.text }]}>Leaving so soon?</Text>
//         <Text style={[styles.message, { color: colors.textMuted }]}>
//           Before you exit, please don&apos;t forget to drop your feedback on what you liked and what needs improvement!
//         </Text>
        
//         <View style={styles.buttonCol}>
//           {/* FIX: Separated the primaryBtn styles so it doesn't collapse */}
//           <TouchableOpacity 
//             style={[styles.baseBtn, styles.primaryBtn]} 
//             onPress={handleWhatsApp} 
//             activeOpacity={0.8}
//           >
//             <Ionicons name="logo-whatsapp" size={scale(18)} color="#FFF" style={{ marginRight: scale(6) }} />
//             <Text style={styles.primaryText}>Send Feedback</Text>
//           </TouchableOpacity>

//           <View style={styles.rowBtns}>
//              <TouchableOpacity 
//                 style={[styles.baseBtn, styles.rowBtnItem, styles.cancelBtn, { borderColor: colors.border }]} 
//                 onPress={onClose} 
//                 activeOpacity={0.7}
//              >
//                 <Text style={[styles.btnText, { color: colors.text }]}>Stay in App</Text>
//              </TouchableOpacity>

//              <TouchableOpacity 
//                 style={[styles.baseBtn, styles.rowBtnItem, styles.cancelBtn, { borderColor: colors.border, backgroundColor: 'rgba(211,47,47,0.05)' }]} 
//                 onPress={onExit} 
//                 activeOpacity={0.7}
//              >
//                 <Text style={[styles.btnText, { color: '#D32F2F' }]}>Exit App</Text>
//              </TouchableOpacity>
//           </View>
//         </View>
//       </Animated.View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     zIndex: 9999,
//     elevation: 9999,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   backdrop: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   card: {
//     width: '85%',
//     maxWidth: scale(340),
//     borderRadius: scale(25),
//     padding: scale(25),
//     alignItems: 'center',
//     borderWidth: 1,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: scale(4) },
//     shadowOpacity: 0.2,
//     shadowRadius: scale(10),
//   },
//   iconCircle: {
//     width: scale(64),
//     height: scale(64),
//     borderRadius: scale(32),
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: scale(15),
//   },
//   title: {
//     fontSize: scale(20),
//     fontWeight: 'bold',
//     marginBottom: scale(8),
//   },
//   message: {
//     fontSize: scale(14),
//     textAlign: 'center',
//     marginBottom: scale(25),
//     lineHeight: scale(22),
//   },
//   buttonCol: {
//     width: '100%',
//     gap: scale(12),
//   },
//   rowBtns: {
//     flexDirection: 'row',
//     gap: scale(12),
//   },
//   baseBtn: {
//     paddingVertical: scale(14),
//     borderRadius: scale(15),
//     justifyContent: 'center',
//     alignItems: 'center',
//     flexDirection: 'row',
//   },
//   rowBtnItem: {
//     flex: 1,
//   },
//   primaryBtn: {
//     backgroundColor: '#4CAF50',
//     width: '100%',
//   },
//   cancelBtn: {
//     borderWidth: 1,
//   },
//   primaryText: {
//     color: '#FFF',
//     fontSize: scale(15),
//     fontWeight: 'bold',
//   },
//   btnText: {
//     fontSize: scale(14),
//     fontWeight: 'bold',
//   },
// });