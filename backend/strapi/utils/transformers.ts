/**
 * Data transformation utilities for converting between Strapi format and mobile app format
 * Ensures perfect compatibility with existing TypeScript interfaces
 */

import {
  StrapiProductEntity,
  StrapiCategoryEntity,
  ProductTransformed,
  StrapiMedia,
} from '../types/generated';

/**
 * Extract URL from Strapi media object
 */
export function getMediaUrl(media: StrapiMedia): string | undefined {
  return media?.data?.attributes?.url;
}

/**
 * Extract URLs from Strapi media array
 */
export function getMediaUrls(mediaArray: { data: StrapiMedia['data'][] }): string[] {
  return (
    mediaArray?.data
      ?.map((item) => item?.attributes?.url)
      .filter((url): url is string => Boolean(url)) || []
  );
}

/**
 * Transform Strapi product entity to mobile app format
 * Maintains 100% compatibility with existing Product interface
 */
export function transformProduct(strapiProduct: StrapiProductEntity): ProductTransformed {
  const {
    id,
    attributes: {
      title,
      price,
      discountedPrice,
      shortDescription,
      longDescription,
      frontImage,
      images,
      videoSource,
      category,
      model,
      statuses,
      isCustomizable,
      warranty,
      returnPolicy,
      colors,
      sizes,
      dimensions,
    },
  } = strapiProduct;

  // Transform colors to match mobile app format
  const transformedColors = colors.map((color) => ({
    colorName: color.colorName,
    quantity: color.quantity,
    hex: color.hex,
    images: {
      main: getMediaUrl(color.mainImage) || '',
      additional: getMediaUrls(color.additionalImages),
    },
  }));

  // Transform sizes to match mobile app format
  const transformedSizes = sizes?.map((size) => ({
    value: size.value,
    available: size.available,
  }));

  // Transform dimensions to match mobile app format
  const transformedDimensions = dimensions
    ? {
        height: dimensions.height,
        width: dimensions.width,
        depth: dimensions.depth,
      }
    : undefined;

  return {
    id: id.toString(),
    title,
    price,
    discountedPrice,
    categoryId: category?.data?.attributes?.slug || '',
    modelId: model?.data?.attributes?.slug || '',
    frontImage: getMediaUrl(frontImage) || '',
    images: getMediaUrls(images || { data: [] }),
    videoSource: videoSource ? getMediaUrl(videoSource) : undefined,
    statuses: statuses?.data?.map((status) => status.attributes.name) || [],
    shortDescription: shortDescription
      ? {
          line1: shortDescription.line1,
          line2: shortDescription.line2,
        }
      : undefined,
    longDescription,
    isCustomizable,
    warranty,
    returnPolicy,
    colors: transformedColors,
    sizes: transformedSizes,
    dimensions: transformedDimensions,
  };
}

/**
 * Transform array of Strapi products to mobile app format
 */
export function transformProducts(strapiProducts: StrapiProductEntity[]): ProductTransformed[] {
  return strapiProducts.map(transformProduct);
}

/**
 * Transform Strapi category to mobile app format
 */
export function transformCategory(strapiCategory: StrapiCategoryEntity) {
  const { id: _id, attributes } = strapiCategory;

  return {
    id: attributes.slug,
    name: attributes.name,
    slug: attributes.slug,
    isLabel: attributes.isLabel,
    labelType: attributes.labelType,
    displayOrder: attributes.displayOrder,
    description: attributes.description,
    isActive: attributes.isActive,
    icon: attributes.icon ? getMediaUrl(attributes.icon) : undefined,
  };
}

/**
 * Transform array of Strapi categories to mobile app format
 */
export function transformCategories(strapiCategories: StrapiCategoryEntity[]) {
  return strapiCategories.map(transformCategory);
}

/**
 * Create API population object for products
 * Ensures all related data is fetched in a single request
 */
