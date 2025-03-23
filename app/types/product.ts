import { ImageSourcePropType } from 'react-native';
import { ProductStatus, ProductLabel, isValidStatus, isValidLabel } from './product-status';

export interface ProductColorImages {
  main: string | ImageSourcePropType;
  additional?: Array<string | ImageSourcePropType>;
}

export interface ProductColor {
  color: string;
  quantity: number;
  images: ProductColorImages;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string | ImageSourcePropType;
  label?: ProductLabel;
  status?: ProductStatus;
  /** @deprecated Use shortDescription or longDescription instead */
  description?: string | string[];
  shortDescription?: {
    line1: string;
    line2: string;
  };
  longDescription?: string | string[];
  discountedPrice?: number;
  isCustomizable?: boolean;
  colors?: ProductColor[];
  size?: string;
  sizes?: ProductSize[];
  warranty?: string;
  returnPolicy?: string;
  dimensions?: {
    height?: string;
    depth?: string;
    width?: string;
  };
}

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  image: string | ImageSourcePropType;
  isNew?: boolean;
  description?: string | string[] | {
    line1: string;
    line2: string;
  };
  discountPercentage?: number;
  originalPrice?: number;
  quantity?: number;
  color?: string;
  size?: string;
}

// Product Card Types
export type BaseProductCardProps = ProductCardData & {
  onPress?: () => void
}

export interface PromotionProductCardProps extends BaseProductCardProps {
  discountPercentage: number
  originalPrice: number
}

export interface CartProductCardProps extends BaseProductCardProps {
  quantity: number
  color?: string
  size?: string
  onEdit?: () => void
}

export interface FeaturedProductCardProps extends BaseProductCardProps {
  description?: string
}

export interface HorizontalProductCardProps extends BaseProductCardProps {
  description: string
  subDescription?: string
}

export type ImageOnlyProductCardProps = Pick<BaseProductCardProps, 'image' | 'name' | 'onPress'>

export type ProductCardSize = 'small' | 'large'

export function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;

  const p = value as Partial<Product>;
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    typeof p.price === 'number' &&
    (!p.status || isValidStatus(p.status)) &&
    (!p.label || isValidLabel(p.label))
  );
}

export function mapProductToCardData(product: Product): ProductCardData {
  return {
    id: product.id,
    name: product.title,
    price: product.discountedPrice || product.price,
    image: product.image,
    isNew: product.label === ProductLabel.NEW,
    description: product.shortDescription || { line1: '', line2: '' },
    originalPrice: product.discountedPrice ? product.price : undefined,
    discountPercentage: product.discountedPrice 
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : undefined,
    color: product.colors?.[0]?.color,
    size: product.size,
  }
}

export interface ProductSize {
  value: string;
  available: boolean;
}

export default { isProduct, mapProductToCardData }; 