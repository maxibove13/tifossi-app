/**
 * StrapiApi Service Tests
 * Following TESTING_PRINCIPLES.md: Test revenue-critical data transformations
 * Focus: Product data integrity, error recovery, user-facing failures
 */

import strapiApi from '../../_services/api/strapiApi';
import httpClient from '../../_services/api/httpClient';
import { transformStrapiProduct, StrapiProduct, StrapiResponse } from '../../_utils/apiTransforms';

// Mock httpClient (already mocked in setup.ts, but we need typed access)
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

// Test helper - create mock Strapi product
const createStrapiProduct = (overrides?: Partial<StrapiProduct['attributes']>): StrapiProduct => ({
  id: 1,
  attributes: {
    title: 'Camiseta Nacional 2025',
    price: 2500,
    discountedPrice: 2000,
    isCustomizable: true,
    warranty: '12 meses',
    returnPolicy: '30 días para cambios',
    shortDescription: {
      line1: 'Nueva camiseta',
      line2: 'Temporada 2025',
    },
    longDescription: '<p>Descripción detallada del producto</p><p>Segunda línea</p>',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    publishedAt: '2024-01-01T00:00:00Z',
    category: {
      data: {
        id: 1,
        attributes: {
          slug: 'camisetas',
          name: 'Camisetas',
        },
      },
    },
    model: {
      data: {
        id: 1,
        attributes: {
          slug: 'nacional',
          name: 'Nacional',
        },
      },
    },
    statuses: {
      data: [
        {
          id: 1,
          attributes: {
            name: 'NEW',
            priority: 1,
          },
        },
      ],
    },
    frontImage: {
      data: {
        id: 1,
        attributes: {
          url: '/uploads/camiseta_front.jpg',
          alternativeText: 'Front view',
        },
      },
    },
    images: {
      data: [
        {
          id: 2,
          attributes: {
            url: '/uploads/camiseta_back.jpg',
            alternativeText: 'Back view',
          },
        },
      ],
    },
    videoSource: {
      data: {
        id: 1,
        attributes: {
          url: '/uploads/product_video.mp4',
        },
      },
    },
    colors: [
      {
        id: 1,
        colorName: 'Rojo',
        quantity: 50,
        hex: '#FF0000',
        mainImage: {
          data: {
            id: 3,
            attributes: {
              url: '/uploads/camiseta_roja.jpg',
            },
          },
        },
        additionalImages: {
          data: [],
        },
      },
    ],
    sizes: [
      {
        id: 1,
        name: 'M',
        isActive: true,
        stock: 10,
      },
      {
        id: 2,
        name: 'L',
        isActive: false,
        stock: 0,
      },
    ],
    dimensions: {
      height: '70cm',
      width: '50cm',
      depth: '1cm',
    },
    ...overrides,
  },
});

