import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../_components/home/HomeHeader';
import HomeContent from '../_components/home/HomeContent';
import { VideoBackground } from '../_components/common/VideoBackground';
import { layout } from '../_styles/spacing';
import { useAuthStore } from '../_stores/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isLoggedIn, router]);

  const handleGoToStore = () => {
    router.replace('/(tabs)');
  };

  return (
    <VideoBackground source={require('../../assets/videos/splash-screen-background.mov')}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <HomeHeader />
        <View style={styles.contentArea}>
          <HomeContent onStorePress={handleGoToStore} />
        </View>
      </View>
    </VideoBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 48,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 34,
  },
});
