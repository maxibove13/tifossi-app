import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../_styles/colors';
import { spacing } from '../../_styles/spacing';
// No typography imports needed since we removed the loading text
import preloadService, { PreloadProgress } from '../../_services/preload';

// Loading stages handled internally, no visible messages

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const progress = useSharedValue(0);
  const [_loadingState, setLoadingState] = useState<PreloadProgress>({
    progress: 0,
    stage: 'INIT',
    isComplete: false,
  });

  // Start preloading when component mounts
  useEffect(() => {
    const handleProgress = (progressData: PreloadProgress) => {
      // Update the animated value smoothly
      progress.value = withTiming(progressData.progress / 100, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      // Update the loading state for the message
      setLoadingState(progressData);

      // Call onComplete callback when preloading is complete
      if (progressData.isComplete && onComplete) {
        // Add a small delay to ensure the animation completes
        setTimeout(onComplete, 500);
      }
    };

    // Start preloading
    preloadService.preloadEssentials(handleProgress);
  }, [progress, onComplete]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.min(1, progress.value * 2), // Fade in faster
    };
  });

  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Animated.Image
            source={require('../../../assets/images/logo/tiffosi-light.png')}
            style={[styles.logo, logoAnimatedStyle]}
            resizeMode="contain"
          />
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <Animated.View style={[styles.progressBarFill, progressBarAnimatedStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 50.7,
    height: 48,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  progressBarContainer: {
    width: 112,
    height: 4,
    position: 'relative',
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 32,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.background.light,
    borderRadius: 32,
  },
});
