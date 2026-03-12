import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../_components/home/HomeHeader';
import HomeContent from '../_components/home/HomeContent';
import { VideoBackground } from '../_components/common/VideoBackground';
import { layout } from '../_styles/spacing';
import { useAuthStore } from '../_stores/authStore';
import strapiApi from '../_services/api/strapiApi';

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useAuthStore();
  const [videoSource, setVideoSource] = useState<string | null>(null);

  useEffect(() => {
    strapiApi.fetchAppSettings().then((settings) => {
      if (settings.splashVideoUrl) {
        setVideoSource(settings.splashVideoUrl);
      }
    });
  }, []);

  useEffect(() => {
    if (isInitialized && isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isLoggedIn, router]);

  const handleGoToStore = () => {
    router.replace('/(tabs)');
  };

  const content = (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <HomeHeader />
        <View style={styles.contentArea}>
          <HomeContent onStorePress={handleGoToStore} />
        </View>
      </View>
    </>
  );

  if (!videoSource) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return <VideoBackground source={videoSource}>{content}</VideoBackground>;
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
  fullScreen: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
});