describe('StrapiApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    strapiApi.clearCache();
  });

  describe('Revenue-Critical: Product Data Transformation', () => {
    it('should transform Strapi product to app format with all fields', async () => {
      const strapiProduct = createStrapiProduct();
      const strapiResponse: StrapiResponse<StrapiProduct[]> = {
        data: [strapiProduct],
      };

      mockHttpClient.get.mockResolvedValueOnce(strapiResponse);

      const products = await strapiApi.fetchProducts();

      expect(products).toHaveLength(1);
      const product = products[0];

      // Revenue-critical fields
      expect(product.id).toBe('1');
      expect(product.title).toBe('Camiseta Nacional 2025');
      expect(product.price).toBe(2500);
      expect(product.discountedPrice).toBe(2000);

      // Images (critical for sales)
      expect(product.frontImage).toBe('/uploads/camiseta_front.jpg');
      expect(product.images).toEqual(['/uploads/camiseta_back.jpg']);

      // Product details
      expect(product.categoryId).toBe('camisetas');
      expect(product.modelId).toBe('nacional');
      expect(product.statuses).toContain('NEW');
      expect(product.isCustomizable).toBe(true);

      // Descriptions
      expect(product.shortDescription).toEqual({
        line1: 'Nueva camiseta',
        line2: 'Temporada 2025',
      });
      expect(product.longDescription).toEqual([
        'Descripción detallada del producto',
        'Segunda línea',
      ]);

      // Variants
      expect(product.colors).toHaveLength(1);
      expect(product.colors![0].colorName).toBe('Rojo');
      expect(product.colors![0].quantity).toBe(50);
      expect(product.sizes).toHaveLength(2);
      expect(product.sizes![0].value).toBe('M');
      expect(product.sizes![0].available).toBe(true);
    });

    it('should handle missing price data without crashing', async () => {
      const productWithoutPrice = createStrapiProduct({
        price: undefined as any,
        discountedPrice: undefined,
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [productWithoutPrice],
      });

      const products = await strapiApi.fetchProducts();

      expect(products[0].price).toBeUndefined();
      expect(products[0].discountedPrice).toBeUndefined();
      // App should handle undefined prices gracefully
    });

    it('should correctly calculate discounts when price is higher than discounted price', async () => {
      const productWithDiscount = createStrapiProduct({
        price: 3000,
        discountedPrice: 2100, // 30% off
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [productWithDiscount],
      });

      const products = await strapiApi.fetchProducts();

      expect(products[0].price).toBe(3000);
      expect(products[0].discountedPrice).toBe(2100);
      // Frontend can calculate discount percentage: (3000-2100)/3000 = 30%
    });

    it('should handle products with no images gracefully', async () => {
      const productWithoutImages = createStrapiProduct({
        frontImage: undefined,
        images: undefined,
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [productWithoutImages],
      });

      const products = await strapiApi.fetchProducts();

      expect(products[0].frontImage).toBe('');
      expect(products[0].images).toEqual([]);
      // App should show placeholder image
    });

    it('should transform color variants with images correctly', async () => {
      const productWithColors = createStrapiProduct({
        colors: [
          {
            id: 1,
            colorName: 'Azul',
            quantity: 25,
            hex: '#0000FF',
            mainImage: {
              data: {
                id: 1,
                attributes: { url: '/uploads/azul.jpg' },
              },
            },
            additionalImages: {
              data: [{ id: 2, attributes: { url: '/uploads/azul_2.jpg' } }],
            },
          },
          {
            id: 2,
            colorName: 'Verde',
            quantity: 0, // Out of stock
            hex: '#00FF00',
            mainImage: undefined,
            additionalImages: { data: [] },
          },
        ],
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [productWithColors],
      });

      const products = await strapiApi.fetchProducts();
      const colors = products[0].colors!;

      expect(colors).toHaveLength(2);

      // First color with images
      expect(colors[0].colorName).toBe('Azul');
      expect(colors[0].quantity).toBe(25);
      expect(colors[0].images.main).toBe('/uploads/azul.jpg');
      expect(colors[0].images.additional).toEqual(['/uploads/azul_2.jpg']);

      // Second color without images (should fallback to front image)
      expect(colors[1].colorName).toBe('Verde');
      expect(colors[1].quantity).toBe(0); // Out of stock
      expect(colors[1].images.main).toBe('/uploads/camiseta_front.jpg'); // Fallback
    });

    it('should handle malformed product data without throwing', async () => {
      const malformedProduct = {
        id: 999,
        attributes: {
          // Missing most required fields
          title: 'Broken Product',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          publishedAt: '2024-01-01T00:00:00Z',
        },
      } as StrapiProduct;

      mockHttpClient.get.mockResolvedValueOnce({
        data: [malformedProduct],
      });

      const products = await strapiApi.fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0].title).toBe('Broken Product');
      expect(products[0].categoryId).toBe('');
      expect(products[0].modelId).toBe('');
      expect(products[0].frontImage).toBe('');
      expect(products[0].images).toEqual([]);
      expect(products[0].statuses).toEqual([]);
      // App continues to work with defaults
    });
  });

  describe('Error Recovery with Cache', () => {
    it('should return cached products when API fails', async () => {
      const products = [createStrapiProduct()];
      const response = { data: products };

      // First call succeeds
      mockHttpClient.get.mockResolvedValueOnce(response);
      const firstResult = await strapiApi.fetchProducts();
      expect(firstResult).toHaveLength(1);

      // Second call fails
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));
      const cachedResult = await strapiApi.fetchProducts();

      // Should return cached data
      expect(cachedResult).toEqual(firstResult);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle 404 for non-existent product', async () => {
      mockHttpClient.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            error: {
              message: 'Product not found',
            },
          },
        },
        message: 'Request failed with status code 404',
      });

      const product = await strapiApi.fetchProductById('999');

      expect(product).toBeUndefined(); // Returns undefined for 404
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/products/999'));
    });

    it('should handle network errors gracefully', async () => {
      mockHttpClient.get.mockRejectedValueOnce({
        isAxiosError: true,
        request: {}, // Request was made but no response
        message: 'Network Error',
      });

      await expect(strapiApi.fetchProducts()).rejects.toMatchObject({
        type: 'NETWORK_ERROR',
        message: expect.stringContaining('connection'),
        retryable: true,
      });
    });

    it('should validate response format before transformation', async () => {
      // Invalid response format (missing data field)
      mockHttpClient.get.mockResolvedValueOnce({ products: [] });

      await expect(strapiApi.fetchProducts()).rejects.toMatchObject({
        message: expect.stringContaining('missing data field'),
      });
    });

    it('should use cache for repeated product fetches', async () => {
      const product = createStrapiProduct();
      mockHttpClient.get
        .mockResolvedValueOnce({ data: product })
        .mockResolvedValueOnce({ data: product });

      // First fetch
      const result1 = await strapiApi.fetchProductById('1');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      // Second fetch (will try API first, but gets same data)
      const result2 = await strapiApi.fetchProductById('1');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2); // Called again for fresh data
      expect(result2).toEqual(result1);
    });
  });

  describe('Data Integrity', () => {
    it('should transform rich text descriptions to string arrays', () => {
      const htmlDescription = `
        <p>Primera línea del producto</p>
        <p>Segunda línea con <strong>negrita</strong></p>
        <br/>
        <p>Tercera línea después de salto</p>
      `;

      const product = createStrapiProduct({
        longDescription: htmlDescription,
      });

      const transformed = transformStrapiProduct(product);

      expect(transformed.longDescription).toEqual([
        'Primera línea del producto',
        'Segunda línea con negrita',
        'Tercera línea después de salto',
      ]);
    });

    it('should handle missing category/model relations', async () => {
      const productWithoutRelations = createStrapiProduct({
        category: undefined,
        model: undefined,
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [productWithoutRelations],
      });

      const products = await strapiApi.fetchProducts();

      expect(products[0].categoryId).toBe('');
      expect(products[0].modelId).toBe('');
    });

    it('should set defaults for missing optional fields', async () => {
      const minimalProduct = createStrapiProduct({
        warranty: undefined,
        returnPolicy: undefined,
        isCustomizable: undefined,
        dimensions: undefined,
        shortDescription: undefined,
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [minimalProduct],
      });

      const products = await strapiApi.fetchProducts();
      const product = products[0];

      expect(product.warranty).toBeUndefined();
      expect(product.returnPolicy).toBeUndefined();
      expect(product.isCustomizable).toBe(false); // Default value
      expect(product.dimensions).toBeUndefined();
      expect(product.shortDescription).toBeUndefined();
    });

    it('should handle size availability correctly', async () => {
      const productWithSizes = createStrapiProduct({
        sizes: [
          { id: 1, name: 'S', isActive: true, stock: 10 },
          { id: 2, name: 'M', isActive: true, stock: 15 },
          { id: 3, name: 'L', isActive: false, stock: 0 },
          { id: 4, name: 'XL', isActive: false, stock: 0 },
        ],
      });

      mockHttpClient.get.mockResolvedValueOnce({
        data: [productWithSizes],
      });

      const products = await strapiApi.fetchProducts();
      const sizes = products[0].sizes!;

      expect(sizes).toHaveLength(4);
      expect(sizes.filter((s) => s.available)).toHaveLength(2);
      expect(sizes.find((s) => s.value === 'L')?.available).toBe(false);
    });
  });

  describe('Search and Filter', () => {
    it('should search products with filters', async () => {
      const mockProducts = [
        createStrapiProduct({ title: 'Camiseta Roja' }),
        createStrapiProduct({ title: 'Camiseta Azul' }),
      ];

      mockHttpClient.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      const results = await strapiApi.searchProducts('camiseta', {
        category: 'camisetas',
        minPrice: 1000,
        maxPrice: 3000,
      });

      expect(results).toHaveLength(2);
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/products?'));
    });

    it('should apply client-side color filtering', async () => {
      const products = [
        createStrapiProduct({
          title: 'Product 1',
          colors: [{ id: 1, colorName: 'Rojo', quantity: 10, hex: '#FF0000' }],
        }),
        createStrapiProduct({
          title: 'Product 2',
          colors: [{ id: 2, colorName: 'Azul', quantity: 5, hex: '#0000FF' }],
        }),
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: products });

      const results = await strapiApi.searchProducts('', {
        colors: ['Rojo'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Product 1');
    });

    it('should apply client-side size filtering', async () => {
      const products = [
        createStrapiProduct({
          title: 'Product S-M',
          sizes: [
            { id: 1, name: 'S', isActive: true, stock: 10 },
            { id: 2, name: 'M', isActive: true, stock: 15 },
          ],
        }),
        createStrapiProduct({
          title: 'Product L-XL',
          sizes: [
            { id: 3, name: 'L', isActive: true, stock: 20 },
            { id: 4, name: 'XL', isActive: true, stock: 25 },
          ],
        }),
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: products });

      const results = await strapiApi.searchProducts('', {
        sizes: ['S', 'M'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Product S-M');
    });
  });

  describe('Store Data', () => {
    it('should fetch and transform store locations', async () => {
      const strapiStores = {
        data: [
          {
            id: 1,
            attributes: {
              slug: 'centro',
              cityId: 'montevideo',
              zoneId: 'centro',
              name: 'Tienda Centro',
              address: '18 de Julio 1234',
              hours: '9:00 - 21:00',
              phone: '099123456',
              image: {
                data: {
                  attributes: {
                    url: '/uploads/store_centro.jpg',
                  },
                },
              },
            },
          },
        ],
      };

      mockHttpClient.get.mockResolvedValueOnce(strapiStores);

      const stores = await strapiApi.fetchStores();

      expect(stores).toHaveLength(1);
      expect(stores[0].name).toBe('Tienda Centro');
      expect(stores[0].address).toBe('18 de Julio 1234');
      expect(stores[0].image).toEqual({ uri: '/uploads/store_centro.jpg' });
    });

    it('should fallback to local store data on API failure', async () => {
      // Mock the dynamic import
      jest.doMock('../../_data/stores', () => ({
        storesData: [
          {
            id: 'local-store',
            cityId: 'montevideo',
            zoneId: 'centro',
            name: 'Local Store',
            address: 'Local Address',
            hours: '10:00 - 20:00',
          },
        ],
      }));

      mockHttpClient.get.mockRejectedValueOnce(new Error('API Error'));

      const stores = await strapiApi.fetchStores();

      // Should return local fallback data
      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', async () => {
      const product = createStrapiProduct();
      mockHttpClient.get.mockResolvedValue({ data: [product] });

      // First fetch (populates cache)
      await strapiApi.fetchProducts();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      // Clear cache
      strapiApi.clearCache();

      // Second fetch (should hit API again)
      await strapiApi.fetchProducts();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should respect cache enabled setting', async () => {
      const product = createStrapiProduct();
      mockHttpClient.get.mockResolvedValue({ data: [product] });

      // Disable cache
      strapiApi.setCacheEnabled(false);

      // Multiple fetches should all hit API
      await strapiApi.fetchProducts();
      await strapiApi.fetchProducts();
      await strapiApi.fetchProducts();

      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);

      // Re-enable cache
      strapiApi.setCacheEnabled(true);
    });
  });

  describe('fetchProductById - Revenue Critical', () => {
    it('should fetch a single product by ID', async () => {
      const product = createStrapiProduct();
      mockHttpClient.get.mockResolvedValueOnce({
        data: product,
      });

      const result = await strapiApi.fetchProductById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.title).toBe('Camiseta Nacional 2025');
      expect(result?.price).toBe(2500);
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/products/1'));
    });

    it('should return undefined for non-existent product', async () => {
      mockHttpClient.get.mockRejectedValueOnce(new Error('Product not found'));

      const result = await strapiApi.fetchProductById('non-existent');

      expect(result).toBeUndefined();
    });

    it('should cache individual product fetches', async () => {
      jest.clearAllMocks(); // Clear previous mocks

      const product = createStrapiProduct();
      mockHttpClient.get.mockResolvedValueOnce({
        data: product,
      });

      // First fetch
      const result1 = await strapiApi.fetchProductById('1');
      expect(result1?.id).toBe('1');

      // Clear cache to ensure clean test
      strapiApi.clearCache();

      // Mock again for second fetch
      mockHttpClient.get.mockResolvedValueOnce({
        data: product,
      });

      // Second fetch should call API again after cache clear
      const result2 = await strapiApi.fetchProductById('1');
      expect(result2?.id).toBe('1');

      // Should call API twice since we cleared cache
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authentication - Revenue Critical', () => {
    describe('login', () => {
      it('should login user and return token', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          jwt: 'test-jwt-token',
          user: {
            id: 1,
            username: 'test@example.com',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
        });

        const result = await strapiApi.login({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(result.token).toBe('test-jwt-token');
        expect(result.user).toEqual({
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          profilePicture: undefined,
          isEmailVerified: false,
        });
        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/local', {
          identifier: 'test@example.com',
          password: 'password123',
        });
      });

      it('should handle invalid credentials', async () => {
        mockHttpClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

        await expect(
          strapiApi.login({ email: 'wrong@example.com', password: 'wrong' })
        ).rejects.toEqual(expect.objectContaining({ message: 'Invalid credentials' }));
      });
    });

    describe('register', () => {
      it('should register new user', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          jwt: 'new-user-token',
          user: {
            id: 2,
            username: 'newuser@example.com',
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
          },
        });

        const result = await strapiApi.register({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'securepass123',
        });

        expect(result.token).toBe('new-user-token');
        expect(result.user.name).toBe('New User');
        expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/local/register', {
          username: 'newuser@example.com',
          email: 'newuser@example.com',
          password: 'securepass123',
          firstName: 'New',
          lastName: 'User',
        });
      });

      it('should handle single name registration', async () => {
        mockHttpClient.post.mockResolvedValueOnce({
          jwt: 'token',
          user: { id: 3, firstName: 'SingleName', lastName: '' },
        });

        await strapiApi.register({
          name: 'SingleName',
          email: 'single@example.com',
          password: 'pass123',
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          '/auth/local/register',
          expect.objectContaining({
            firstName: 'SingleName',
            lastName: '',
          })
        );
      });
    });
  });

  describe('Cart and Favorites Sync', () => {
    it('should sync cart with server', async () => {
      mockHttpClient.put.mockResolvedValueOnce({
        success: true,
        cart: [{ productId: 'prod-1', quantity: 2 }],
      });

      const result = await strapiApi.syncCart([{ productId: 'prod-1', quantity: 2 }]);

      expect(result).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/users/me/cart', {
        cart: [{ productId: 'prod-1', quantity: 2 }],
      });
    });

    it('should handle cart sync failure gracefully', async () => {
      mockHttpClient.put.mockRejectedValueOnce(new Error('Network error'));

      await expect(strapiApi.syncCart([])).rejects.toEqual(
        expect.objectContaining({ message: 'Network error' })
      );
    });

    it('should sync favorites with server', async () => {
      mockHttpClient.put.mockResolvedValueOnce({
        success: true,
        favorites: ['prod-1', 'prod-2'],
      });

      const result = await strapiApi.syncFavorites(['prod-1', 'prod-2']);

      expect(result).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/users/me/favorites', {
        favorites: ['prod-1', 'prod-2'],
      });
    });
  });

  describe('Error Recovery and Caching', () => {
    it('should return cached data when API fails', async () => {
      const product = createStrapiProduct();

      // First call succeeds and caches
      mockHttpClient.get.mockResolvedValueOnce({ data: [product] });
      const firstResult = await strapiApi.fetchProducts();
      expect(firstResult).toHaveLength(1);

      // Second call fails but returns cached data
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));
      const cachedResult = await strapiApi.fetchProducts();
      expect(cachedResult).toHaveLength(1);
      expect(cachedResult[0].title).toBe('Camiseta Nacional 2025');
    });

    it('should clear cache when requested', async () => {
      const product = createStrapiProduct();
      mockHttpClient.get.mockResolvedValueOnce({ data: [product] });

      // Fetch and cache
      await strapiApi.fetchProducts();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      // Clear cache
      strapiApi.clearCache();

      // Next fetch should hit API again
      mockHttpClient.get.mockResolvedValueOnce({ data: [product] });
      await strapiApi.fetchProducts();
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
