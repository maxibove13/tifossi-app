import { View, StyleSheet, Image, useWindowDimensions, ImageSourcePropType } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import preloadService from '../../_services/preload';

interface VideoBackgroundProps {
  source: number | string;
  fallbackImage?: string | ImageSourcePropType;
  children?: React.ReactNode;
  overlayOpacity?: number;
  style?: any;
  shouldLoop?: boolean;
  shouldMute?: boolean;
  shouldAutoPlay?: boolean;
  preloadPriority?: 'high' | 'medium' | 'low';
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
  preloadPriority = 'medium',
}: VideoBackgroundProps) => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const { width, height } = useWindowDimensions();
  const videoRef = useRef(null);

  // Preload the video asset when the component mounts
  useEffect(() => {
    if (source && !isPreloaded) {
      // Create a unique key for this asset
      const assetKey =
        typeof source === 'number'
          ? `video_${source}`
          : `video_${source.toString().split('/').pop()}`;

      // Add to preload service
      preloadService.updateAssetList([
        {
          key: assetKey,
          asset: source,
          type: 'video',
          priority: preloadPriority,
        },
      ]);

      // Mark as preloaded so we don't try to preload again
      setIsPreloaded(true);
    }

    // Also preload the fallback image if provided
    if (fallbackImage && !isPreloaded) {
      const imageKey =
        typeof fallbackImage === 'number'
          ? `image_${fallbackImage}`
          : `image_fallback_${Math.random().toString(36).substring(7)}`;

      preloadService.updateAssetList([
        {
          key: imageKey,
          asset: fallbackImage,
          type: 'image',
          priority: preloadPriority,
        },
      ]);
    }
  }, [source, fallbackImage, isPreloaded, preloadPriority]);

  // Default to fallback image if source is empty/invalid
  const hasValidSource = !!source && source !== '';

  // Always initialize the player, but we'll handle the invalid source case separately
  const player = useVideoPlayer(source, (player) => {
    if (!player) return;
    player.loop = shouldLoop;
    player.muted = shouldMute;
    player.staysActiveInBackground = false;
  });

  // Immediately show fallback if source is invalid
  useEffect(() => {
    if (!hasValidSource) {
      setIsError(true);
      setIsLoading(false);
    }
  }, [hasValidSource]);

  // Error handler function
  const handleVideoError = useCallback(() => {
    console.error('(NOBRIDGE) Video loading error - falling back to image');
    setIsError(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // If we don't have a valid source or player, there's nothing to do
    if (!hasValidSource || !player) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Set a timeout to trigger fallback if video doesn't load within 3 seconds
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        handleVideoError();
      }
    }, 3000);

    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.error) {
        handleVideoError();
      }
      if (status.status === 'readyToPlay') {
        clearTimeout(fallbackTimer);
        setIsLoading(false);
        if (shouldAutoPlay) {
          try {
            player.play();
          } catch {
            // Catch any play errors and fall back to image
            handleVideoError();
          }
        }
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      statusSubscription?.remove();
    };
  }, [player, shouldAutoPlay, isLoading, hasValidSource, handleVideoError]);

  // Always render fallback image if no valid fallback is provided
  if (!fallbackImage && (isError || !hasValidSource)) {
    console.warn('VideoBackground: No fallback image provided but video failed to load');
  }

  return (
    <View style={[styles.container, style, { width, height }]}>
      {/* Show fallback image if we have an error or invalid source */}
      {(isError || !hasValidSource) && fallbackImage ? (
        <Image
          source={typeof fallbackImage === 'string' ? { uri: fallbackImage } : fallbackImage}
          style={styles.fallback}
          resizeMode="cover"
        />
      ) : // Only try to render video if we have a valid source and player and no errors
      hasValidSource && player && !isError ? (
        <VideoView
          ref={videoRef}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          nativeControls={false}
          requiresLinearPlayback
        />
      ) : null}

      <LinearGradient
        colors={['rgba(12, 12, 12, 0)', `rgba(12, 12, 12, ${overlayOpacity})`]}
        style={styles.overlay}
      />

      {/* Show fallback image during loading if available */}
      {isLoading && fallbackImage && (
        <Image
          source={typeof fallbackImage === 'string' ? { uri: fallbackImage } : fallbackImage}
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
