// import React from 'react';
// import { View, Image, StyleSheet, Dimensions } from 'react-native';

// const { width, height } = Dimensions.get('window');

// export default function SplashDesigner() {
//   return (
//     <View style={styles.container}>
//       {/* TWEAK THIS IMAGE TAG LIVE! 
//         Change the width, height, and marginBottom until it looks perfect.
//       */}
//       <Image 
//         source={require('../assets/images/Icon&logo/BK_logo.png')} // Make sure this path matches your logo!
//         style={styles.logo}
//         resizeMode="contain"
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject, // Forces it to cover the entire screen
//     backgroundColor: '#D30000', // TWEAK THIS: Change the hex code if you want a different red!
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 9999, // Puts it aggressively on top of everything else
//     elevation: 9999,
//   },
//   logo: {
//     width: 150, // TWEAK THIS: Make it bigger or smaller
//     height: 150, 
//     // marginTop: -50, // Uncomment and tweak this if you want to push the logo slightly up or down from true center
//   }
// });