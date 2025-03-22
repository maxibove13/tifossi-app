import { StyleProp, ViewStyle } from 'react-native'
import { Product } from './product'

export type CardVariant = 'default' | 'featured' | 'horizontal' | 'minicard' | 'image-only'

export type CardSize = 'small' | 'large'

export interface CardDimensions {
  width: number | 'full'
  height: number
  imageSize: number
  aspectRatio?: number
}

export const CARD_DIMENSIONS: Record<CardVariant, Partial<Record<CardSize, CardDimensions>>> = {
  default: {
    small: {
      width: 132,
      height: 196,
      imageSize: 132
    },
    large: {
      width: 160,
      height: 272,
      imageSize: 160
    }
  },
  featured: {
    small: {
      width: 'full',
      height: 420,
      imageSize: 220
    },
    large: {
      width: 'full',
      height: 160,
      imageSize: 160
    }
  },
  horizontal: {
    large: {
      width: 'full',
      height: 142,
      imageSize: 119
    }
  },
  minicard: {
    large: {
      width: 128,
      height: 304,
      imageSize: 256
    }
  },
  'image-only': {
    small: {
      width: 132,
      height: 132,
      imageSize: 132
    },
    large: {
      width: 160,
      height: 264,
      imageSize: 160
    }
  }
} as const

export type CardSizeByVariant<T extends CardVariant> = keyof (typeof CARD_DIMENSIONS)[T]

export interface BaseProductCardProps {
  product: Product
  onPress?: () => void
  isDark?: boolean
  isLoading?: boolean
  style?: StyleProp<ViewStyle>
}

export interface SizeableProductCardProps<T extends CardVariant> extends BaseProductCardProps {
  size?: CardSizeByVariant<T>
}

export type DefaultCardProps = SizeableProductCardProps<'default'>
export type FeaturedCardProps = SizeableProductCardProps<'featured'>
export type HorizontalCardProps = BaseProductCardProps
export type MinicardProps = BaseProductCardProps
export type ImageOnlyCardProps = SizeableProductCardProps<'image-only'>

export function getCardDimensions<T extends CardVariant>(
  variant: T,
  size: CardSizeByVariant<T>
): CardDimensions {
  return CARD_DIMENSIONS[variant][size] as CardDimensions
}

export function isValidSize(size: unknown): size is CardSize {
  return typeof size === 'string' && (size === 'small' || size === 'large')
}

export function isValidCardSize<T extends CardVariant>(
  variant: T,
  size: unknown
): size is CardSizeByVariant<T> {
  return isValidSize(size) && size in CARD_DIMENSIONS[variant]
} 

// Add default export to fix router warnings
const productCardTypes = {
  name: 'ProductCardTypes',
  version: '1.0.0',
  dimensions: CARD_DIMENSIONS
};

export default productCardTypes;