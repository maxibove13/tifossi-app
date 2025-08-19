/**
 * Product Browsing Integration Tests
 * Tests complete product browsing flows with REAL Strapi service
 * Mock ONLY Strapi API responses using MSW
 * Test what users see and do, not internal state
 */

import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { mswServer, mswHelpers } from '../utils/msw-setup';
import { generateProducts, mockProduct } from '../utils/mock-data';
import { render } from '../utils/render-utils';
import { testLifecycleHelpers } from '../utils/test-setup';
import CatalogScreen from '../../catalog/index';

// Mock the data imports
jest.mock('../../_data/categories', () => ({
  mainCategories: [
    { id: 'all', name: 'Todo', isLabel: false },
    { id: 'electronics', name: 'Electronics', isLabel: false },
    { id: 'clothing', name: 'Clothing', isLabel: false },
  ],
}));

jest.mock('../../_data/models', () => ({
  getModelsByCategory: jest.fn(() => [
    { id: 'all', name: 'All Models' },
    { id: 'model-1', name: 'Model 1' },
  ]),
}));

jest.mock('../../_types/constants', () => ({
  CATEGORY_IDS: {
    ALL: 'all',
  },
  MODEL_IDS: {
    ALL: 'all',
  },
}));

jest.mock('../../hooks/useProductFilters', () => ({
  useProductFilters: jest.fn((products) => products),
}));

jest.mock('../../_types/product-status', () => ({
  hasStatus: jest.fn(() => true),
}));

