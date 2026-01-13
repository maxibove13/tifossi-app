import { Redirect } from 'expo-router';
import { useAuthStore } from './_stores/authStore';

export default function Index() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Skip landing page for logged-in users
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(home)" />;
}
