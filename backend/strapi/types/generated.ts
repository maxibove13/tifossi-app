/**
 * Auto-generated TypeScript types from Strapi schemas
 * These types maintain perfect compatibility with existing mobile app interfaces
 */

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiEntity {
  id: number;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface StrapiRelation<T> {
  data: T extends any[] ? StrapiEntity[] : StrapiEntity | null;
}

export interface StrapiMedia {
  data: {
    id: number;
    attributes: {
      name: string;
      alternativeText?: string;
      caption?: string;
      width: number;
      height: number;
      formats?: Record<string, any>;
      hash: string;
      ext: string;
      mime: string;
      size: number;
      url: string;
      previewUrl?: string;
      provider: string;
      provider_metadata?: any;
      createdAt: string;
      updatedAt: string;
    };
  } | null;
}

// Component Types
export interface ProductShortDescription {
  id: number;
  line1: string;
  line2: string;
}

export interface ProductColor {
  id: number;
  colorName: string;
  hex?: string;
  quantity: number;
  mainImage: StrapiMedia;
  additionalImages: { data: StrapiMedia['data'][] };
  isAvailable: boolean;
  sku?: string;
  weight?: number;
}

export interface ProductSize {
  id: number;
  value: string;
  available: boolean;
  displayOrder: number;
  stock: number;
  sku?: string;
}

export interface ProductDimensions {
  id: number;
  height?: string;
  width?: string;
  depth?: string;
  weight?: string;
  unit: 'cm' | 'mm' | 'm' | 'in' | 'ft';
  weightUnit: 'g' | 'kg' | 'lb' | 'oz';
}

export interface Address {
  id: number;
  name: string;
  phoneNumber?: string;
  street: string;
  number?: string;
  apartment?: string;
  neighborhood?: string;
  city: string;
  department: string;
  postalCode?: string;
  country: string;
  additionalInfo?: string;
  isDefault: boolean;
  addressType: 'home' | 'work' | 'other';
  latitude?: number;
  longitude?: number;
}

export interface SEO {
  id: number;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  structuredData?: any;
  preventIndexing: boolean;
  canonicalURL?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: StrapiMedia;
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
}

export interface OrderItem {
  id: number;
  product: StrapiRelation<StrapiProductEntity>;
  productSnapshot?: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedColor?: string;
  selectedSize?: string;
  customizations?: any;
  notes?: string;
  sku?: string;
  isGift: boolean;
  giftMessage?: string;
}

export interface PaymentInfo {
  id: number;
  method: 'mercadopago' | 'cash_on_delivery' | 'bank_transfer';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  transactionId?: string;
  externalReference?: string;
  amount: number;
  currency: 'UYU' | 'USD';
  paidAt?: string;
  installments: number;
  paymentTypeId?: string;
  issuerId?: string;
  lastFourDigits?: string;
}

export interface OperatingHours {
  id: number;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  isHoliday: boolean;
  holidayNote?: string;
}

// API Entity Types
export interface StrapiProductStatusEntity extends StrapiEntity {
  attributes: {
    name:
      | 'new'
      | 'sale'
      | 'featured'
      | 'opportunity'
      | 'recommended'
      | 'popular'
      | 'app_exclusive'
      | 'highlighted';
    priority: number;
    labelEs: string;
    labelEn?: string;
    color?: string;
    backgroundColor?: string;
    isActive: boolean;
    products: StrapiRelation<StrapiProductEntity[]>;
  };
}

export interface StrapiCategoryEntity extends StrapiEntity {
  attributes: {
    name: string;
    slug: string;
    displayOrder: number;
    description?: string;
    icon?: StrapiMedia;
    isActive: boolean;
    isLabel: boolean;
    labelType?: string;
    products: StrapiRelation<StrapiProductEntity[]>;
    models: StrapiRelation<StrapiProductModelEntity[]>;
    seo?: SEO;
  };
}

export interface StrapiProductModelEntity extends StrapiEntity {
  attributes: {
    name: string;
    slug: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    category: StrapiRelation<StrapiCategoryEntity>;
    products: StrapiRelation<StrapiProductEntity[]>;
  };
}

export interface StrapiProductEntity extends StrapiEntity {
  attributes: {
    title: string;
    slug: string;
    price: number;
    discountedPrice?: number;
    shortDescription?: ProductShortDescription;
    longDescription?: string;
    frontImage: StrapiMedia;
    images?: { data: StrapiMedia['data'][] };
    videoSource?: StrapiMedia;
    category: StrapiRelation<StrapiCategoryEntity>;
    model: StrapiRelation<StrapiProductModelEntity>;
    statuses: StrapiRelation<StrapiProductStatusEntity[]>;
    isCustomizable: boolean;
    warranty?: string;
    returnPolicy?: string;
    colors: ProductColor[];
    sizes?: ProductSize[];
    dimensions?: ProductDimensions;
    seo?: SEO;
    totalStock: number;
    isActive: boolean;
    viewCount: number;
    favoriteCount: number;
  };
}

export interface StrapiStoreLocationEntity extends StrapiEntity {
  attributes: {
    name: string;
    slug: string;
    code: string;
    description?: string;
    address: Address;
    phoneNumber?: string;
    email?: string;
    operatingHours?: OperatingHours[];
    hasPickupService: boolean;
    hasParking: boolean;
    isAccessible: boolean;
    maxPickupItems: number;
    isActive: boolean;
    displayOrder: number;
    images?: { data: StrapiMedia['data'][] };
    orders: StrapiRelation<StrapiOrderEntity[]>;
  };
}

export interface StrapiOrderEntity extends StrapiEntity {
  attributes: {
    orderNumber: string;
    orderDate: string;
    user?: StrapiRelation<StrapiUserEntity>;
    guestEmail?: string;
    items: OrderItem[];
    shippingAddress: Address;
    shippingMethod: 'delivery' | 'pickup';
    storeLocation?: StrapiRelation<StrapiStoreLocationEntity>;
    paymentMethod: 'mercadopago' | 'cash_on_delivery';
    mpPaymentId?: string;
    mpPreferenceId?: string;
    mpCollectionId?: string;
    mpCollectionStatus?: string;
    mpPaymentType?: string;
    mpExternalReference?: string;
    subtotal: number;
    shippingCost: number;
    discount: number;
    tax: number;
    total: number;
    status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    trackingNumber?: string;
    estimatedDelivery?: string;
    deliveredAt?: string;
    notes?: string;
    customerNotes?: string;
    internalNotes?: string;
  };
}

export interface StrapiUserEntity extends StrapiEntity {
  attributes: {
    username: string;
    email: string;
    provider?: string;
    confirmed: boolean;
    blocked: boolean;
    firebaseUid?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profilePicture?: StrapiMedia;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    cart?: any;
    addresses?: Address[];
    defaultShippingAddress?: Address;
    defaultBillingAddress?: Address;
    newsletterSubscribed: boolean;
    marketingEmails: boolean;
    preferredLanguage: 'es' | 'en';
    currency: 'UYU' | 'USD';
    favorites: StrapiRelation<StrapiProductEntity[]>;
    orders: StrapiRelation<StrapiOrderEntity[]>;
    lastLoginAt?: string;
    totalOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
  };
}

// Transformation helpers to convert from Strapi format to mobile app format
export interface ProductTransformed {
  id: string;
  title: string;
  price: number;
  discountedPrice?: number;
  categoryId: string;
  modelId: string;
  frontImage: string;
  images?: string[];
  videoSource?: string;
  statuses: string[];
  shortDescription?: {
    line1: string;
    line2: string;
  };
  longDescription?: string | string[];
  isCustomizable: boolean;
  warranty?: string;
  returnPolicy?: string;
  colors: {
    colorName: string;
    quantity: number;
    hex?: string;
    images: {
      main: string;
      additional?: string[];
    };
  }[];
  sizes?: {
    value: string;
    available: boolean;
  }[];
  dimensions?: {
    height?: string;
    width?: string;
    depth?: string;
  };
}

export type APIProductResponse = StrapiResponse<StrapiProductEntity[]>;
export type APIProductSingleResponse = StrapiResponse<StrapiProductEntity>;
export type APICategoryResponse = StrapiResponse<StrapiCategoryEntity[]>;
export type APIOrderResponse = StrapiResponse<StrapiOrderEntity[]>;
export type APIUserResponse = StrapiResponse<StrapiUserEntity>;