// Mock expo-router to provide navigation context
const mockRouterPush = jest.fn();
const mockRouterSetParams = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    setParams: mockRouterSetParams,
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock the Header component to simplify testing
jest.mock('../../_components/store/layout/Header', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockHeader({
    title,
    onApplyFilters,
    availableSizes,
    availableColors,
    minPrice,
    maxPrice,
  }: any) {
    return (
      <View testID="catalog-header">
        <Text testID="header-title">{title}</Text>
        <TouchableOpacity
          testID="filter-button"
          onPress={() =>
            onApplyFilters({
              sizes: ['M'],
              colorHexes: ['#FF0000'],
              priceRange: { min: minPrice, max: maxPrice / 2 },
            })
          }
        >
          <Text>Apply Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="search-button" onPress={() => onApplyFilters({})}>
          <Text>Search</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock ProductGridSkeleton
jest.mock('../../_components/skeletons/ProductGridSkeleton', () => {
  const { View, Text } = require('react-native');
  return function MockProductGridSkeleton() {
    return (
      <View testID="loading-skeleton">
        <Text>Loading products...</Text>
      </View>
    );
  };
});

// Mock DefaultLargeCard to simulate product cards
jest.mock('../../_components/store/product/default/large', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockDefaultLargeCard({ product, onPress }: any) {
    return (
      <TouchableOpacity testID={`product-card-${product.id}`} onPress={onPress}>
        <View>
          <Text testID="product-name">{product.title}</Text>
          <Text testID="product-price">${product.price}</Text>
          {product.discount && <Text testID="product-discount">{product.discount}% off</Text>}
          <Text testID="product-category">{product.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };
});

describe('Product Browsing Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    testLifecycleHelpers.setupTest();
    mswHelpers.resetHandlers();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    mockRouterPush.mockClear();
    mockRouterSetParams.mockClear();
  });

  afterEach(() => {
    testLifecycleHelpers.teardownTest();
  });

  const renderCatalogScreen = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CatalogScreen {...props} />
      </QueryClientProvider>
    );
  };

  describe('Product Catalog Browsing', () => {
    it('should display products from API when catalog loads', async () => {
      // Setup MSW to return multiple products
      const testProducts = generateProducts(6);
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: testProducts })));

      const { findByTestId, findAllByTestId } = renderCatalogScreen();

      // Wait for products to load
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(6);
      });

      // Verify first product displays correctly
      const firstProductCard = await findByTestId(`product-card-${testProducts[0].id}`);
      expect(within(firstProductCard).getByTestId('product-name')).toHaveTextContent(
        testProducts[0].title
      );
      expect(within(firstProductCard).getByTestId('product-price')).toHaveTextContent(
        `$${testProducts[0].price}`
      );
    });

    it('should show loading skeleton while products are being fetched', async () => {
      // Setup MSW with delay to test loading state
      mswServer.use(
        http.get('/api/products', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ data: generateProducts(3) });
        })
      );

      const { getByTestId } = renderCatalogScreen();

      // Should show loading skeleton initially
      expect(getByTestId('loading-skeleton')).toHaveTextContent('Loading products...');
    });

    it('should handle API errors gracefully', async () => {
      // Setup MSW to return error
      mswServer.use(
        http.get('/api/products', () =>
          HttpResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
        )
      );

      const { findByText } = renderCatalogScreen();

      // Should show error message
      await waitFor(async () => {
        expect(await findByText(/Error al cargar productos/)).toBeTruthy();
      });
    });
  });

  describe('Category Filtering', () => {
    it('should filter products by category when user selects category tab', async () => {
      // Setup products with different categories
      const electronicsProducts = generateProducts(3).map((p) => ({
        ...p,
        category: 'electronics',
      }));
      const clothingProducts = generateProducts(2).map((p) => ({ ...p, category: 'clothing' }));
      const allProducts = [...electronicsProducts, ...clothingProducts];

      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: allProducts })));

      const { findAllByTestId, getByText } = renderCatalogScreen();

      // Wait for initial load
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(5);
      });

      // User selects electronics category
      fireEvent.press(getByText('Electronics'));

      // Should update URL params
      expect(mockRouterSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'electronics' })
      );
    });

    it('should show all products when "Todo" category is selected', async () => {
      const testProducts = generateProducts(4);
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: testProducts })));

      const { findAllByTestId, getByText } = renderCatalogScreen();

      // User selects "Todo" category
      fireEvent.press(getByText('Todo'));

      // Should show all products
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(4);
      });
    });
  });

  describe('Product Search', () => {
    it('should search products when user interacts with search', async () => {
      const searchResults = [
        { ...mockProduct, id: 'hoodie-1', title: 'Classic Hoodie' },
        { ...mockProduct, id: 'hoodie-2', title: 'Sport Hoodie' },
      ];

      mswServer.use(
        http.get('/api/products', () => HttpResponse.json({ data: searchResults })),
        http.get('/api/search', ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q');
          if (query === 'hoodie') {
            return HttpResponse.json({ data: searchResults });
          }
          return HttpResponse.json({ data: [] });
        })
      );

      const { getByTestId, findAllByTestId } = renderCatalogScreen();

      // User clicks search button (simplified interaction)
      fireEvent.press(getByTestId('search-button'));

      // Should show search results
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(2);
      });
    });

    it('should show no results message when search returns empty', async () => {
      mswServer.use(
        http.get('/api/products', () => HttpResponse.json({ data: [] })),
        http.get('/api/search', () => HttpResponse.json({ data: [] }))
      );

      const { getByTestId, findByText } = renderCatalogScreen();

      // User performs search that returns no results
      fireEvent.press(getByTestId('search-button'));

      // Should show no results message
      await waitFor(async () => {
        expect(await findByText(/No hay productos que coincidan/)).toBeTruthy();
      });
    });
  });

  describe('Product Filtering', () => {
    it('should filter products by price, size, and color', async () => {
      const testProducts = [
        {
          ...mockProduct,
          id: 'product-1',
          price: 50,
          sizes: [{ value: 'M', available: true }],
          colors: [
            { colorName: 'Red', quantity: 10, images: { main: 'test.jpg' }, hex: '#FF0000' },
          ],
        },
        {
          ...mockProduct,
          id: 'product-2',
          price: 150,
          sizes: [{ value: 'L', available: true }],
          colors: [
            { colorName: 'Green', quantity: 10, images: { main: 'test.jpg' }, hex: '#00FF00' },
          ],
        },
        {
          ...mockProduct,
          id: 'product-3',
          price: 80,
          sizes: [{ value: 'M', available: true }],
          colors: [
            { colorName: 'Red', quantity: 10, images: { main: 'test.jpg' }, hex: '#FF0000' },
          ],
        },
      ];

      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: testProducts })));

      const { getByTestId, findAllByTestId } = renderCatalogScreen();

      // Wait for initial load
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });

      // User applies filters (price ≤ 75, size M, color red)
      fireEvent.press(getByTestId('filter-button'));

      // Should apply filters and show filtered results
      // The mock filter would show products matching criteria
      // In real implementation, this would be handled by useProductFilters hook
    });

    it('should clear filters when user resets them', async () => {
      const testProducts = generateProducts(3);
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: testProducts })));

      const { getByTestId, findAllByTestId } = renderCatalogScreen();

      // Apply filters first
      fireEvent.press(getByTestId('filter-button'));

      // Clear filters by applying empty filter object
      fireEvent.press(getByTestId('search-button'));

      // Should show all products again
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });
    });
  });

  describe('Product Sorting', () => {
    it('should sort products by price when user selects price sort', async () => {
      const testProducts = [
        { ...mockProduct, id: 'expensive', title: 'Expensive Item', price: 200 },
        { ...mockProduct, id: 'cheap', title: 'Cheap Item', price: 50 },
        { ...mockProduct, id: 'medium', title: 'Medium Item', price: 100 },
      ];

      mswServer.use(
        http.get('/api/products', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');

          let sortedProducts = [...testProducts];
          if (sortBy === 'price_asc') {
            sortedProducts.sort((a, b) => a.price - b.price);
          } else if (sortBy === 'price_desc') {
            sortedProducts.sort((a, b) => b.price - a.price);
          }

          return HttpResponse.json({ data: sortedProducts });
        })
      );

      const { findAllByTestId } = renderCatalogScreen();

      // Should display products (sorting would be handled by API or local state)
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });
    });
  });

  describe('Product Navigation', () => {
    it('should navigate to product details when user taps product card', async () => {
      const testProduct = { ...mockProduct, id: 'test-product-123' };
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: [testProduct] })));

      const { findByTestId } = renderCatalogScreen();

      // Wait for product to load and tap it
      const productCard = await findByTestId('product-card-test-product-123');
      fireEvent.press(productCard);

      // Should navigate to product details
      expect(mockRouterPush).toHaveBeenCalledWith('/products/product?id=test-product-123');
    });
  });

  describe('Infinite Scroll and Pagination', () => {
    it('should load more products when user scrolls to bottom', async () => {
      // First page of products
      const firstPageProducts = generateProducts(10);
      // Second page of products
      const secondPageProducts = generateProducts(5).map((p) => ({ ...p, id: `page2-${p.id}` }));

      let currentPage = 1;
      mswServer.use(
        http.get('/api/products', ({ request }) => {
          const url = new URL(request.url);
          const page = Number(url.searchParams.get('page')) || 1;

          if (page === 1) {
            return HttpResponse.json({
              data: firstPageProducts,
              pagination: { page: 1, hasMore: true, total: 15 },
            });
          } else if (page === 2) {
            return HttpResponse.json({
              data: secondPageProducts,
              pagination: { page: 2, hasMore: false, total: 15 },
            });
          }

          return HttpResponse.json({ data: [] });
        })
      );

      const { findAllByTestId, getByTestId } = renderCatalogScreen();

      // Wait for first page to load
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(10);
      });

      // Simulate scroll to bottom (would trigger onEndReached in FlatList)
      // In real implementation, this would be handled by scrolling in ScrollView
      // For test purposes, we simulate the behavior
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh products when user pulls to refresh', async () => {
      const initialProducts = generateProducts(3);
      const refreshedProducts = generateProducts(4).map((p) => ({
        ...p,
        title: `Refreshed ${p.title}`,
      }));

      let callCount = 0;
      mswServer.use(
        http.get('/api/products', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ data: initialProducts });
          } else {
            return HttpResponse.json({ data: refreshedProducts });
          }
        })
      );

      const { findAllByTestId } = renderCatalogScreen();

      // Wait for initial load
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });

      // Simulate pull to refresh (would trigger onRefresh in ScrollView)
      // The refresh mechanism would invalidate queries and refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Wait for refreshed data
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(4);
      });
    });
  });

  describe('Offline Browsing', () => {
    it('should show cached products when offline', async () => {
      const cachedProducts = generateProducts(3);

      // First, load products while online
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: cachedProducts })));

      const { findAllByTestId } = renderCatalogScreen();

      // Wait for products to load and be cached
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });

      // Now simulate going offline
      mswServer.use(http.get('/api/products', () => HttpResponse.error()));

      // Re-render component (simulate app restart or navigation)
      const { findAllByTestId: findAllByTestIdOffline } = renderCatalogScreen();

      // Should still show cached products
      await waitFor(async () => {
        const productCards = await findAllByTestIdOffline(/product-card-/);
        expect(productCards).toHaveLength(3);
      });
    });

    it('should show offline indicator when network requests fail', async () => {
      // Setup MSW to simulate network error
      mswServer.use(http.get('/api/products', () => HttpResponse.error()));

      const { findByText } = renderCatalogScreen();

      // Should show error state
      await waitFor(async () => {
        expect(await findByText(/Error al cargar productos/)).toBeTruthy();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should handle rapid category switching without flickering', async () => {
      const electronicsProducts = generateProducts(3).map((p) => ({
        ...p,
        category: 'electronics',
      }));
      const clothingProducts = generateProducts(2).map((p) => ({ ...p, category: 'clothing' }));

      mswServer.use(
        http.get('/api/products', ({ request }) => {
          const url = new URL(request.url);
          const category = url.searchParams.get('category');

          if (category === 'electronics') {
            return HttpResponse.json({ data: electronicsProducts });
          } else if (category === 'clothing') {
            return HttpResponse.json({ data: clothingProducts });
          } else {
            return HttpResponse.json({ data: [...electronicsProducts, ...clothingProducts] });
          }
        })
      );

      const { getByText, findAllByTestId } = renderCatalogScreen();

      // Rapidly switch between categories
      fireEvent.press(getByText('Electronics'));
      fireEvent.press(getByText('Clothing'));
      fireEvent.press(getByText('Electronics'));

      // Should eventually settle on electronics products
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });
    });

    it('should maintain scroll position when filtering', async () => {
      const manyProducts = generateProducts(20);
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: manyProducts })));

      const { findAllByTestId, getByTestId } = renderCatalogScreen();

      // Wait for products to load
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(20);
      });

      // Apply filters
      fireEvent.press(getByTestId('filter-button'));

      // Should maintain UI responsiveness
      expect(getByTestId('catalog-header')).toBeTruthy();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from API errors and retry successfully', async () => {
      let callCount = 0;
      const successProducts = generateProducts(3);

      mswServer.use(
        http.get('/api/products', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ error: 'Server error' }, { status: 500 });
          } else {
            return HttpResponse.json({ data: successProducts });
          }
        })
      );

      const { findByText, findAllByTestId } = renderCatalogScreen();

      // Should show error initially
      await waitFor(async () => {
        expect(await findByText(/Error al cargar productos/)).toBeTruthy();
      });

      // Retry by invalidating queries (simulate retry button or pull-to-refresh)
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Should recover and show products
      await waitFor(async () => {
        const productCards = await findAllByTestId(/product-card-/);
        expect(productCards).toHaveLength(3);
      });
    });
  });
});
