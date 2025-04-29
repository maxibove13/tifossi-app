import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';
import { spacing, radius } from '../../../../_styles/spacing';
import { colors } from '../../../../_styles/colors';
import ProductImage from './ProductImage';
import { ImageOnlyCardProps } from '../types';
import { getCardDimensions } from '../../../../_types/product-card';
import { mapProductToCardData } from '../../../../_types/product';

export const ImageOnlyCard = ({ product, onPress, size = 'small' }: ImageOnlyCardProps) => {
  const cardData = mapProductToCardData(product);
  const dimensions = getCardDimensions('image-only', size);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        { width: typeof dimensions.width === 'number' ? dimensions.width : '100%' },
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          { width: dimensions.imageSize, height: dimensions.imageSize },
        ]}
      >
        <ProductImage source={cardData.image} size={dimensions.imageSize} />
      </View>
      {cardData.name && (
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {cardData.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  imageContainer: {
    borderRadius: radius.xs,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  content: {
    paddingHorizontal: spacing.xs,
  },
  name: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
});

export default ImageOnlyCard;
