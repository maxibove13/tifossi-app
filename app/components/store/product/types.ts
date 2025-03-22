import { StyleProp, ViewStyle } from 'react-native'
import { Product } from '../../../types/product'
import {
  BaseProductCardProps,
  SizeableProductCardProps,
  CardVariant,
  CardSizeByVariant
} from '../../../types/product-card'

export type {
  BaseProductCardProps,
  SizeableProductCardProps,
  CardVariant,
  CardSizeByVariant
}

export type DefaultCardProps = SizeableProductCardProps<'default'>
export type FeaturedCardProps = SizeableProductCardProps<'featured'> & {
  onBuyPress?: () => void
  onPress?: () => void
}
export type HorizontalCardProps = BaseProductCardProps & {
  aspectRatio?: number
}
export type MinicardProps = BaseProductCardProps
export type ImageOnlyCardProps = SizeableProductCardProps<'image-only'>

// Add required types for product index.tsx
export type ProductCardSize = 'small' | 'large';

// Add type aliases for the imported components
export type PromotionProductCardProps = {
  product: Product;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export type FeaturedProductCardProps = FeaturedCardProps;
export type HorizontalProductCardProps = HorizontalCardProps; 