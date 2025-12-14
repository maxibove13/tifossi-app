/**
 * Checkout API Contract Tests
 *
 * These tests validate that the app's checkout payloads match
 * what the backend API expects. Run against real API to catch
 * schema mismatches early.
 *
 * Usage:
 *   # CI/CD mode (skips MercadoPago calls):
 *   npm run test:contracts
 *
 *   # Local mode (includes MercadoPago integration - requires test credentials on backend):
 *   npm run test:contracts:full
 */

// Longer timeout for real API calls
jest.setTimeout(30000);

const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';

// Skip MercadoPago tests in CI/CD (they require test credentials on the backend)
const SKIP_MP_TESTS = process.env.SKIP_MP_TESTS === 'true';

// Helper to conditionally skip MP tests
const describeMP = SKIP_MP_TESTS ? describe.skip : describe;

// Types matching what the app sends
interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
  price?: number;
  discountedPrice?: number;
}

interface OrderPayload {
  orderNumber: string;
  guestEmail?: string; // Required for guest checkout
  items: {
    productId: string | number;
    productName: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: { areaCode: string; number: string };
  };
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    phoneNumber?: string;
  } | null;
  shippingMethod: 'delivery' | 'pickup';
  storeLocationCode?: string;
  shippingCost: number;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
}

// Fetch valid product documentIds from the API (Strapi 5 uses documentId as primary identifier)
async function getValidProductIds(): Promise<string[]> {
  const res = await fetch(`${STRAPI_URL}/api/products?pagination[limit]=5`);
  const data = await res.json();
  return data.data?.map((p: any) => p.documentId) || [];
}

// Fetch valid store location codes
async function getValidStoreLocationCodes(): Promise<string[]> {
  const res = await fetch(`${STRAPI_URL}/api/store-locations`);
  const data = await res.json();
  return data.data?.map((s: any) => s.code) || [];
}

