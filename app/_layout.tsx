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

// Store synchronizer - imported but NOT auto-initialized at module level
// to prevent crashes from native module access before React is ready
import { storeSynchronizer } from './_stores/storeSynchronizer';

// Simple Error Handling
import { GlobalErrorBoundary } from './_components/common/UnifiedErrorBoundary';

// IMPORTANT: Do NOT call appInit.initialize() at module level!
// Module-level code runs during bundle evaluation, before the React Native
// bridge is fully ready. This causes crashes in production builds.
// All initialization is done in useEffect after component mounts.

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
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [fontsLoaded] = useFonts({
    Roboto: Roboto_500Medium,
    Inter: Inter_500Medium,
  });

  // Initialize Auth state on app load
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  useEffect(() => {
    if (fontsLoaded) {
      // Initialize app configuration (endpoints, network monitoring)
      // This must happen AFTER component mount to ensure native bridge is ready
      try {
        appInit.initialize();
      } catch (error) {
        console.error('App initialization failed:', error);
        // Don't crash the app, continue with defaults
      }

      // Hide the native splash screen once fonts are loaded
      SplashScreen.hideAsync();
      // Our custom SplashScreen will handle the rest of the loading
      setAppReady(true);
    }
  }, [fontsLoaded]);

  // Initialize auth and store synchronizer when app is ready
  useEffect(() => {
    if (appReady) {
      // Initialize authentication (this accesses Firebase native modules)
      initializeAuth();

      // Initialize store synchronizer AFTER auth to set up cross-store subscriptions
      // Must happen after mount to ensure native modules are ready
      storeSynchronizer.initialize();
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
    setPreloadComplete(true);
  };

  // Wait for both preloading AND auth initialization before hiding splash
  // This ensures logged-in users go directly to (tabs) without seeing landing page
  useEffect(() => {
    if (preloadComplete && isInitialized) {
      setShowSplash(false);
    }
  }, [preloadComplete, isInitialized]);

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
