import { Stack } from 'expo-router';
import { useFonts, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Inter_500Medium } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreenComponent from './components/splash/SplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    'Roboto': Roboto_500Medium,
    'Inter': Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash screen
      SplashScreen.hideAsync();
      
      // Show our custom splash screen for 2 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(home)/index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
