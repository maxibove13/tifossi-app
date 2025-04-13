import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoBackgroundProps {
  source: number | string;
  fallbackImage?: string;
  children?: React.ReactNode;
  overlayOpacity?: number;
  style?: any;
  shouldLoop?: boolean;
  shouldMute?: boolean;
  shouldAutoPlay?: boolean;
}

export const VideoBackground = ({
  source,
  fallbackImage,
  children,
  overlayOpacity = 0.4,
  style,
  shouldLoop = true,
  shouldMute = true,
  shouldAutoPlay = true,
}: VideoBackgroundProps) => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { width, height } = useWindowDimensions();
  const videoRef = useRef(null);

  const player = useVideoPlayer(source, (player) => {
    if (!player) return;
    player.loop = shouldLoop;
    player.muted = shouldMute;
    player.staysActiveInBackground = false;
  });

  useEffect(() => {
    if (!player) return;

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('Video status changed:', status);
      if (status.error) {
        console.error('Video error:', status.error);
        setIsError(true);
        setIsLoading(false);
      }
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        if (shouldAutoPlay) {
          player.play();
        }
      }
    });

    return () => {
      statusSubscription?.remove();
    };
  }, [player, shouldAutoPlay]);

  return (
    <View style={[styles.container, style, { width, height }]}>
      {isError && fallbackImage ? (
        <Image source={{ uri: fallbackImage }} style={styles.fallback} resizeMode="cover" />
      ) : (
        <VideoView
          ref={videoRef}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          nativeControls={false}
          requiresLinearPlayback
        />
      )}

      <LinearGradient
        colors={['rgba(12, 12, 12, 0)', `rgba(12, 12, 12, ${overlayOpacity})`]}
        style={styles.overlay}
      />

      {isLoading && fallbackImage && (
        <Image
          source={{ uri: fallbackImage }}
          style={[styles.fallback, styles.loadingFallback]}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  loadingFallback: {
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});

export default VideoBackground;
