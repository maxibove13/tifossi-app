import { Stack } from 'expo-router';
import { useFonts, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Inter_500Medium } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreenComponent from './_components/splash/SplashScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './_stores/authStore';
import { useCartStore } from './_stores/cartStore';
// Removed complex caching and routing dependencies

// Initialize app configuration (fail fast on missing config)
import appInit from './_config/initialization';

// Initialize store synchronizer
import './_stores/storeSynchronizer';

// Simple Error Handling
import { GlobalErrorBoundary } from './_components/common/UnifiedErrorBoundary';

// Initialize app configuration before anything else
try {
  appInit.initialize();
} catch (error) {
  console.error('App initialization failed:', error);
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client with enhanced error handling and caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      networkMode: 'online', // Only run when online by default
      refetchOnWindowFocus: false, // Don't refetch on window focus in mobile
      refetchOnReconnect: 'always', // Always refetch when reconnecting
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 2,
      networkMode: 'online',
    },
  },
});

// Main App component
const AppWithNotifications: React.FC = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

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
      // Initialize authentication
      initializeAuth();
    }
  }, [appReady, initializeAuth]);

  // Validate cart items on startup (removes products that no longer exist)
  useEffect(() => {
    if (appReady) {
      useCartStore.getState().validateCartItems();
    }
  }, [appReady]);

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
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppWithNotifications />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
