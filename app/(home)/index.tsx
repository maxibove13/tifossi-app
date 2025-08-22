import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../_components/home/HomeHeader';
import HomeContent from '../_components/home/HomeContent';
import { VideoBackground } from '../_components/common/VideoBackground';
import Button from '../_components/ui/buttons/Button';
import { spacing, layout } from '../_styles/spacing';
import { colors } from '../_styles/colors';

export default function HomeScreen() {
  const router = useRouter();

  const handleGoToStore = () => {
    router.replace('/(tabs)');
  };

  return (
    <VideoBackground source={require('../../assets/videos/splash-screen-background.mov')}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <HomeHeader />
        <View style={styles.contentArea}>
          <View style={styles.authButtonsContainer}>
            <Button
              text="Iniciar sesión"
              variant="secondary"
              onPress={() => router.push('/auth/login')}
              style={styles.loginButton}
            />
            <Button
              text="Registrarse"
              variant="secondary"
              onPress={() => router.push('/auth/signup')}
              style={styles.registerButton}
            />
          </View>
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
  // Removed bottomContentWrapper style
  authButtonsContainer: {
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingBottom: spacing.lg,
  },
  loginButton: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  registerButton: {
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    borderColor: 'transparent',
  },
});