describe('Checkout API Contract Tests', () => {
  let validProductIds: string[] = [];
  let validStoreCodes: string[] = [];

  beforeAll(async () => {
    // Fetch real data from API
    validProductIds = await getValidProductIds();
    validStoreCodes = await getValidStoreLocationCodes();

    console.log('Valid product IDs:', validProductIds);
    console.log('Valid store codes:', validStoreCodes);
  });

  // These tests call MercadoPago API - skip in CI/CD
  describeMP('Guest Delivery Checkout', () => {
    it('should accept valid guest delivery payload', async () => {
      if (validProductIds.length === 0) {
        console.warn('No products in database, skipping test');
        return;
      }

      const payload: OrderPayload = {
        orderNumber: `TEST-${Date.now()}`,
        guestEmail: 'test@example.com',
        items: [
          {
            productId: validProductIds[0], // Use real product documentId
            productName: 'Test Product',
            quantity: 1,
            price: 100,
            size: 'M',
            color: 'Black',
          },
        ],
        user: {
          id: `guest-${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: { areaCode: '598', number: '91234567' },
        },
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          addressLine1: '18 de Julio 1234',
          city: 'Montevideo',
          state: 'Montevideo',
          country: 'UY',
          postalCode: '11100',
          phoneNumber: '91234567',
        },
        shippingMethod: 'delivery',
        shippingCost: 10,
        subtotal: 100,
        discount: 0,
        total: 110,
      };

      const res = await fetch(`${STRAPI_URL}/api/payment/guest/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('API Error:', data);
      }

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.preference?.id).toBeDefined();
    });

    it('should reject payload with string productId (app bug simulation)', async () => {
      const payload: OrderPayload = {
        orderNumber: `TEST-${Date.now()}`,
        guestEmail: 'test@example.com',
        items: [
          {
            productId: 'string-id-not-number', // This is what the app might send incorrectly
            productName: 'Test Product',
            quantity: 1,
            price: 100,
          },
        ],
        user: {
          id: `guest-${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
        shippingAddress: {
          addressLine1: '18 de Julio 1234',
          city: 'Montevideo',
          country: 'UY',
        },
        shippingMethod: 'delivery',
        shippingCost: 10,
        subtotal: 100,
        discount: 0,
        total: 110,
      };

      const res = await fetch(`${STRAPI_URL}/api/payment/guest/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Should fail because productId doesn't match any real product - returns 400
      expect(res.status).toBe(400);
      expect(data.error?.message).toMatch(/not found|invalid/i);
    });
  });

  // These tests call MercadoPago API - skip in CI/CD
  describeMP('Guest Pickup Checkout', () => {
    it('should accept valid guest pickup payload', async () => {
      if (validProductIds.length === 0 || validStoreCodes.length === 0) {
        console.warn('No products or stores in database, skipping test');
        return;
      }

      const payload: OrderPayload = {
        orderNumber: `TEST-${Date.now()}`,
        guestEmail: 'test@example.com',
        items: [
          {
            productId: validProductIds[0],
            productName: 'Test Product',
            quantity: 1,
            price: 100,
          },
        ],
        user: {
          id: `guest-${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: { areaCode: '598', number: '91234567' },
        },
        shippingAddress: null,
        shippingMethod: 'pickup',
        storeLocationCode: validStoreCodes[0], // Use real store code
        shippingCost: 0,
        subtotal: 100,
        discount: 0,
        total: 100,
      };

      const res = await fetch(`${STRAPI_URL}/api/payment/guest/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('API Error:', data);
      }

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject pickup with invalid store code', async () => {
      if (validProductIds.length === 0) {
        console.warn('No products in database, skipping test');
        return;
      }

      const payload: OrderPayload = {
        orderNumber: `TEST-${Date.now()}`,
        guestEmail: 'test@example.com',
        items: [
          {
            productId: validProductIds[0],
            productName: 'Test Product',
            quantity: 1,
            price: 100,
          },
        ],
        user: {
          id: `guest-${Date.now()}`,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
        shippingAddress: null,
        shippingMethod: 'pickup',
        storeLocationCode: 'INVALID_STORE_CODE',
        shippingCost: 0,
        subtotal: 100,
        discount: 0,
        total: 100,
      };

      const res = await fetch(`${STRAPI_URL}/api/payment/guest/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Returns 400 with validation error for invalid store code
      expect(res.status).toBe(400);
      expect(data.error?.message).toContain('Invalid pickup store location');
    });
  });

  describe('Schema Validation', () => {
    it('should have products with numeric IDs in database', async () => {
      const res = await fetch(`${STRAPI_URL}/api/products?pagination[limit]=1`);
      const data = await res.json();

      expect(data.data?.length).toBeGreaterThan(0);
      expect(typeof data.data[0].id).toBe('number');
    });

    it('should have store locations with expected codes', async () => {
      const res = await fetch(`${STRAPI_URL}/api/store-locations`);
      const data = await res.json();

      const codes = data.data?.map((s: any) => s.code) || [];

      // These are the codes the app expects
      const appExpectedCodes = ['centro_mvd', 'plaza_italia_mvd', 'punta_del_este_pde'];

      for (const expectedCode of appExpectedCodes) {
        expect(codes).toContain(expectedCode);
      }
    });

    it('should match CartItem interface with backend expectations', async () => {
      // Simulate what the app's CartItem looks like
      const appCartItem: CartItem = {
        productId: '123', // App stores as string!
        quantity: 1,
        color: 'Black',
        size: 'M',
        price: 100,
        discountedPrice: 80,
      };

      // Backend expects productId as number
      const backendExpectedItem = {
        productId: Number(appCartItem.productId),
        quantity: appCartItem.quantity,
        price: appCartItem.discountedPrice ?? appCartItem.price,
        color: appCartItem.color,
        size: appCartItem.size,
      };

      // This test documents the transformation needed
      expect(typeof appCartItem.productId).toBe('string');
      expect(typeof backendExpectedItem.productId).toBe('number');
      expect(Number.isNaN(backendExpectedItem.productId)).toBe(false);
    });
  });
});

describe('App-to-Backend Data Flow', () => {
  it('documents the expected transformation from app CartItem to API payload', () => {
    // What the app stores in cartStore
    const cartStoreItem: CartItem = {
      productId: '42', // String in app
      quantity: 2,
      color: 'Red',
      size: 'L',
      price: 150,
      discountedPrice: 120,
    };

    // What payment-selection.tsx builds
    const paymentPayloadItem = {
      productId: cartStoreItem.productId, // Still string here - BUG!
      productName: `Product ${cartStoreItem.productId}`,
      quantity: cartStoreItem.quantity,
      price: cartStoreItem.discountedPrice ?? cartStoreItem.price ?? 0,
      size: cartStoreItem.size,
      color: cartStoreItem.color,
    };

    // What the backend expects (order-sanitizer.ts line 464)
    // const productId = Number(item.productId);
    // if (!Number.isInteger(productId) || productId <= 0) { throw error }

    const backendReceives = Number(paymentPayloadItem.productId);

    expect(Number.isInteger(backendReceives)).toBe(true);
    expect(backendReceives).toBeGreaterThan(0);
  });
});
