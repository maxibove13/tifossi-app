/**
 * Product Store Tests
 * Testing product fetching, filtering, and search with MSW mocked API
 * Tests the real productStore implementation with proper MSW handlers
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProductStore, ProductHelpers } from '../../_stores/productStore';
import { ProductStatus } from '../../_types/product-status';
import { productMockData } from '../mocks/data/products';
import httpClient from '../../_services/api/httpClient';

describe('productStore', () => {
  beforeEach(() => {
    // Reset store state completely before each test
    useProductStore.getState().invalidateCache();

    // Clear any persisted state
    useProductStore.setState({
      products: [],
      productCache: {},
      isLoading: false,
      error: null,
      lastFetchTimestamp: null,
      actionStatus: {
        fetchProducts: 'idle',
        fetchProductById: 'idle',
        refresh: 'idle',
      },
    });
  });

  afterEach(() => {
    // Clean up any pending timers or async operations
    jest.clearAllTimers();
  });

  describe('fetchProducts', () => {
    it('should fetch products successfully', async () => {
      const { result } = renderHook(() => useProductStore());

      await act(async () => {
        await result.current.fetchProducts();
      });

      await waitFor(() => {
        expect(result.current.products.length).toBeGreaterThan(0);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.actionStatus.fetchProducts).toBe('success');
      });

      // Verify products have expected structure
      const firstProduct = result.current.products[0];
      expect(firstProduct).toHaveProperty('id');
      expect(firstProduct).toHaveProperty('title');
      expect(firstProduct).toHaveProperty('price');
      expect(firstProduct).toHaveProperty('categoryId');
      expect(firstProduct).toHaveProperty('modelId');
      expect(firstProduct).toHaveProperty('frontImage');
      expect(Array.isArray(firstProduct.statuses)).toBe(true);
      expect(Array.isArray(firstProduct.colors)).toBe(true);
    });

    it('should handle fetch error', async () => {
      // Mock HTTP client to return error
      (httpClient as any).__setError(true, '/products');

      const { result } = renderHook(() => useProductStore());

      await act(async () => {
        await result.current.fetchProducts();
      });

      expect(result.current.products).toHaveLength(0);
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.actionStatus.fetchProducts).toBe('error');

      // Reset error state
      (httpClient as any).__setError(false);
    });

    it('should set loading state during fetch', async () => {
      const { result } = renderHook(() => useProductStore());

      // Start fetch without waiting
      act(() => {
        result.current.fetchProducts();
      });

      // Check loading state immediately
      expect(result.current.isLoading).toBe(true);
      expect(result.current.actionStatus.fetchProducts).toBe('loading');

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.actionStatus.fetchProducts).toBe('success');
      });
    });

    it('should use cache when data is fresh', async () => {
      const { result } = renderHook(() => useProductStore());

      // First fetch
      await act(async () => {
        await result.current.fetchProducts();
      });

      const firstFetchTimestamp = result.current.lastFetchTimestamp;
      const firstProductCount = result.current.products.length;

      // Second fetch should use cache
      await act(async () => {
        await result.current.fetchProducts();
      });

      expect(result.current.lastFetchTimestamp).toBe(firstFetchTimestamp);
      expect(result.current.products.length).toBe(firstProductCount);
    });

    it('should force refetch when force parameter is true', async () => {
      const { result } = renderHook(() => useProductStore());

      // First fetch
      await act(async () => {
        await result.current.fetchProducts();
      });

      const firstFetchTimestamp = result.current.lastFetchTimestamp;

      // Force refetch
      await act(async () => {
        await result.current.fetchProducts(true);
      });

      expect(result.current.lastFetchTimestamp).toBeGreaterThan(firstFetchTimestamp!);
    });
  });

  describe('fetchProductById', () => {
    it('should fetch single product successfully', async () => {
      const { result } = renderHook(() => useProductStore());
      const rawProductId = productMockData[0].id;
      // The mock transforms id "1" to documentId "doc-1"
      const transformedProductId = `doc-${rawProductId}`;

      let product: any;
      await act(async () => {
        product = await result.current.fetchProductById(rawProductId);
      });

      expect(product).toBeDefined();
      expect(product.id).toBe(transformedProductId);
      // Cache uses the request ID as the key, not the transformed product ID
      expect(result.current.productCache[rawProductId]).toBeDefined();
      expect(result.current.actionStatus.fetchProductById).toBe('success');
    });

    it('should handle product not found', async () => {
      const { result } = renderHook(() => useProductStore());

      let product: any;
      await act(async () => {
        product = await result.current.fetchProductById('999'); // Non-existent ID
      });

      expect(product).toBeUndefined();
      expect(result.current.error).toBeTruthy();
      expect(result.current.actionStatus.fetchProductById).toBe('error');
    });

    it('should use cache for repeated requests', async () => {
      const { result } = renderHook(() => useProductStore());
      const rawProductId = productMockData[0].id;

      // First fetch
      let product1: any;
      await act(async () => {
        product1 = await result.current.fetchProductById(rawProductId);
      });

      // Second fetch should use cache
      let product2: any;
      await act(async () => {
        product2 = await result.current.fetchProductById(rawProductId);
      });

      expect(product1).toEqual(product2);
      // Cache uses the request ID as the key
      expect(result.current.productCache[rawProductId]).toBeDefined();
    });
  });

  describe('getProductById', () => {
    it('should get product from products array', async () => {
      const { result } = renderHook(() => useProductStore());

      await act(async () => {
        await result.current.fetchProducts();
      });

      const firstProductId = result.current.products[0].id;
      const product = result.current.getProductById(firstProductId);

      expect(product).toBeDefined();
      expect(product?.id).toBe(firstProductId);
    });

    it('should get product from cache', async () => {
      const { result } = renderHook(() => useProductStore());
      const rawProductId = productMockData[0].id;
      const transformedProductId = `doc-${rawProductId}`;

      // Add product to cache via fetchProductById
      await act(async () => {
        await result.current.fetchProductById(rawProductId);
      });

      // getProductById looks in both products array and productCache using the given ID
      // Cache uses request ID as key, so we look up by rawProductId
      const product = result.current.getProductById(rawProductId);

      expect(product).toBeDefined();
      expect(product?.id).toBe(transformedProductId);
    });

    it('should return undefined for non-existent product', () => {
      const { result } = renderHook(() => useProductStore());

      const product = result.current.getProductById('non-existent-id');
      expect(product).toBeUndefined();
    });
  });

  describe('searchProducts', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useProductStore());
      await act(async () => {
        await result.current.fetchProducts();
      });
    });

    it('should search products by title', async () => {
      const { result } = renderHook(() => useProductStore());

      // Use a common term from mock data
      const searchResults = result.current.searchProducts('Camiseta');

      expect(Array.isArray(searchResults)).toBe(true);
      searchResults.forEach((product) => {
        expect(product.title.toLowerCase()).toContain('camiseta');
      });
    });

    it('should search case-insensitively', async () => {
      const { result } = renderHook(() => useProductStore());

      const lowerCaseResults = result.current.searchProducts('nacional');
      const upperCaseResults = result.current.searchProducts('NACIONAL');

      expect(lowerCaseResults.length).toBe(upperCaseResults.length);
      expect(lowerCaseResults.length).toBeGreaterThan(0);
    });

    it('should search in shortDescription', async () => {
      const { result } = renderHook(() => useProductStore());

      const searchResults = result.current.searchProducts('oficial');

      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should search in longDescription', async () => {
      const { result } = renderHook(() => useProductStore());

      const searchResults = result.current.searchProducts('calidad');

      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const { result } = renderHook(() => useProductStore());

      const searchResults = result.current.searchProducts('NonExistentProductXYZ');

      expect(searchResults).toHaveLength(0);
    });

    it('should return all products for empty query', async () => {
      const { result } = renderHook(() => useProductStore());

      const allProducts = result.current.products;
      const emptySearchResults = result.current.searchProducts('');

      expect(emptySearchResults.length).toBe(allProducts.length);
    });
  });

  describe('filterProductsByCategory', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useProductStore());
      await act(async () => {
        await result.current.fetchProducts();
      });
    });

    it('should filter products by category', async () => {
      const { result } = renderHook(() => useProductStore());

      const apparelProducts = result.current.filterProductsByCategory('apparel');

      expect(Array.isArray(apparelProducts)).toBe(true);
      apparelProducts.forEach((product) => {
        expect(product.categoryId).toBe('apparel');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const { result } = renderHook(() => useProductStore());

      const results = result.current.filterProductsByCategory('non-existent-category');

      expect(results).toHaveLength(0);
    });
  });

  describe('refreshProducts', () => {
    it('should refresh products data', async () => {
      const { result } = renderHook(() => useProductStore());

      await act(async () => {
        await result.current.refreshProducts();
      });

      expect(result.current.products.length).toBeGreaterThan(0);
      expect(result.current.actionStatus.refresh).toBe('success');
    });

    it('should handle refresh errors', async () => {
      const { result } = renderHook(() => useProductStore());

      // Mock HTTP client to return error
      (httpClient as any).__setError(true, '/products');

      let caughtError = false;
      await act(async () => {
        try {
          await result.current.refreshProducts();
        } catch {
          caughtError = true;
        }
      });

      expect(caughtError).toBe(true);
      expect(result.current.actionStatus.refresh).toBe('error');

      // Reset error state
      (httpClient as any).__setError(false);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache correctly', async () => {
      const { result } = renderHook(() => useProductStore());

      // Force fetch to bypass cache
      await act(async () => {
        await result.current.fetchProducts(true); // Force refresh
      });

      // Verify data was loaded
      expect(result.current.products.length).toBeGreaterThan(0);

      // Fetch a specific product (use raw ID - mock will transform to doc-X)
      await act(async () => {
        await result.current.fetchProductById(productMockData[0].id);
      });

      // Verify cache has data
      expect(Object.keys(result.current.productCache).length).toBeGreaterThan(0);

      // Invalidate cache
      act(() => {
        result.current.invalidateCache();
      });

      // Verify cache was cleared
      expect(result.current.products).toHaveLength(0);
      expect(Object.keys(result.current.productCache)).toHaveLength(0);
      expect(result.current.lastFetchTimestamp).toBeNull();
      expect(result.current.actionStatus.fetchProducts).toBe('idle');
    });

    it('should clear error state', async () => {
      const { result } = renderHook(() => useProductStore());

      // Force an error
      (httpClient as any).__setError(true, '/products');

      await act(async () => {
        await result.current.fetchProducts();
      });

      expect(result.current.error).toBeTruthy();

      // Reset error state in mock
      (httpClient as any).__setError(false);

      // Clear error in store
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('ProductHelpers', () => {
    const mockProduct = {
      id: '1',
      title: 'Test Product',
      price: 100,
      discountedPrice: 80,
      categoryId: 'apparel',
      modelId: 'test-model',
      frontImage: '/test.jpg',
      statuses: [ProductStatus.NEW, ProductStatus.FEATURED],
      colors: [
        {
          colorName: 'Azul',
          quantity: 10,
          images: { main: '/blue.jpg', additional: [] },
        },
      ],
      sizes: [
        { value: 'M', available: true },
        { value: 'L', available: false },
      ],
    };

    describe('getDisplayPrice', () => {
      it('should calculate display price with discount', () => {
        const pricing = ProductHelpers.getDisplayPrice(mockProduct);

        expect(pricing.original).toBe(100);
        expect(pricing.final).toBe(80);
        expect(pricing.hasDiscount).toBe(true);
        expect(pricing.discountPercentage).toBe(20);
      });

      it('should handle product without discount', () => {
        const productWithoutDiscount = { ...mockProduct, discountedPrice: undefined };
        const pricing = ProductHelpers.getDisplayPrice(productWithoutDiscount);

        expect(pricing.original).toBe(100);
        expect(pricing.final).toBe(100);
        expect(pricing.hasDiscount).toBe(false);
        expect(pricing.discountPercentage).toBeUndefined();
      });
    });

    describe('isVariantAvailable', () => {
      it('should check size availability', () => {
        expect(ProductHelpers.isVariantAvailable(mockProduct, 'M')).toBe(true);
        expect(ProductHelpers.isVariantAvailable(mockProduct, 'L')).toBe(false);
      });

      it('should check color availability', () => {
        expect(ProductHelpers.isVariantAvailable(mockProduct, undefined, 'Azul')).toBe(true);
        expect(ProductHelpers.isVariantAvailable(mockProduct, undefined, 'Rojo')).toBe(false);
      });

      it('should return true for products without variants', () => {
        const noVariantsProduct = { ...mockProduct, sizes: undefined, colors: [] };
        expect(ProductHelpers.isVariantAvailable(noVariantsProduct)).toBe(true);
      });
    });

    describe('getAvailableVariants', () => {
      it('should return available sizes and colors', () => {
        const variants = ProductHelpers.getAvailableVariants(mockProduct);

        expect(variants.sizes).toEqual(['M']);
        expect(variants.colors).toEqual(['Azul']);
      });
    });

    describe('formatProductForDisplay', () => {
      it('should format product for display', () => {
        const formatted = ProductHelpers.formatProductForDisplay(mockProduct);

        expect(formatted.id).toBe('1');
        expect(formatted.title).toBe('Test Product');
        expect(formatted.price.final).toBe(80);
        expect(formatted.price.hasDiscount).toBe(true);
        expect(formatted.isNew).toBe(true);
        expect(formatted.isFeatured).toBe(true);
        expect(formatted.hasDiscount).toBe(true);
      });
    });
  });
});
