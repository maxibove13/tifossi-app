/**
 * Mock data generators and fixtures for testing
 */

import { Product, ProductCardData } from '../../_types/product';
import { ProductStatus } from '../../_types/product-status';
import { Category } from '../../_types/category';
import { StoreDetails } from '../../_types/store';
import { User } from '../../_types/auth';

// === CONSOLIDATED PAYMENT MOCK DATA ===
// (Merged from payment-mock-data.ts)

import { CartItem } from '@/app/_services/cart/cartService';
import { OrderData, UserData } from '@/app/_services/payment/mercadoPago';
import { Address } from '@/app/_services/address/addressService';

// Product mock data
export const mockProduct: Product = {
  id: 'test-product-1',
  title: 'Test Product',
  categoryId: 'electronics',
  modelId: 'test-model-1',
  frontImage: 'https://test.com/product-image.jpg',
  statuses: [ProductStatus.NEW],
  colors: [
    {
      colorName: 'Black',
      quantity: 10,
      images: {
        main: 'https://test.com/product-image.jpg',
      },
    },
  ],
  price: 99.99,
  discountedPrice: 79.99,
  shortDescription: {
    line1: 'Short description line 1',
    line2: 'Short description line 2',
  },
  longDescription: 'This is a detailed description of the test product.',
  images: [
    'https://test.com/image1.jpg',
    'https://test.com/image2.jpg',
    'https://test.com/image3.jpg',
  ],
  isCustomizable: false,
  warranty: '1 year warranty',
  returnPolicy: '30 day return policy',
  dimensions: {
    height: '6.1 inches',
    width: '3.0 inches',
    depth: '0.3 inches',
  },
};

export const mockProductCard: ProductCardData = {
  id: 'test-product-1',
  name: 'Test Product',
  description: {
    line1: 'Short description line 1',
    line2: 'Short description line 2',
  },
  price: 99.99,
  originalPrice: 129.99,
  discountPercentage: 23,
  image: 'https://test.com/product-image.jpg',
};

// Category mock data
export const mockCategory: Category = {
  id: 'test-category-1',
  name: 'Electronics',
  slug: 'electronics',
  displayOrder: 1,
  isLabel: false,
};

// Store mock data
export const mockStore: StoreDetails = {
  id: 'test-store-1',
  cityId: 'test-city-1',
  zoneId: 'test-zone-1',
  name: 'Test Store Downtown',
  address: '123 Main St, Test City, TS 12345',
  hours: 'Mon-Thu: 9AM-6PM, Fri-Sat: 9AM-8PM, Sun: 12PM-5PM',
  image: { uri: 'https://test.com/store-image.jpg' },
};

// User mock data (Firebase Auth compatible)
export const mockUser: User = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  profilePicture: 'https://test.com/avatar.jpg',
  isEmailVerified: true,
};

