import { memo } from 'react';
import { StyleSheet, View, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

type ProductImageProps = {
  source: string | ImageSourcePropType;
  size?: number;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
};

function ProductImage({
  source,
  size = 160,
  overlay = false,
  overlayColor = '#000000',
  overlayOpacity = 0.1,
}: ProductImageProps) {
  return (
    <View style={[styles.container, { width: '100%', height: size }]}>
      <View style={styles.imageWrapper}>
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={styles.image}
          contentFit="cover"
          placeholder={blurhash}
          transition={200}
        />
      </View>
      {overlay && (
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
            },
          ]}
        />
      )}
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
    width: '130%',
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
