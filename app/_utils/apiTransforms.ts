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

export interface StrapiProduct {
  id: number;
  attributes: {
    title: string;
    price: number;
    discountedPrice?: number;
    isCustomizable?: boolean;
    warranty?: string;
    returnPolicy?: string;
    shortDescription?: {
      line1: string;
      line2: string;
    };
    longDescription?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    // Relations
    category?: {
      data?: {
        id: number;
        attributes: {
          slug: string;
          name: string;
        };
      };
    };
    model?: {
      data?: {
        id: number;
        attributes: {
          slug: string;
          name: string;
        };
      };
    };
    statuses?: {
      data: {
        id: number;
        attributes: {
          name: string;
          priority: number;
        };
      }[];
    };
    frontImage?: {
      data?: {
        id: number;
        attributes: {
          url: string;
          alternativeText?: string;
        };
      };
    };
    images?: {
      data: {
        id: number;
        attributes: {
          url: string;
          alternativeText?: string;
        };
      }[];
    };
    videoSource?: {
      data?: {
        id: number;
        attributes: {
          url: string;
        };
      };
    };
    colors?: {
      id: number;
      colorName: string;
      quantity: number;
      hex?: string;
      mainImage?: {
        data?: {
          id: number;
          attributes: {
            url: string;
          };
        };
      };
      additionalImages?: {
        data: {
          id: number;
          attributes: {
            url: string;
          };
        }[];
      };
    }[];
    sizes?: {
      id: number;
      value: string;
      available: boolean;
    }[];
    dimensions?: {
      height?: string;
      width?: string;
      depth?: string;
    };
  };
}

/**
 * Transforms a Strapi product response to the app's Product interface
 */
export function transformStrapiProduct(strapiProduct: StrapiProduct): Product {
  const attrs = strapiProduct.attributes;

  // Transform images
  const frontImage = attrs.frontImage?.data?.attributes?.url || '';
  const images = attrs.images?.data?.map((img) => img.attributes.url) || [];

  // Transform video source
  const videoSource = attrs.videoSource?.data?.attributes?.url;

  // Transform statuses
  const statuses = attrs.statuses?.data?.map((status) => status.attributes.name) || [];

  // Transform colors
  const colors: ProductColor[] =
    attrs.colors?.map((color) => ({
      colorName: color.colorName,
      quantity: color.quantity,
      hex: color.hex,
      images: {
        main: color.mainImage?.data?.attributes?.url || frontImage,
        additional: color.additionalImages?.data?.map((img) => img.attributes.url) || [],
      },
    })) || [];

  // Transform long description from rich text to string array
  const longDescription =
    attrs.longDescription !== undefined
      ? transformRichTextToArray(attrs.longDescription)
      : undefined;

  return {
    id: strapiProduct.id.toString(),
    title: attrs.title,
    price: attrs.price,
    discountedPrice: attrs.discountedPrice,
    categoryId: attrs.category?.data?.attributes?.slug || '',
    modelId: attrs.model?.data?.attributes?.slug || '',
    frontImage,
    images,
    videoSource,
    statuses: statuses as any, // Type assertion for ProductStatus enum
    shortDescription: attrs.shortDescription,
    longDescription,
    isCustomizable: attrs.isCustomizable || false,
    colors,
    sizes: attrs.sizes || [],
    warranty: attrs.warranty,
    returnPolicy: attrs.returnPolicy,
    dimensions: attrs.dimensions,
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
    .replace(/<\/li>/g, '\n') // Add newline after list items
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
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
