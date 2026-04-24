// Note: This file requires an Expo/React Native environment to compile correctly.
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import BottomNav from '../../components/BottomNav';
import DraggableOrderButton from '../../components/DraggableOrderButton';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        // THE MAGIC TRICK: We tell Expo to replace its default navigation bar
        // with our custom animated BottomNav component!
        tabBar={(props) => <BottomNav {...props} />}
        screenOptions={{ 
          headerShown: false,
          // This makes the pages fade smoothly when switching instead of snapping
          animation: 'fade' 
        }}
      >
        {/* We list all the screens that belong to the bottom nav here */}
        <Tabs.Screen name="index" />
        <Tabs.Screen name="menu" />
        <Tabs.Screen name="favorite" />
        <Tabs.Screen name="profile" />
      </Tabs>

      {/* FIXED: Removed the outdated onPress prop. The button now handles its own routing! */}
      <DraggableOrderButton />
    </View>
  );
}