import { StyleSheet, View, Text, Pressable } from 'react-native';
import type { Product } from '../../../../_types/product';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';
import ProductImage from '../image/ProductImage';
import { colors } from '../../../../_styles/colors';
import {
  ProductStatus,
  hasStatus,
  getPrimaryLabelFromStatuses,
} from '../../../../_types/product-status';

type HighlightedCardProps = {
  product: Product;
  onPress?: () => void;
};

export default function HighlightedCard({ product, onPress }: HighlightedCardProps) {
  const { statuses, shortDescription, frontImage, title, price, discountedPrice } = product;

  // Determine label text and color based on product statuses
  let labelText: string | null = null;
  let labelColor: string | undefined;

  // We could use getPrimaryLabelFromStatuses here but we're handling custom display logic
  const _primaryLabel = getPrimaryLabelFromStatuses(statuses);

  if (hasStatus(statuses, ProductStatus.NEW)) {
    labelText = 'Nuevo';
    labelColor = colors.tag.new;
  } else if (hasStatus(statuses, ProductStatus.OPPORTUNITY)) {
    labelText = 'Oportunidad';
    labelColor = colors.tag.opportunity;
  } else if (discountedPrice !== undefined && discountedPrice < price) {
    labelText = 'Descuento';
    labelColor = colors.tag.opportunity;
  }
  // Add more conditions for other statuses if necessary

  // Only use shortDescription
  const displayDescription = shortDescription;

  const renderDescription = () => {
    if (!displayDescription) return null;

    return (
      <View style={styles.descriptionContainer}>
        <View style={styles.descriptionItem}>
          <Text style={styles.descriptionText} numberOfLines={1} ellipsizeMode="tail">
            {displayDescription.line1}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.descriptionItem}>
          <Text style={styles.descriptionText}>{displayDescription.line2}</Text>
        </View>
      </View>
    );
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <ProductImage source={frontImage} size={119} />
      </View>
      <View style={styles.content}>
        {labelText && labelColor && (
          <Text style={[styles.label, { color: labelColor }]}>{labelText}</Text>
        )}
        <Text style={styles.title}>{title}</Text>
        {renderDescription()}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    margin: 3,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  imageContainer: {
    width: 119,
    height: 119,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    overflow: 'hidden',
  },
  content: {
    width: 209,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FBFBFB',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    marginBottom: 4,
  },
  title: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    marginBottom: 8,
  },
  descriptionContainer: {
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 8,
  },
  descriptionItem: {
    width: '100%',
    wordWrap: 'break-word',
  },
  descriptionText: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
    wordWrap: 'break-word',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 8,
  },
});
