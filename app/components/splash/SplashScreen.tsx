import { StyleSheet, View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export default function SplashScreen() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Animated.Image
            source={require('../../../assets/images/logo/tiffosi-light.png')}
            style={[
              styles.logo,
              {
                opacity: progress
              }
            ]}
            resizeMode="contain"
          />
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <Animated.View 
            style={[
              styles.progressBarFill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    backgroundColor: '#707070',
    borderRadius: 32,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#FBFBFB',
    borderRadius: 32,
  },
}); 