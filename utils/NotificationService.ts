import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 1. FORCE THE NOTIFICATION TO POP OUT WHEN APP IS OPEN
// @ts-ignore - Bypassing TS version mismatch; the underlying JS function is perfectly valid
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // This is what makes it drop down from the top!
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 2. FUNCTION TO REQUEST PERMISSION FROM THE USER
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX, // MAX importance forces the pop-down on Android
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d30000',
    });
  }

  if (Device.isDevice || Platform.OS === 'android') { // Emulators on Android can test local notifications!
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  }

  return token;
}

// 3. FUNCTION TO TRIGGER A TEST NOTIFICATION
export async function triggerTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🍔 Order Confirmed!",
      body: "Your Bwari Kitchen meal is being prepared and will arrive soon.",
      data: { orderId: '12345' }, // Hidden data you can use when they tap it
    },
    // Cast to 'any' to bypass strict TS discriminated union checks for the trigger
    trigger: { seconds: 2 } as any, 
  });
}