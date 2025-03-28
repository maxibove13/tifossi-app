import { View } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '../components/navigation/TabBar';
import type { TabRoute } from '../components/navigation/TabBar';

export default function TabLayout() {
  const getActiveRoute = (index: number): TabRoute => {
    switch (index) {
      case 0:
        return 'store';
      case 1:
        return 'favorites';
      case 2:
        return 'tiffosi';
      case 3:
        return 'cart';
      case 4:
        return 'profile';
      default:
        return 'store';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={({ state, navigation }) => (
          <TabBar 
            activeRoute={getActiveRoute(state.index)}
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
        )}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            href: '/',
          }} 
        />
        <Tabs.Screen 
          name="favorites" 
          options={{
            href: '/favorites',
          }}
        />
        <Tabs.Screen 
          name="tiffosiExplore" 
          options={{
            href: '/tiffosiExplore',
          }}
        />
        <Tabs.Screen 
          name="cart" 
          options={{
            href: '/cart',
          }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            href: '/profile',
          }}
        />
      </Tabs>
    </View>
  );
}
