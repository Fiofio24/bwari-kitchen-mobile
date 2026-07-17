import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// This file acts as the default anchor/entry point for Expo Router.
// It stabilizes the layout engine while _layout.tsx calculates 
// whether to redirect the user to /welcome or /unlock.
export default function IndexScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}