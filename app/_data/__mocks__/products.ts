// Mock products data for tests
// This replaces require() calls with URL strings to avoid file loading issues in CI/CD

import { Product } from '../../_types/product';
import { ProductStatus } from '../../_types/product-status';

// Import the original products to get the structure
const originalProducts = jest.requireActual('../products.ts').products;

// Transform products to use URL strings instead of require() calls
export const products: Product[] = originalProducts.map((product: any) => {
  // Convert any require() calls to mock URLs
  const transformed = { ...product };

  // Handle frontImage
  if (typeof product.frontImage === 'number') {
    // This was a require() call, replace with mock URL
    transformed.frontImage = `/mock-images/${product.id}-front.jpg`;
  }

  // Handle videoSource - already converted to strings in the actual file
  // but ensure it's a string for consistency
  if (product.videoSource) {
    if (typeof product.videoSource === 'number') {
      transformed.videoSource = `/mock-videos/${product.id}.mp4`;
    }
    // else it's already a string URL, keep it as is
  }

  // Handle images array
  if (product.images && Array.isArray(product.images)) {
    transformed.images = product.images.map((img: any, index: number) => {
      if (typeof img === 'number') {
        return `/mock-images/${product.id}-${index}.jpg`;
      }
      return img;
    });
  }

  // Handle colors with images
  if (product.colors && Array.isArray(product.colors)) {
    transformed.colors = product.colors.map((color: any) => ({
      ...color,
      images: {
        main:
          typeof color.images?.main === 'number'
            ? `/mock-images/${product.id}-${color.colorName}.jpg`
            : color.images?.main,
        additional:
          color.images?.additional?.map((img: any, idx: number) =>
            typeof img === 'number'
              ? `/mock-images/${product.id}-${color.colorName}-${idx}.jpg`
              : img
          ) || [],
      },
    }));
  }

  return transformed;
});

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter((product) => product.categoryId === categoryId);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((product) => product.statuses?.includes(ProductStatus.FEATURED));
};

export const getNewProducts = (): Product[] => {
  return products.filter((product) => product.statuses?.includes(ProductStatus.NEW));
};
