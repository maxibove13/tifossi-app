/**
 * Mock Service Worker (MSW) setup for API mocking
 * Provides consistent API mocking for tests
 */

// Use dynamic import for MSW v2 compatibility with Jest
import {
  mockApiResponses,
  mockProduct,
  mockCategory,
  mockStore,
  mockUser,
  mockOrder,
} from './mock-data';

// For MSW v2 - simplified setup for Jest compatibility
const msw = require('msw');
const { http, HttpResponse } = msw;

// Mock setupServer for compatibility
const setupServer = (...handlers: any[]) => ({
  listen: (options?: any) => {},
  close: () => {},
  resetHandlers: (...handlers: any[]) => {},
  use: (...handlers: any[]) => {},
});

// Types for MSW handlers
type HttpHandler = (info: {
  request: Request;
  params: Record<string, string>;
}) => Promise<Response> | Response;

// Define API handlers
export const handlers = [
  // Products API
  http.get('/api/products', () => {
    return HttpResponse.json(mockApiResponses.products.success);
  }),

  http.get('/api/products/:id', ({ params }: { params: Record<string, string> }) => {
    const { id } = params;
    return HttpResponse.json({
      data: { ...mockProduct, id },
    });
  }),

  http.post('/api/products', async ({ request }: { request: Request }) => {
    const product = await request.json();
    return HttpResponse.json(
      {
        data: { ...mockProduct, ...product, id: 'new-product-id' },
      },
      { status: 201 }
    );
  }),

  http.put(
    '/api/products/:id',
    async ({ params, request }: { params: Record<string, string>; request: Request }) => {
      const { id } = params;
      const updates = await request.json();
      return HttpResponse.json({
        data: { ...mockProduct, ...updates, id },
      });
    }
  ),

  http.delete('/api/products/:id', ({ params }: { params: Record<string, string> }) => {
    const { id } = params;
    return HttpResponse.json({
      message: `Product ${id} deleted successfully`,
    });
  }),

  // Categories API
  http.get('/api/categories', () => {
    return HttpResponse.json(mockApiResponses.categories.success);
  }),

  http.get('/api/categories/:id', ({ params }: { params: Record<string, string> }) => {
    const { id } = params;
    return HttpResponse.json({
      data: { ...mockCategory, id },
    });
  }),

  http.get(
    '/api/categories/:id/products',
    ({ params, request }: { params: Record<string, string>; request: Request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page')) || 1;
      const limit = Number(url.searchParams.get('limit')) || 10;

      return HttpResponse.json({
        data: [mockProduct],
        pagination: {
          page,
          limit,
          total: 1,
          totalPages: 1,
        },
      });
    }
  ),

  // Stores API
  http.get('/api/stores', () => {
    return HttpResponse.json(mockApiResponses.stores.success);
  }),

  http.get('/api/stores/:id', ({ params }: { params: Record<string, string> }) => {
    const { id } = params;
    return HttpResponse.json({
      data: { ...mockStore, id },
    });
  }),

  // Search API
  http.get('/api/search', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const category = url.searchParams.get('category');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');

    return HttpResponse.json({
      data: [mockProduct],
      query,
      filters: { category, minPrice, maxPrice },
      total: 1,
    });
  }),

  // Authentication API
  http.post('/api/auth/login', async ({ request }: { request: Request }) => {
    const credentials = (await request.json()) as { email: string; password: string };

    if (credentials.email === 'test@tifossi.com' && credentials.password === 'testpass123') {
      return HttpResponse.json(mockApiResponses.auth.success);
    }

    return HttpResponse.json(mockApiResponses.auth.error, { status: 401 });
  }),

  http.post('/api/auth/register', async ({ request }: { request: Request }) => {
    const userData = await request.json();
    return HttpResponse.json(
      {
        data: { ...mockUser, ...userData, id: 'new-user-id' },
        token: 'mock-jwt-token',
      },
      { status: 201 }
    );
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      message: 'Logged out successfully',
    });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      token: 'new-mock-jwt-token',
      expiresIn: 3600,
    });
  }),

  http.post('/api/auth/forgot-password', async ({ request }: { request: Request }) => {
    const { email } = (await request.json()) as { email: string };
    return HttpResponse.json({
      message: `Password reset email sent to ${email}`,
    });
  }),

  http.post('/api/auth/verify-email', async ({ request }: { request: Request }) => {
    const { token } = (await request.json()) as { token: string };
    return HttpResponse.json({
      message: 'Email verified successfully',
      user: mockUser,
    });
  }),

  // User API
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      data: mockUser,
    });
  }),

  http.put('/api/user/profile', async ({ request }: { request: Request }) => {
    const updates = await request.json();
    return HttpResponse.json({
      data: { ...mockUser, ...updates },
    });
  }),

  http.get('/api/user/orders', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;

    return HttpResponse.json({
      data: [mockOrder],
      pagination: {
        page,
        limit,
        total: 1,
        totalPages: 1,
      },
    });
  }),

  http.get('/api/user/favorites', () => {
    return HttpResponse.json({
      data: [mockProduct],
      total: 1,
    });
  }),

  http.post('/api/user/favorites/:productId', ({ params }: { params: Record<string, string> }) => {
    const { productId } = params;
    return HttpResponse.json({
      message: `Product ${productId} added to favorites`,
    });
  }),

  http.delete(
    '/api/user/favorites/:productId',
    ({ params }: { params: Record<string, string> }) => {
      const { productId } = params;
      return HttpResponse.json({
        message: `Product ${productId} removed from favorites`,
      });
    }
  ),

  // Cart API - Legacy endpoints
  http.get('/api/cart', () => {
    return HttpResponse.json({
      data: {
        id: 'test-cart-1',
        items: [
          {
            id: 'cart-item-1',
            productId: mockProduct.id,
            quantity: 2,
            price: mockProduct.price,
            product: mockProduct,
          },
        ],
        subtotal: mockProduct.price * 2,
        tax: mockProduct.price * 2 * 0.08,
        total: mockProduct.price * 2 * 1.08,
      },
    });
  }),

  http.post('/api/cart/items', async ({ request }: { request: Request }) => {
    const item = await request.json();
    return HttpResponse.json(
      {
        data: {
          id: 'new-cart-item-id',
          ...item,
          product: mockProduct,
        },
      },
      { status: 201 }
    );
  }),

  http.put(
    '/api/cart/items/:itemId',
    async ({ params, request }: { params: Record<string, string>; request: Request }) => {
      const { itemId } = params;
      const updates = await request.json();
      return HttpResponse.json({
        data: {
          id: itemId,
          ...updates,
          product: mockProduct,
        },
      });
    }
  ),

  http.delete('/api/cart/items/:itemId', ({ params }: { params: Record<string, string> }) => {
    const { itemId } = params;
    return HttpResponse.json({
      message: `Cart item ${itemId} removed`,
    });
  }),

  // Cart Service API - Strapi-style endpoints
  http.get('/users/me/cart', ({ request }: { request: Request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      cart: [
        {
          productId: mockProduct.id,
          quantity: 1,
          color: 'Blue',
          size: 'M',
        },
      ],
    });
  }),

  http.put('/users/me/cart', async ({ request }: { request: Request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cart } = (await request.json()) as { cart: any[] };
    return HttpResponse.json({
      cart: cart,
    });
  }),

  // Orders API
  http.post('/api/orders', async ({ request }: { request: Request }) => {
    const orderData = await request.json();
    return HttpResponse.json(
      {
        data: {
          ...mockOrder,
          ...orderData,
          id: 'new-order-id',
          status: 'confirmed',
        },
      },
      { status: 201 }
    );
  }),

  http.get('/api/orders/:orderId', ({ params }: { params: Record<string, string> }) => {
    const { orderId } = params;
    return HttpResponse.json({
      data: { ...mockOrder, id: orderId },
    });
  }),

  // Payment API
  http.post('/api/payments/create-intent', async ({ request }: { request: Request }) => {
    const paymentData = await request.json();
    return HttpResponse.json({
      clientSecret: 'mock-payment-intent-secret',
      paymentIntentId: 'mock-payment-intent-id',
      amount: paymentData.amount,
    });
  }),

  http.post('/api/payments/confirm', async ({ request }: { request: Request }) => {
    const { paymentIntentId } = await request.json();
    return HttpResponse.json({
      paymentIntentId,
      status: 'succeeded',
      chargeId: 'mock-charge-id',
    });
  }),

  // Analytics API (for performance testing)
  http.post('/api/analytics/events', async ({ request }: { request: Request }) => {
    const events = await request.json();
    return HttpResponse.json({
      message: 'Events tracked successfully',
      count: Array.isArray(events) ? events.length : 1,
    });
  }),

  // Error scenarios for testing
  http.get('/api/error/500', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  http.get('/api/error/timeout', () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({ data: 'delayed response' }));
      }, 10000); // 10 second delay to simulate timeout
    });
  }),

  // Network error simulation
  http.get('/api/error/network', () => {
    return HttpResponse.error();
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  http.get('/api/products', () => {
    return HttpResponse.json(mockApiResponses.products.error, { status: 500 });
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json(mockApiResponses.auth.error, { status: 401 });
  }),

  http.get('/api/user/profile', () => {
    return HttpResponse.json(mockApiResponses.user.error, { status: 404 });
  }),
];

// Create server instance
export const server = setupServer(...handlers);

// Helper functions for test setup
export const mswHelpers = {
  // Start the server
  startServer: () => {
    server.listen({
      onUnhandledRequest: 'warn',
    });
  },

  // Stop the server
  stopServer: () => {
    server.close();
  },

  // Reset handlers to defaults
  resetHandlers: () => {
    server.resetHandlers(...handlers);
  },

  // Use error handlers
  useErrorHandlers: () => {
    server.use(...errorHandlers);
  },

  // Add custom handler
  addHandler: (handler: any) => {
    server.use(handler);
  },

  // Mock specific endpoint with custom response
  mockEndpoint: (method: string, path: string, response: any, status = 200) => {
    const handler = http[method.toLowerCase() as keyof typeof http](path, (() => {
      return HttpResponse.json(response, { status });
    }) as any);
    server.use(handler);
  },

  // Simulate network delay
  addDelay: (delay: number = 1000) => {
    server.use(
      http.all('*', async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return HttpResponse.passthrough();
      })
    );
  },

  // Simulate network failure
  simulateNetworkError: (path: string) => {
    server.use(
      http.get(path, () => {
        return HttpResponse.error();
      })
    );
  },
};

// Export server for direct use if needed
export { server as mswServer };