export const PRODUCT_POPULATE = {
  populate: {
    frontImage: {
      fields: ['url', 'alternativeText', 'width', 'height'],
    },
    images: {
      fields: ['url', 'alternativeText', 'width', 'height'],
    },
    videoSource: {
      fields: ['url', 'alternativeText'],
    },
    category: {
      fields: ['name', 'slug'],
    },
    model: {
      fields: ['name', 'slug'],
    },
    statuses: {
      fields: ['name', 'labelEs', 'priority'],
    },
    colors: {
      populate: {
        mainImage: {
          fields: ['url', 'alternativeText', 'width', 'height'],
        },
        additionalImages: {
          fields: ['url', 'alternativeText', 'width', 'height'],
        },
      },
    },
    sizes: true,
    dimensions: true,
    shortDescription: true,
    seo: {
      populate: {
        ogImage: {
          fields: ['url', 'alternativeText'],
        },
      },
    },
  },
};

/**
 * Create API population object for categories
 */
export const CATEGORY_POPULATE = {
  populate: {
    icon: {
      fields: ['url', 'alternativeText'],
    },
    seo: {
      populate: {
        ogImage: {
          fields: ['url', 'alternativeText'],
        },
      },
    },
  },
};

/**
 * Create API population object for orders
 */
export const ORDER_POPULATE = {
  populate: {
    user: {
      fields: ['username', 'email', 'firstName', 'lastName'],
    },
    items: {
      populate: {
        product: {
          fields: ['title', 'slug'],
          populate: {
            frontImage: {
              fields: ['url', 'alternativeText'],
            },
          },
        },
      },
    },
    shippingAddress: true,
    storeLocation: {
      fields: ['name', 'code', 'phoneNumber'],
      populate: {
        address: true,
      },
    },
  },
};

/**
 * Filter products by category
 * Handles both regular categories and label-based categories
 */
export function filterProductsByCategory(
  products: ProductTransformed[],
  categoryId: string
): ProductTransformed[] {
  if (categoryId === 'todo') {
    return products;
  }

  // Check if it's a label-based category (matches product status)
  const labelCategories = [
    'new',
    'sale',
    'featured',
    'opportunity',
    'recommended',
    'popular',
    'app_exclusive',
    'highlighted',
  ];
  if (labelCategories.includes(categoryId)) {
    return products.filter((product) => product.statuses.includes(categoryId));
  }

  // Regular category filtering
  return products.filter((product) => product.categoryId === categoryId);
}

/**
 * Filter products by model within a category
 */
export function filterProductsByModel(
  products: ProductTransformed[],
  categoryId: string,
  modelId: string
): ProductTransformed[] {
  const categoryProducts = filterProductsByCategory(products, categoryId);

  if (modelId === 'todos') {
    return categoryProducts;
  }

  return categoryProducts.filter((product) => product.modelId === modelId);
}

/**
 * Sort products by priority (status-based)
 */
export function sortProductsByPriority(products: ProductTransformed[]): ProductTransformed[] {
  const statusPriority = {
    highlighted: 90,
    app_exclusive: 80,
    sale: 70,
    opportunity: 65,
    new: 60,
    featured: 50,
    recommended: 40,
    popular: 30,
  };

  return products.sort((a, b) => {
    const aMaxPriority = Math.max(
      ...a.statuses.map((status) => statusPriority[status as keyof typeof statusPriority] || 0)
    );
    const bMaxPriority = Math.max(
      ...b.statuses.map((status) => statusPriority[status as keyof typeof statusPriority] || 0)
    );

    return bMaxPriority - aMaxPriority;
  });
}

/**
 * Error handling for API responses
 */
export function handleStrapiError(error: any) {
  console.error('Strapi API Error:', error);

  if (error.response?.data?.error) {
    const strapiError = error.response.data.error;
    return {
      message: strapiError.message || 'API Error',
      status: strapiError.status || 500,
      details: strapiError.details || {},
    };
  }

  return {
    message: error.message || 'Unknown API Error',
    status: 500,
    details: {},
  };
}
