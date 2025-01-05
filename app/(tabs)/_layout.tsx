import { View } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '../components/navigation/TabBar';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => <TabBar />}
      >
        <Tabs.Screen name="store" />
        <Tabs.Screen name="favorites" />
        <Tabs.Screen name="cart" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
