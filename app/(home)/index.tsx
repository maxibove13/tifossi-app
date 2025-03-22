import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../components/home/HomeHeader';
import HomeContent from '../components/home/HomeContent';
import { VideoBackground } from '../components/common/VideoBackground';

export default function HomeScreen() {
  const router = useRouter();

  const handleGoToStore = () => {
    router.replace('/(tabs)');
  };

  return (
    <VideoBackground source={require('../../assets/videos/splash-screen-background.mov')}>
      <StatusBar style="light" />
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <View style={styles.container}>
        <HomeHeader />
        <HomeContent onStorePress={handleGoToStore} />
      </View>
    </VideoBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 34,
    justifyContent: 'space-between',
  },
}); 