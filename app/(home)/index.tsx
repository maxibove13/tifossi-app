import { StyleSheet, View } from 'react-native'; // Uncommented View
import { useRouter } from 'expo-router'; // Removed Stack import
import { StatusBar } from 'expo-status-bar'; // Uncommented StatusBar
import HomeHeader from '../_components/home/HomeHeader'; // Uncommented HomeHeader
import HomeContent from '../_components/home/HomeContent'; // Uncommented HomeContent
import { VideoBackground } from '../_components/common/VideoBackground';

export default function HomeScreen() {
  console.log('[HomeScreen] Rendering');
  const router = useRouter();

  const handleGoToStore = () => {
    router.replace('/(tabs)');
  };

  return (
    <VideoBackground source={require('../../assets/videos/splash-screen-background.mov')}>
      <StatusBar style="light" />
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
