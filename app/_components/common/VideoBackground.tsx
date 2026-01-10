import {
  View,
  StyleSheet,
  useWindowDimensions,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import { VideoView, VideoPlayer, createVideoPlayer } from 'expo-video';
import { useRef, useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import { videoCache } from '../../_services/videoCache';
import React from 'react';

interface VideoBackgroundProps {
  source: number | string;
  children?: React.ReactNode;
  overlayOpacity?: number;
  style?: any;
  shouldLoop?: boolean;
  shouldMute?: boolean;
  shouldAutoPlay?: boolean;
  /** Fallback image to show if video fails to load */
  fallbackImage?: ImageSourcePropType;
}

export const VideoBackground = ({
  source,
  children,
  overlayOpacity = 0.4,
  style,
  shouldLoop = true,
  shouldMute = true,
  shouldAutoPlay = true,
  fallbackImage,
}: VideoBackgroundProps) => {
  const { width, height } = useWindowDimensions();
  const videoRef = useRef(null);
  const [player, setPlayer] = useState<VideoPlayer | null>(null);
  const [hasError, setHasError] = useState(false);
  const isOwnedPlayer = useRef(false);

  useEffect(() => {
    let videoPlayer: VideoPlayer | null = null;
    setHasError(false);

    try {
      // Resolve the source URI
      let sourceUri: string;
      if (typeof source === 'number') {
        const asset = Asset.fromModule(source);
        sourceUri = asset.localUri ?? asset.uri;
      } else {
        sourceUri = source;
      }

      // Check cache for pre-buffered player
      const cached = videoCache.get(sourceUri);
      if (cached) {
        videoPlayer = cached;
        isOwnedPlayer.current = false;
      } else {
        videoPlayer = createVideoPlayer(sourceUri);
        isOwnedPlayer.current = true;
      }

      // Configure player
      videoPlayer.loop = shouldLoop;
      videoPlayer.muted = shouldMute;
      videoPlayer.staysActiveInBackground = false;

      if (shouldAutoPlay) {
        videoPlayer.play();
      }

      setPlayer(videoPlayer);
    } catch {
      setHasError(true);
    }

    // Cleanup: only release if we created it (not cached)
    return () => {
      if (isOwnedPlayer.current && videoPlayer) {
        videoPlayer.release();
      }
    };
  }, [source, shouldLoop, shouldMute, shouldAutoPlay]);

  // Show fallback image if video failed to load
  if (hasError && fallbackImage) {
    return (
      <ImageBackground
        source={fallbackImage}
        style={[styles.container, style, { width, height }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(12, 12, 12, 0)', `rgba(12, 12, 12, ${overlayOpacity})`]}
          style={styles.overlay}
        />
        <View style={styles.content}>{children}</View>
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.container, style, { width, height }]}>
      {player && (
        <VideoView
          ref={videoRef}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      <LinearGradient
        colors={['rgba(12, 12, 12, 0)', `rgba(12, 12, 12, ${overlayOpacity})`]}
        style={styles.overlay}
      />

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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});

export default React.memo(VideoBackground);
