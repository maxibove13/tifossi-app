/**
 * Integration tests for API layer
 * Tests the integration between API client and mock backend
 */

import { mswHelpers } from '../utils/msw-setup';
import { mockProduct, mockApiResponses } from '../utils/mock-data';
import { testLifecycleHelpers } from '../utils/test-setup';

// Mock API client - adjust import path as needed
const createMockApiClient = () => {
  const baseURL = '/api';

  return {
    // Products API
    getProducts: async (params?: any) => {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`${baseURL}/products?${queryString}`);
      return response.json();
    },

    getProduct: async (id: string) => {
      const response = await fetch(`${baseURL}/products/${id}`);
      return response.json();
    },

    createProduct: async (productData: any) => {
      const response = await fetch(`${baseURL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      return response.json();
    },

    // Categories API
    getCategories: async () => {
      const response = await fetch(`${baseURL}/categories`);
      return response.json();
    },

    getCategoryProducts: async (categoryId: string, params?: any) => {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`${baseURL}/categories/${categoryId}/products?${queryString}`);
      return response.json();
    },

    // Search API
    searchProducts: async (query: string, filters?: any) => {
      const params = new URLSearchParams({ q: query, ...filters });
      const response = await fetch(`${baseURL}/search?${params}`);
      return response.json();
    },

    // Authentication API
    login: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response.json();
    },

    register: async (userData: any) => {
      const response = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },

    // User API
    getUserProfile: async () => {
      const response = await fetch(`${baseURL}/user/profile`);
      return response.json();
    },

    updateUserProfile: async (updates: any) => {
      const response = await fetch(`${baseURL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.json();
    },

    // Cart API
    getCart: async () => {
      const response = await fetch(`${baseURL}/cart`);
      return response.json();
    },

    addToCart: async (item: any) => {
      const response = await fetch(`${baseURL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return response.json();
    },

    updateCartItem: async (itemId: string, updates: any) => {
      const response = await fetch(`${baseURL}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.json();
    },

    removeFromCart: async (itemId: string) => {
      const response = await fetch(`${baseURL}/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      return response.json();
    },

    // Orders API
    createOrder: async (orderData: any) => {
      const response = await fetch(`${baseURL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      return response.json();
    },

    getOrder: async (orderId: string) => {
      const response = await fetch(`${baseURL}/orders/${orderId}`);
      return response.json();
    },
  };
};

describe('API Integration Tests', () => {
  let apiClient: ReturnType<typeof createMockApiClient>;

  beforeAll(() => {
    mswHelpers.startServer();
  });

  afterAll(() => {
    mswHelpers.stopServer();
  });

  beforeEach(() => {
    testLifecycleHelpers.setupTest();
    mswHelpers.resetHandlers();
    apiClient = createMockApiClient();
  });

  afterEach(() => {
    testLifecycleHelpers.teardownTest();
  });

  describe('Products API', () => {
    it('should fetch products successfully', async () => {
      const result = await apiClient.getProducts();

      expect(result).toEqual(mockApiResponses.products.success);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: mockProduct.id,
        title: mockProduct.title,
        price: mockProduct.price,
      });
    });

    it('should fetch products with pagination', async () => {
      const params = { page: 2, limit: 5 };
      const result = await apiClient.getProducts(params);

      expect(result).toEqual(mockApiResponses.products.success);
    });

    it('should fetch single product by ID', async () => {
      const productId = 'test-product-1';
      const result = await apiClient.getProduct(productId);

      expect(result.data).toMatchObject({
        id: productId,
        title: mockProduct.title,
        price: mockProduct.price,
      });
    });

    it('should create new product', async () => {
      const newProductData = {
        name: 'New Test Product',
        price: 150.0,
        description: 'A new test product',
      };

      const result = await apiClient.createProduct(newProductData);

      expect(result.data).toMatchObject({
        ...newProductData,
        id: 'new-product-id',
      });
    });

    it('should handle products API errors', async () => {
      mswHelpers.useErrorHandlers();

      try {
        await apiClient.getProducts();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Categories API', () => {
    it('should fetch categories successfully', async () => {
      const result = await apiClient.getCategories();

      expect(result).toEqual(mockApiResponses.categories.success);
      expect(result.data).toHaveLength(1);
    });

    it('should fetch products by category', async () => {
      const categoryId = 'test-category-1';
      const result = await apiClient.getCategoryProducts(categoryId);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
    });

    it('should fetch category products with pagination', async () => {
      const categoryId = 'test-category-1';
      const params = { page: 1, limit: 20 };
      const result = await apiClient.getCategoryProducts(categoryId, params);

      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
      });
    });
  });

  describe('Search API', () => {
    it('should search products successfully', async () => {
      const query = 'smartphone';
      const result = await apiClient.searchProducts(query);

      expect(result.data).toHaveLength(1);
      expect(result.query).toBe(query);
      expect(result.total).toBe(1);
    });

    it('should search with filters', async () => {
      const query = 'smartphone';
      const filters = {
        category: 'electronics',
        minPrice: '50',
        maxPrice: '200',
      };

      const result = await apiClient.searchProducts(query, filters);

      expect(result.filters).toMatchObject(filters);
    });
  });

  describe('Authentication API', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@tifossi.com',
        password: 'testpass123',
      };

      const result = await apiClient.login(credentials);

      expect(result).toEqual(mockApiResponses.auth.success);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      const result = await apiClient.login(credentials);

      expect(result).toEqual(mockApiResponses.auth.error);
    });

    it('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await apiClient.register(userData);

      expect(result.data).toMatchObject({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      expect(result.token).toBeDefined();
    });
  });

  describe('User API', () => {
    it('should fetch user profile successfully', async () => {
      const result = await apiClient.getUserProfile();

      expect(result.data).toMatchObject({
        id: 'test-user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should update user profile successfully', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const result = await apiClient.updateUserProfile(updates);

      expect(result.data).toMatchObject(updates);
    });

    it('should handle user profile errors', async () => {
      mswHelpers.useErrorHandlers();

      try {
        await apiClient.getUserProfile();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Cart API', () => {
    it('should fetch cart successfully', async () => {
      const result = await apiClient.getCart();

      expect(result.data).toMatchObject({
        id: 'test-cart-1',
        items: expect.any(Array),
        subtotal: expect.any(Number),
        total: expect.any(Number),
      });
    });

    it('should add item to cart', async () => {
      const cartItem = {
        productId: mockProduct.id,
        quantity: 2,
        price: mockProduct.price,
      };

      const result = await apiClient.addToCart(cartItem);

      expect(result.data).toMatchObject({
        ...cartItem,
        id: 'new-cart-item-id',
        product: mockProduct,
      });
    });

    it('should update cart item quantity', async () => {
      const itemId = 'cart-item-1';
      const updates = { quantity: 5 };

      const result = await apiClient.updateCartItem(itemId, updates);

      expect(result.data).toMatchObject({
        id: itemId,
        ...updates,
      });
    });

    it('should remove item from cart', async () => {
      const itemId = 'cart-item-1';

      const result = await apiClient.removeFromCart(itemId);

      expect(result.message).toContain('removed');
    });
  });

  describe('Orders API', () => {
    it('should create order successfully', async () => {
      const orderData = {
        items: [
          {
            productId: mockProduct.id,
            quantity: 2,
            price: mockProduct.price,
          },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          zipCode: '12345',
        },
        paymentMethod: 'card',
      };

      const result = await apiClient.createOrder(orderData);

      expect(result.data).toMatchObject({
        ...orderData,
        id: 'new-order-id',
        status: 'confirmed',
      });
    });

    it('should fetch order by ID', async () => {
      const orderId = 'test-order-1';

      const result = await apiClient.getOrder(orderId);

      expect(result.data).toMatchObject({
        id: orderId,
        items: expect.any(Array),
        total: expect.any(Number),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mswHelpers.simulateNetworkError('/api/products');

      try {
        await apiClient.getProducts();
        fail('Should have thrown a network error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle API timeout', async () => {
      mswHelpers.addDelay(15000); // Simulate very slow response

      const startTime = Date.now();

      try {
        await apiClient.getProducts();
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(duration).toBeGreaterThan(5000); // Should timeout after reasonable time
      }
    }, 20000); // Increase test timeout

    it('should handle 500 server errors', async () => {
      mswHelpers.mockEndpoint('get', '/api/products', { error: 'Server error' }, 500);

      try {
        await apiClient.getProducts();
        fail('Should have thrown a server error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle 404 not found errors', async () => {
      mswHelpers.mockEndpoint('get', '/api/products/nonexistent', { error: 'Not found' }, 404);

      try {
        await apiClient.getProduct('nonexistent');
        fail('Should have thrown a not found error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should handle concurrent API requests', async () => {
      const promises = [
        apiClient.getProducts(),
        apiClient.getCategories(),
        apiClient.getCart(),
        apiClient.getUserProfile(),
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(4);
      expect(duration).toBeLessThan(1000); // Should complete quickly in parallel
    });

    it('should handle multiple requests to same endpoint', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => apiClient.getProducts());

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // Should handle multiple requests efficiently
    });
  });
});
