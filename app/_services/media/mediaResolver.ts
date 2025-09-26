import { Product } from '../../_types/product';
import { config } from '../../_config/environment';

/**
 * Media Resolver Service
 *
 * Handles media path resolution based on environment:
 * - Production: Uses URLs from Strapi (no modification needed)
 * - Development: Maps path references to local assets or placeholders
 * - Testing: Returns mock URLs
 */
export class MediaResolver {
  /**
   * Resolve product media based on environment
   */
  static resolveProductMedia(product: Product): Product {
    // In production or when using Strapi, return as-is
    if (!config.useMockApi) {
      return product;
    }

    // In development with mock API
    if (__DEV__) {
      return {
        ...product,
        frontImage: this.resolveImagePath(product.frontImage),
        videoSource: product.videoSource ? this.resolveVideoPath(product.videoSource) : undefined,
        images: product.images?.map((img) => this.resolveImagePath(img)),
        colors: product.colors.map((color) => ({
          ...color,
          images: {
            main: this.resolveImagePath(color.images.main),
            additional: color.images.additional?.map((img) => this.resolveImagePath(img)) || [],
          },
        })),
      };
    }

    // In testing, return mock URLs
    if (process.env.NODE_ENV === 'test') {
      return {
        ...product,
        frontImage: `/mock-images/${product.id}-front.jpg`,
        videoSource: product.videoSource ? `/mock-videos/${product.id}.mp4` : undefined,
        images: product.images?.map((_, idx) => `/mock-images/${product.id}-${idx}.jpg`),
        colors: product.colors.map((color) => ({
          ...color,
          images: {
            main: `/mock-images/${product.id}-${color.colorName}.jpg`,
            additional:
              color.images.additional?.map(
                (_, idx) => `/mock-images/${product.id}-${color.colorName}-${idx}.jpg`
              ) || [],
          },
        })),
      };
    }

    return product;
  }

  /**
   * Resolve image path to local asset or placeholder
   */
  private static resolveImagePath(path: string | any): string | any {
    // If already a require() result (number), return as-is
    if (typeof path === 'number') {
      return path;
    }

    // If it's a full URL, return as-is
    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
      return path;
    }

    // In development, try to map to local assets
    if (__DEV__ && typeof path === 'string') {
      // This is where we would map paths to local requires if needed
      // For now, return the path as-is since VideoBackground handles strings
      return path;
    }

    return path;
  }

  /**
   * Resolve video path
   */
  private static resolveVideoPath(path: string | any): string | any {
    // If already a require() result (number), return as-is
    if (typeof path === 'number') {
      return path;
    }

    // If it's a full URL, return as-is
    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
      return path;
    }

    // For local development, return the path
    // VideoBackground component will handle loading
    return path;
  }

  /**
   * Batch resolve multiple products
   */
  static resolveProducts(products: Product[]): Product[] {
    return products.map((product) => this.resolveProductMedia(product));
  }
}

/**
 * Local asset mapping for development
 * Maps path strings to require() statements
 *
 * NOTE: This is only used in development when running with mock data.
 * In production, all media comes from Strapi with full URLs.
 */
export const localAssetMap: Record<string, any> = {
  // Add mappings here if needed for specific local assets
  // Example:
  // '/products/mochila-gold.png': require('../../../assets/images/products/mochila-gold.png'),
  // For now, we let the components handle the paths directly
};
