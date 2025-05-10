import { View, StyleSheet, Image, useWindowDimensions, ImageSourcePropType } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState, useEffect, useRef, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import preloadService from '../../_services/preload';
import { Asset } from 'expo-asset';
import React from 'react';

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
  const [isPreloaded, setIsPreloaded] = useState(false);
  const { width, height } = useWindowDimensions();
  const videoRef = useRef(null);

  const memoSource = useMemo(() => {
    if (typeof source === 'number') {
      const asset = Asset.fromModule(source);
      if (!asset.localUri) {
        asset.downloadAsync().catch(() => {
          setIsError(true);
        });
      }
      return { uri: asset.localUri ?? asset.uri };
    }
    return { uri: source as string };
  }, [source]);

  useEffect(() => {
    if (source && !isPreloaded) {
      const assetKey =
        typeof source === 'number'
          ? `video_${source}`
          : `video_${source.toString().split('/').pop()}`;

      preloadService.updateAssetList([
        {
          key: assetKey,
          asset: source,
          type: 'video',
          priority: preloadPriority,
        },
      ]);

      setIsPreloaded(true);
    }

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

  const hasValidSource = !!memoSource?.uri && memoSource.uri !== '';

  const player = useVideoPlayer(memoSource, (player) => {
    if (!player) return;
    player.loop = shouldLoop;
    player.muted = shouldMute;
    player.staysActiveInBackground = false;

    if (shouldAutoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    if (!hasValidSource) {
      setIsError(true);
    }
  }, [hasValidSource]);

  return (
    <View style={[styles.container, style, { width, height }]}>
      {(isError || !hasValidSource) && fallbackImage ? (
        <Image
          source={typeof fallbackImage === 'string' ? { uri: fallbackImage } : fallbackImage}
          style={styles.fallback}
          resizeMode="cover"
        />
      ) : hasValidSource && player && !isError ? (
        <VideoView
          ref={videoRef}
          player={player}
          style={[styles.video, { width, height }]}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}

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

export default React.memo(VideoBackground);