// Extended user mock data for comprehensive testing
export const mockUserExtended = {
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  avatar: 'https://test.com/avatar.jpg',
  phone: '+1-555-987-6543',
  dateOfBirth: '1990-01-01',
  preferences: {
    currency: 'USD',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
  addresses: [
    {
      id: 'address-1',
      type: 'home',
      street: '456 Oak Ave',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: true,
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  emailVerified: true,
  phoneVerified: false,
};

// Cart item mock data
export const mockCartItem = {
  id: 'cart-item-1',
  productId: 'test-product-1',
  variantId: 'variant-1',
  quantity: 2,
  price: 99.99,
  product: mockProduct,
  addedAt: '2024-01-15T10:30:00Z',
};

// Order mock data
export const mockOrder = {
  id: 'test-order-1',
  userId: 'test-user-1',
  items: [mockCartItem],
  subtotal: 199.98,
  tax: 16.0,
  shipping: 9.99,
  total: 225.97,
  status: 'pending',
  paymentStatus: 'pending',
  shippingAddress: mockUserExtended.addresses[0],
  billingAddress: mockUserExtended.addresses[0],
  paymentMethod: {
    type: 'card',
    last4: '1234',
    brand: 'visa',
  },
  tracking: {
    number: 'TRK123456789',
    carrier: 'Test Shipping',
    url: 'https://testshipping.com/track/TRK123456789',
  },
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  estimatedDelivery: '2024-01-20T00:00:00Z',
};

// Review mock data
export const mockReview = {
  id: 'review-1',
  productId: 'test-product-1',
  userId: 'test-user-1',
  user: mockUser,
  rating: 5,
  title: 'Great product!',
  comment: 'This product exceeded my expectations. Highly recommended!',
  verified: true,
  helpful: 12,
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

// Firebase Auth mock data
export const mockFirebaseAuthUser = {
  uid: 'firebase-test-user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://test.com/avatar.jpg',
  emailVerified: true,
  phoneNumber: null,
  providerData: [
    {
      providerId: 'password',
      uid: 'test@example.com',
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: null,
      photoURL: 'https://test.com/avatar.jpg',
    },
  ],
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
    lastSignInTime: '2024-01-15T10:30:00.000Z',
  },
};

export const mockGoogleAuthUser = {
  uid: 'google-test-user-1',
  email: 'googleuser@gmail.com',
  displayName: 'Google Test User',
  photoURL: 'https://lh3.googleusercontent.com/test-photo',
  emailVerified: true,
  phoneNumber: null,
  providerData: [
    {
      providerId: 'google.com',
      uid: '1234567890',
      displayName: 'Google Test User',
      email: 'googleuser@gmail.com',
      phoneNumber: null,
      photoURL: 'https://lh3.googleusercontent.com/test-photo',
    },
  ],
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
    lastSignInTime: '2024-01-15T10:30:00.000Z',
  },
};

// Mock Firebase tokens
export const mockFirebaseIdToken = 'mock-firebase-id-token-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9';
export const mockStrapiToken = 'mock-strapi-jwt-token-bearer-auth';

// Mock API responses
export const mockApiResponses = {
  products: {
    success: {
      data: [mockProduct],
      total: 1,
      page: 1,
      limit: 10,
    },
    error: {
      error: 'Failed to fetch products',
      code: 'FETCH_ERROR',
      status: 500,
    },
  },
  categories: {
    success: {
      data: [mockCategory],
      total: 1,
    },
    error: {
      error: 'Failed to fetch categories',
      code: 'FETCH_ERROR',
      status: 500,
    },
  },
  stores: {
    success: {
      data: [mockStore],
      total: 1,
    },
    error: {
      error: 'Failed to fetch stores',
      code: 'FETCH_ERROR',
      status: 500,
    },
  },
  user: {
    success: {
      data: mockUser,
    },
    error: {
      error: 'User not found',
      code: 'NOT_FOUND',
      status: 404,
    },
  },
  auth: {
    success: {
      token: mockStrapiToken,
      user: mockUser,
      expiresIn: 3600,
    },
    error: {
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
      status: 401,
    },
  },
  firebaseAuth: {
    signInSuccess: {
      user: mockFirebaseAuthUser,
      token: mockFirebaseIdToken,
      needsEmailVerification: false,
    },
    signUpSuccess: {
      user: {
        ...mockFirebaseAuthUser,
        emailVerified: false,
      },
      token: mockFirebaseIdToken,
      needsEmailVerification: true,
    },
    googleSignInSuccess: {
      user: mockGoogleAuthUser,
      token: mockFirebaseIdToken,
      needsEmailVerification: false,
    },
    invalidCredentials: {
      error: 'Invalid email address format.',
      code: 'auth/invalid-email',
    },
    wrongPassword: {
      error: 'Incorrect password.',
      code: 'auth/wrong-password',
    },
    userNotFound: {
      error: 'No account found with this email address.',
      code: 'auth/user-not-found',
    },
    emailAlreadyInUse: {
      error: 'An account with this email already exists.',
      code: 'auth/email-already-in-use',
    },
    weakPassword: {
      error: 'Password is too weak. Please choose a stronger password.',
      code: 'auth/weak-password',
    },
    tooManyRequests: {
      error: 'Too many failed attempts. Please try again later.',
      code: 'auth/too-many-requests',
    },
    networkError: {
      error: 'Network error. Please check your connection.',
      code: 'auth/network-request-failed',
    },
  },
};

// === CONSOLIDATED SIMPLE MOCK DATA ===
// (Merged from simple-mock-data.ts - simplified versions)

export const simpleUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@tifossi.com',
  profilePicture: null,
  isEmailVerified: true,
};

export const simpleProduct = {
  id: 'test-product-1',
  title: 'Test Product',
  price: 99.99,
  imageUrl: 'https://test.com/product-image.jpg',
  rating: 4.5,
  reviewCount: 123,
};

// Data generators for dynamic testing
export const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockProduct,
    id: `test-product-${index + 1}`,
    title: `Test Product ${index + 1}`,
    price: 50 + index * 10,
  }));
};

