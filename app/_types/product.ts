import { ImageSourcePropType } from 'react-native';
import { ProductStatus, isValidStatus } from './product-status';

export interface ProductColorImages {
  main: string | ImageSourcePropType;
  additional?: (string | ImageSourcePropType)[];
}

export interface ProductColor {
  colorName: string; // Human-readable name like "Negro", "Blanco"
  quantity: number;
  images: ProductColorImages;
  hex?: string; // Hex color code like "#FFFFFF" for display in UI
  isActive?: boolean; // Whether this color is active/available (for filtering)
}

export interface Product {
  id: string;
  title: string;
  price: number;
  categoryId: string; // Added category reference
  modelId: string; // Model identifier for grouping similar products
  images?: (string | ImageSourcePropType)[]; // Array of product images
  frontImage: string | ImageSourcePropType; // Main/front image to display (REQUIRED)
  videoSource?: number | string; // Video source for product displays
  statuses: ProductStatus[]; // Array of product statuses (NEW, FEATURED, etc.)
  /** @deprecated Use shortDescription or longDescription instead */
  description?: string | string[];
  shortDescription?: {
    line1: string;
    line2: string;
  };
  longDescription?: string | string[];
  discountedPrice?: number;
  isCustomizable?: boolean;
  colors: ProductColor[];
  size?: string;
  sizes?: ProductSize[];
  warranty?: string;
  returnPolicy?: string;
  dimensions?: {
    height?: string;
    depth?: string;
    width?: string;
  };
  inStock?: boolean;
  stockCount?: number;
}

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  image: string | ImageSourcePropType;
  isNew?: boolean;
  description?:
    | string
    | string[]
    | {
        line1: string;
        line2: string;
      };
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  quantity?: number;
  color?: string;
  size?: string;
  [key: string]: unknown;
}

// Product Card Types
export type BaseProductCardProps = ProductCardData & {
  onPress?: () => void;
};

export interface PromotionProductCardProps extends BaseProductCardProps {
  discountPercentage: number;
  originalPrice: number;
}

export interface CartProductCardProps extends BaseProductCardProps {
  quantity: number;
  color: string;
  size?: string;
  onEdit?: () => void;
}

export interface FeaturedProductCardProps extends BaseProductCardProps {
  description?: string;
}

export interface HorizontalProductCardProps extends BaseProductCardProps {
  description: string;
  subDescription?: string;
}

export type ImageOnlyProductCardProps = Pick<BaseProductCardProps, 'image' | 'name' | 'onPress'>;

export type ProductCardSize = 'small' | 'large';

export function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;

  const p = value as Partial<Product>;
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    typeof p.price === 'number' &&
    p.frontImage !== undefined &&
    Array.isArray(p.statuses) &&
    p.statuses.every((status) => isValidStatus(status))
  );
}

export function mapProductToCardData(product: Product): ProductCardData {
  const finalPrice = product.discountedPrice ?? product.price;
  const originalPrice = product.discountedPrice ? product.price : undefined;
  const discountPercentage =
    product.discountedPrice && product.price
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : undefined;

  return {
    id: product.id,
    name: product.title,
    price: finalPrice,
    image: product.frontImage,
    isNew: product.statuses.includes(ProductStatus.NEW),
    description:
      product.shortDescription ||
      (product.longDescription
        ? typeof product.longDescription === 'string'
          ? product.longDescription
          : { line1: product.longDescription[0] || '', line2: product.longDescription[1] || '' }
        : { line1: '', line2: '' }),
    originalPrice: originalPrice,
    discountedPrice: product.discountedPrice,
    discountPercentage: discountPercentage,
    color: product.colors?.[0]?.colorName,
    size: product.size,
  };
}

export interface ProductSize {
  value: string; // Maps from Strapi 'name'
  available: boolean; // Maps from Strapi 'isActive'
  stock?: number; // Maps from Strapi 'stock' (defaults to 0)
  code?: string; // Maps from Strapi 'code'
}

// Moving to model.ts

export default { isProduct, mapProductToCardData };
