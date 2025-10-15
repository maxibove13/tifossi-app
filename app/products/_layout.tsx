import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ProductsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="product" />
      </Stack>
    </View>
  );
}

// Metadata for the router
export const layoutExport = {
  name: 'ProductsLayout',
  version: '1.0.0',
};
