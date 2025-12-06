import { Product, ProductColor } from '../_types/product';
import { endpoints } from '../_config/endpoints';

// Strapi API response types
export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    [key: string]: any;
  };
}

// Strapi v5 flat media structure
interface StrapiMedia {
  id: number;
  url: string;
  alternativeText?: string | null;
  formats?: Record<string, { url: string }>;
}

// Strapi v5 flat product structure (no attributes wrapper)
export interface StrapiProduct {
  id: number;
  documentId?: string;
  title: string;
  slug?: string;
  price: number;
  discountedPrice?: number;
  isCustomizable?: boolean;
  warranty?: string;
  returnPolicy?: string;
  shortDescription?: {
    id?: number;
    line1: string;
    line2: string;
  };
  longDescription?: string;
  totalStock?: number;
  isActive?: boolean;
  viewCount?: number;
  favoriteCount?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // Relations (flat in Strapi v5)
  category?: {
    id: number;
    slug: string;
    name: string;
  };
  model?: {
    id: number;
    slug: string;
    name: string;
  };
  statuses?: {
    id: number;
    name: string;
    priority: number;
  }[];
  frontImage?: StrapiMedia;
  images?: StrapiMedia[];
  videoSource?: StrapiMedia;
  colors?: {
    id: number;
    colorName: string;
    quantity: number;
    hex?: string;
    isActive?: boolean;
    mainImage?: StrapiMedia;
    additionalImages?: StrapiMedia[];
  }[];
  sizes?: {
    id: number;
    name: string;
    isActive: boolean;
    stock?: number;
    code?: string;
  }[];
  dimensions?: {
    height?: string;
    width?: string;
    depth?: string;
  };
}

/**
 * Transforms a Strapi v5 product response to the app's Product interface
 */
export function transformStrapiProduct(strapiProduct: StrapiProduct): Product {
  // Strapi v5 uses flat structure - no attributes wrapper
  const product = strapiProduct;

  // Transform images - direct url access in v5
  const frontImage = product.frontImage?.url || '';
  const images = product.images?.map((img) => img.url) || [];

  // Transform video source
  const videoSource = product.videoSource?.url;

  // Transform statuses - flat array in v5
  const statuses = product.statuses?.map((status) => status.name) || [];

  // Transform colors - filter out inactive colors
  const colors: ProductColor[] =
    product.colors
      ?.filter((color) => color.isActive !== false)
      .map((color) => ({
        colorName: color.colorName,
        quantity: color.quantity,
        hex: color.hex,
        isActive: color.isActive,
        images: {
          main: color.mainImage?.url || frontImage,
          additional: color.additionalImages?.map((img) => img.url) || [],
        },
      })) || [];

  // Transform sizes to match mobile app format
  const sizes =
    product.sizes?.map((size) => ({
      value: size.name,
      available: size.isActive,
      stock: size.stock || 0,
      code: size.code,
    })) || [];

  // Transform long description from rich text to string array
  const longDescription =
    product.longDescription !== undefined
      ? transformRichTextToArray(product.longDescription)
      : undefined;

  return {
    id: product.id.toString(),
    title: product.title,
    price: product.price,
    discountedPrice: product.discountedPrice,
    categoryId: product.category?.slug || '',
    modelId: product.model?.slug || '',
    frontImage,
    images,
    videoSource,
    statuses: statuses as any,
    shortDescription: product.shortDescription
      ? { line1: product.shortDescription.line1, line2: product.shortDescription.line2 }
      : undefined,
    longDescription,
    isCustomizable: product.isCustomizable || false,
    colors,
    sizes,
    warranty: product.warranty,
    returnPolicy: product.returnPolicy,
    dimensions: product.dimensions,
  };
}

/**
 * Transforms rich text content to an array of strings for backward compatibility
 */
function transformRichTextToArray(richText: string): string[] {
  if (!richText) return [];

  // Remove HTML tags and split by common paragraph separators
  const cleaned = richText
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/li>/g, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();

  // Split by newlines and filter empty strings
  return cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Helper to get full media URL from Strapi
 */
export function getFullMediaUrl(relativeUrl: string, baseUrl?: string): string {
  if (!relativeUrl) return '';

  // If already a full URL, return as is
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }

  // Use provided base URL or centralized configuration
  const apiBaseUrl = baseUrl || endpoints.baseUrl;

  const normalizedPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;

  return `${apiBaseUrl}${normalizedPath}`;
}

// Add default export to fix router warnings
const utilityExport = {
  name: 'ApiTransforms',
  version: '1.0.0',
};

export default utilityExport;
