/**
 * API Transforms Tests
 * Testing data transformation functions that convert Strapi v5 responses to app format
 */

import { transformStrapiProduct, getFullMediaUrl, StrapiProduct } from '../../_utils/apiTransforms';

describe('API Transforms', () => {
  describe('transformStrapiProduct', () => {
    const createMockStrapiProduct = (overrides?: Partial<StrapiProduct>): StrapiProduct => ({
      id: 1,
      title: 'Test Product',
      price: 99.99,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      publishedAt: '2024-01-01T00:00:00Z',
      ...overrides,
    });

    it('should transform basic product data', () => {
      const strapiProduct = createMockStrapiProduct();

      const result = transformStrapiProduct(strapiProduct);

      expect(result).toEqual({
        id: '1',
        title: 'Test Product',
        price: 99.99,
        discountedPrice: undefined,
        categoryId: '',
        modelId: '',
        frontImage: '',
        images: [],
        videoSource: undefined,
        statuses: [],
        shortDescription: undefined,
        longDescription: undefined,
        isCustomizable: false,
        colors: [],
        sizes: [],
        warranty: undefined,
        returnPolicy: undefined,
        dimensions: undefined,
      });
    });

    it('should transform product with discount', () => {
      const strapiProduct = createMockStrapiProduct({
        price: 100,
        discountedPrice: 75,
      });

      const result = transformStrapiProduct(strapiProduct);

      expect(result.price).toBe(100);
      expect(result.discountedPrice).toBe(75);
    });

    it('should transform category and model relations', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Relations',
        price: 99.99,
        category: {
          id: 1,
          slug: 'shirts',
          name: 'Shirts',
        },
        model: {
          id: 2,
          slug: 'casual',
          name: 'Casual',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.categoryId).toBe('shirts');
      expect(result.modelId).toBe('casual');
    });

    it('should transform images correctly', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Images',
        price: 99.99,
        frontImage: {
          id: 1,
          url: '/uploads/front_image.jpg',
          alternativeText: 'Front view',
        },
        images: [
          {
            id: 2,
            url: '/uploads/image1.jpg',
            alternativeText: 'View 1',
          },
          {
            id: 3,
            url: '/uploads/image2.jpg',
            alternativeText: 'View 2',
          },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.frontImage).toBe('http://localhost:1337/uploads/front_image.jpg');
      expect(result.images).toEqual([
        'http://localhost:1337/uploads/image1.jpg',
        'http://localhost:1337/uploads/image2.jpg',
      ]);
    });

    it('should transform product colors with images', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Colorful Product',
        price: 99.99,
        frontImage: {
          id: 1,
          url: '/uploads/default.jpg',
          alternativeText: 'Default',
        },
        colors: [
          {
            id: 1,
            colorName: 'Red',
            quantity: 10,
            hex: '#FF0000',
            mainImage: {
              id: 2,
              url: '/uploads/red_main.jpg',
            },
            additionalImages: [
              {
                id: 3,
                url: '/uploads/red_1.jpg',
              },
            ],
          },
          {
            id: 2,
            colorName: 'Blue',
            quantity: 5,
            hex: '#0000FF',
            // No images for this color
          },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.colors).toHaveLength(2);
      expect(result.colors[0]).toEqual({
        colorName: 'Red',
        quantity: 10,
        hex: '#FF0000',
        isActive: undefined,
        images: {
          main: 'http://localhost:1337/uploads/red_main.jpg',
          additional: ['http://localhost:1337/uploads/red_1.jpg'],
        },
      });
      expect(result.colors[1]).toEqual({
        colorName: 'Blue',
        quantity: 5,
        hex: '#0000FF',
        isActive: undefined,
        images: {
          main: 'http://localhost:1337/uploads/default.jpg', // Falls back to frontImage
          additional: [],
        },
      });
    });

    it('should transform sizes array', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Sized Product',
        price: 99.99,
        sizes: [
          { id: 1, name: 'S', isActive: true, stock: 10 },
          { id: 2, name: 'M', isActive: true, stock: 15 },
          { id: 3, name: 'L', isActive: false, stock: 0 },
          { id: 4, name: 'XL', isActive: true, stock: 20 },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.sizes).toHaveLength(4);
      expect(result.sizes?.[2]).toEqual({
        value: 'L',
        available: false,
        stock: 0,
        code: undefined,
      });
    });

    it('should transform product statuses', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Statuses',
        price: 99.99,
        statuses: [
          { id: 1, name: 'new', priority: 1 },
          { id: 2, name: 'opportunity', priority: 2 },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.statuses).toEqual(['new', 'opportunity']);
    });

    it('should transform short description', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Described Product',
        price: 99.99,
        shortDescription: {
          line1: 'First line of description',
          line2: 'Second line of description',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.shortDescription).toEqual({
        line1: 'First line of description',
        line2: 'Second line of description',
      });
    });

    it('should transform long description from rich text', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Rich Text',
        price: 99.99,
        longDescription: '<p>First paragraph</p><p>Second paragraph</p><br/>Third line',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.longDescription).toEqual(['First paragraph', 'Second paragraph', 'Third line']);
    });

    it('should handle empty long description', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product',
        price: 99.99,
        longDescription: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.longDescription).toEqual([]);
    });

    it('should handle complex HTML in long description', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product',
        price: 99.99,
        longDescription:
          '<div><p>Paragraph with <strong>bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul></div>',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.longDescription).toEqual([
        'Paragraph with bold and italic',
        'Item 1',
        'Item 2',
      ]);
    });

    it('should transform product dimensions', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Dimensions',
        price: 99.99,
        dimensions: {
          height: '10cm',
          width: '20cm',
          depth: '5cm',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.dimensions).toEqual({
        height: '10cm',
        width: '20cm',
        depth: '5cm',
      });
    });

    it('should handle missing or null values gracefully', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Minimal Product',
        price: 99.99,
        category: undefined,
        model: undefined,
        frontImage: null as any,
        images: undefined,
        colors: undefined,
        sizes: null as any,
        statuses: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.categoryId).toBe('');
      expect(result.modelId).toBe('');
      expect(result.frontImage).toBe('');
      expect(result.images).toEqual([]);
      expect(result.colors).toEqual([]);
      expect(result.sizes).toEqual([]);
      expect(result.statuses).toEqual([]);
    });

    it('should transform video source', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Video',
        price: 99.99,
        videoSource: {
          id: 1,
          url: '/uploads/product_video.mp4',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.videoSource).toBe('http://localhost:1337/uploads/product_video.mp4');
    });

    it('should transform warranty and return policy', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Product with Policies',
        price: 99.99,
        warranty: '2 years manufacturer warranty',
        returnPolicy: '30 days return policy',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.warranty).toBe('2 years manufacturer warranty');
      expect(result.returnPolicy).toBe('30 days return policy');
    });

    it('should set isCustomizable flag', () => {
      const strapiProduct: StrapiProduct = {
        id: 1,
        title: 'Customizable Product',
        price: 99.99,
        isCustomizable: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformStrapiProduct(strapiProduct);

      expect(result.isCustomizable).toBe(true);
    });
  });

  describe('getFullMediaUrl', () => {
    it('should return empty string for empty input', () => {
      expect(getFullMediaUrl('')).toBe('');
      expect(getFullMediaUrl('', 'https://api.example.com')).toBe('');
    });

    it('should return full URL unchanged', () => {
      const fullUrl = 'https://cdn.example.com/image.jpg';

      expect(getFullMediaUrl(fullUrl)).toBe(fullUrl);
      expect(getFullMediaUrl(fullUrl, 'https://api.example.com')).toBe(fullUrl);
    });

    it('should return full URL for http URLs', () => {
      const httpUrl = 'http://cdn.example.com/image.jpg';

      expect(getFullMediaUrl(httpUrl)).toBe(httpUrl);
    });

    it('should prepend base URL to relative paths', () => {
      const relativePath = '/uploads/image.jpg';
      const baseUrl = 'https://api.example.com';

      expect(getFullMediaUrl(relativePath, baseUrl)).toBe(
        'https://api.example.com/uploads/image.jpg'
      );
    });

    it('should use default base URL when not provided', () => {
      // Mock the endpoints config
      jest.mock('../../_config/endpoints', () => ({
        endpoints: {
          baseUrl: 'https://default.api.com',
        },
      }));

      const relativePath = '/uploads/image.jpg';

      // This will use the centralized configuration
      const result = getFullMediaUrl(relativePath);

      expect(result.startsWith('http')).toBe(true);
      expect(result.includes('/uploads/image.jpg')).toBe(true);
    });

    it('should handle paths without leading slash', () => {
      const path = 'uploads/image.jpg';
      const baseUrl = 'https://api.example.com';

      expect(getFullMediaUrl(path, baseUrl)).toBe('https://api.example.com/uploads/image.jpg');
    });

    it('should handle base URL with trailing slash', () => {
      const relativePath = '/uploads/image.jpg';
      const baseUrl = 'https://api.example.com/';

      expect(getFullMediaUrl(relativePath, baseUrl)).toBe(
        'https://api.example.com//uploads/image.jpg'
      );
    });
  });
});
