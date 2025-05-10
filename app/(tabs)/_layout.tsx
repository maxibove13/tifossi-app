import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '../_components/navigation/TabBar';
import type { TabRoute } from '../_components/navigation/TabBar'; // Keep this type if used by TabBar or internal logic
import Header from '../_components/store/layout/Header';
import ScreenHeader from '../_components/common/ScreenHeader';

// Placeholder for actual icon components if TabBar needs them passed this way,
// or if they are used in screenOptions. The original diff didn't show them in Tabs.Screen options directly.
// import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  // Assuming getActiveRoute was part of the original file, keep it.
  // If TabRoute is defined elsewhere or differently, this might need adjustment.
  const getActiveRoute = (index: number): TabRoute => {
    switch (index) {
      case 0:
        return 'store'; // Corresponds to 'index' screen
      case 1:
        return 'favorites'; // Corresponds to 'favorites' screen
      case 2:
        // Assuming 'tiffosiExplore' was mapped to 'tiffosi' for TabRoute
        return 'tiffosi'; // Corresponds to 'tiffosiExplore' screen
      case 3:
        return 'cart'; // Corresponds to 'cart' screen
      case 4:
        return 'profile'; // Corresponds to 'profile' screen
      default:
        return 'store';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        // screenOptions for headerShown might have been here or per screen.
        // My previous global screenOptions={{ headerShown: false }} is fine.
        screenOptions={{
          headerShown: false,
        }}
        tabBar={({ state, navigation }) => {
          // Removed descriptors
          const activeRoute = getActiveRoute(state.index);
          // Set isDark to true only for the tiffosi explore screen
          // Ensure 'tiffosi' TabRoute correctly maps to tiffosiExplore screen name
          const isDark = activeRoute === 'tiffosi';

          // Ensure TabBar props are correctly passed.
          // If TabBar took 'descriptors' or 'navigation' directly, pass them.
          // The original just passed activeRoute, isDark, onChangeRoute.
          return (
            <TabBar
              activeRoute={activeRoute}
              isDark={isDark}
              //descriptors={descriptors} // Pass if your TabBar component uses it
              //navigation={navigation} // Pass if your TabBar component uses it
              //state={state} // Pass if your TabBar component uses it
              onChangeRoute={(route) => {
                const routeMap: Record<TabRoute, string> = {
                  store: 'index',
                  favorites: 'favorites',
                  tiffosi: 'tiffosiExplore',
                  cart: 'cart',
                  profile: 'profile',
                };
                navigation.navigate(routeMap[route]);
              }}
            />
          );
        }}
      >
        <Tabs.Screen
          name="index" // Tienda
          options={{
            // href: '/', // Original option, keep if necessary for deep linking or TabBar behavior
            title: 'Tienda', // Title for the tab, accessibility
            headerShown: true,
            header: () => (
              <View>
                <Header title="Tienda" variant="store" />
                <ScreenHeader title="Tienda" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            // href: '/favorites', // Original option
            title: 'Favoritos',
            headerShown: true,
            header: () => (
              <View>
                <Header title="Favoritos" variant="store" invisible={true} />
                <ScreenHeader title="Favoritos" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="tiffosiExplore"
          options={{
            // href: '/tiffosiExplore', // Original option
            title: 'Tiffosi Explore',
            headerShown: false, // No header for Tiffosi Explore
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            // href: '/cart', // Original option
            title: 'Carrito',
            headerShown: true,
            header: () => (
              <View>
                <Header title="Carrito" variant="store" invisible={true} />
                <ScreenHeader title="Carrito" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            // href: '/profile', // Original option
            title: 'Perfil',
            headerShown: true,
            header: () => (
              <View>
                <Header title="Perfil" variant="store" invisible={true} />
                <ScreenHeader title="Perfil" />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
