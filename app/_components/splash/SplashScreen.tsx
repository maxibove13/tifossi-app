import { StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '../../_styles/colors';
import { spacing } from '../../_styles/spacing';

export default function SplashScreen() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2000 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value
    };
  });

  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`
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
          <Animated.View 
            style={[styles.progressBarFill, progressBarAnimatedStyle]} 
          />
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
    backgroundColor: colors.primary,
    borderRadius: 32,
  },
}); 