export const generateCategories = (count: number): Category[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockCategory,
    id: `test-category-${index + 1}`,
    name: `Category ${index + 1}`,
    slug: `category-${index + 1}`,
  }));
};

export const generateStores = (count: number): StoreDetails[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockStore,
    id: `test-store-${index + 1}`,
    cityId: `test-city-${index + 1}`,
    zoneId: `test-zone-${index + 1}`,
    name: `Test Store ${index + 1}`,
    address: `${100 + index} Main St, Test City, TS 12345`,
  }));
};

// Payment-specific mock data
export const mockAddress: Address = {
  id: 'test-address-1',
  street: '456 Oak Avenue',
  number: '123',
  city: 'Montevideo',
  state: 'Montevideo',
  country: 'Uruguay',
  zipCode: '11000',
  isDefault: true,
  addressType: 'home',
  firstName: 'Test',
  lastName: 'User',
  phone: '+598987654321',
};

export const mockCartItems: CartItem[] = [
  {
    productId: 'test-product-1',
    quantity: 2,
    color: 'Black',
    size: 'M',
  },
  {
    productId: 'test-product-2',
    quantity: 1,
    color: 'White',
    size: 'L',
  },
];

export const mockUserData: UserData = {
  id: 'test-user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@tifossi.com',
  phone: {
    areaCode: '598',
    number: '987654321',
  },
  identification: {
    type: 'CI',
    number: '12345678',
  },
};

export const createMockOrderData = (overrides?: Partial<OrderData>): OrderData => ({
  id: 'order-123',
  orderNumber: 'TIF-20241201-123456',
  items: [
    {
      productId: 'test-product-1',
      productName: 'Test Product 1',
      description: 'Test product description',
      quantity: 2,
      price: 29.99,
      size: 'M',
      color: 'Black',
    },
    {
      productId: 'test-product-2',
      productName: 'Test Product 2',
      description: 'Another test product',
      quantity: 1,
      price: 59.99,
      size: 'L',
      color: 'White',
    },
  ],
  user: mockUserData,
  shippingAddress: mockAddress,
  shippingMethod: 'delivery',
  shippingCost: 10,
  subtotal: 89.97,
  discount: 0,
  total: 99.97,
  ...overrides,
});

// Mock payment responses for MSW
export const mockPaymentResponses = {
  createPreference: {
    success: true,
    data: {
      preference: {
        id: 'pref_123456789',
        initPoint: 'https://pay.mercadopago.com/test_preference',
        externalReference: 'TIF-20241201-123456',
      },
    },
  },
  verifyPayment: {
    success: true,
    data: {
      orderId: 'order-123',
      orderNumber: 'TIF-20241201-123456',
      status: 'PAID',
      paymentInfo: {
        id: 'payment_123456789',
        status: 'approved',
        statusDetail: 'accredited',
        amount: 99.97,
        currency: 'UYU',
        paymentMethod: 'visa',
        dateCreated: new Date().toISOString(),
        dateApproved: new Date().toISOString(),
      },
    },
  },
};

// Payment flow test utilities
export const paymentFlowUtils = {
  setupCartWithProducts: () => mockCartItems,
  setupAuthenticatedUser: () => ({
    user: mockUserData,
    token: 'mock-jwt-token',
  }),
  setupShippingAddress: () => mockAddress,
  createCompleteOrderFlow: () => ({
    cartItems: mockCartItems,
    user: mockUserData,
    address: mockAddress,
    orderData: createMockOrderData(),
  }),
};
