import { Stack } from 'expo-router';
import { useFonts, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Inter_500Medium } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreenComponent from './_components/splash/SplashScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './_stores/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default stale time
      gcTime: 1000 * 60 * 60 * 1, // 1 hour garbage collection time
    },
  },
});

export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Roboto: Roboto_500Medium,
    Inter: Inter_500Medium,
  });

  // Initialize Auth state on app load
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash screen once fonts are loaded
      SplashScreen.hideAsync();
      // Our custom SplashScreen will handle the rest of the loading
      setAppReady(true);
    }
  }, [fontsLoaded]);

  // Initialize auth when app is ready
  useEffect(() => {
    if (appReady) {
      initializeAuth();
    }
  }, [appReady, initializeAuth]);

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
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
