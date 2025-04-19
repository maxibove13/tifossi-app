import { Stack } from 'expo-router';
import { useFonts, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Inter_500Medium } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreenComponent from './_components/splash/SplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Roboto: Roboto_500Medium,
    Inter: Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash screen once fonts are loaded
      SplashScreen.hideAsync();
      // Our custom SplashScreen will handle the rest of the loading
      setAppReady(true);
    }
  }, [fontsLoaded]);

  // Handle completion of the preloading process
  const handlePreloadComplete = () => {
    setShowSplash(false);
  };

  if (!fontsLoaded || !appReady) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent onComplete={handlePreloadComplete} />;
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
