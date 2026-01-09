import { memo, useMemo } from 'react';
import { StyleSheet, View, ImageSourcePropType } from 'react-native';
import { Image, ImageLoadEventData } from 'expo-image';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

type ProductImageProps = {
  source: string | ImageSourcePropType;
  size?: number;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  lazy?: boolean;
  onLoad?: (event: ImageLoadEventData) => void;
  onError?: (error: Error) => void;
};

function ProductImage({
  source,
  size = 160,
  overlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.1,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  lazy = false,
  onLoad,
  onError,
}: ProductImageProps) {
  // Memoize image source configuration
  const imageSource = useMemo(() => {
    if (typeof source === 'string') {
      return {
        uri: source,
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=31536000', // 1 year cache
        },
      };
    }
    return source;
  }, [source]);

  // Memoize container style to prevent recalculation
  const containerStyle = useMemo(
    () => [styles.container, { width: '100%' as const, height: size }],
    [size]
  );

  // Memoize overlay style to prevent recalculation
  const overlayStyle = useMemo(
    () => [
      styles.overlay,
      {
        backgroundColor: overlayColor,
        opacity: overlayOpacity,
      },
    ],
    [overlayColor, overlayOpacity]
  );

  // Configure image props based on performance settings
  const imageProps = useMemo(() => {
    const props: any = {
      source: imageSource,
      style: styles.image,
      contentFit: 'cover',
      placeholder: blurhash,
      transition: priority === 'high' ? 100 : 200,
      cachePolicy,
      onLoad,
      onError,
    };

    // Add priority loading for important images
    if (priority === 'high') {
      props.priority = 'high';
      props.allowDownscaling = false;
    } else if (priority === 'low') {
      props.priority = 'low';
      props.allowDownscaling = true;
    }

    // Enable lazy loading for off-screen images
    if (lazy) {
      props.contentPosition = 'center';
      props.recycling = true;
    }

    return props;
  }, [imageSource, cachePolicy, priority, lazy, onLoad, onError]);

  return (
    <View style={containerStyle}>
      <View style={styles.imageWrapper}>
        <Image {...imageProps} />
      </View>
      {overlay && <View style={overlayStyle} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 2,
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default memo(ProductImage);
