import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useEffect, useRef } from 'react';

type VideoBackgroundProps = {
  children: React.ReactNode;
};

export default function VideoBackground({ children }: VideoBackgroundProps) {
  const video = useRef(null);

  useEffect(() => {
    if (video.current) {
      (async () => {
        await video.current.playAsync();
        // Ensure video loops
        await video.current.setIsLoopingAsync(true);
        // Mute the video
        await video.current.setIsMutedAsync(true);
      })();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={require('../../../assets/videos/splash-screen-background.mov')}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.5)', // Add a slight overlay to ensure content visibility
  },
}); 