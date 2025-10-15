# Tifossi App Features Overview

## Introduction

Tifossi is a React Native Expo application for a sports apparel e-commerce platform. The app will be published on both Apple App Store and Google Play Store, providing a cross-platform mobile shopping experience for sports enthusiasts. This document serves as both a client-facing feature overview and a technical reference for developers.

## App Screens & User Features

### Home Screen

- **Hero Section**: Featured products carousel
- **Categories Navigation**: Quick access to product categories
- **Featured Products**: Highlight of trending/promoted items
- **New Arrivals**: Recently added products section
- **Footer Section**: Store locations and brand information

### Catalog & Product Discovery

- **Category Navigation Screen**: Browse products by sport/category
- **Product Grid View**: Visual catalog of available products
- **Product Filtering**: Filter by size, color, price range, and product labels
- **Search Overlay**: Text-based product search with instant results

### Product Details Screen

- **Product Gallery**: Multiple product images
- **Color Selector**: Visual selection of available color variants
- **Size Selector**: Size options selection
- **Product Description**: Detailed information in expandable sections
- **Add to Cart**: Product addition with size/color/quantity selection
- **Favorites Toggle**: Save products for later purchase
- **Related Products**: Horizontal scroll of complementary items

### Shopping Cart

- **Cart Screen**: Complete list of items in cart with details
- **Quantity Adjustments**: Increase/decrease product quantities
- **Remove Items**: Delete with 3-second undo capability
- **Price Summary**: Subtotal calculation
- **Checkout Button**: Proceed to checkout flow
- **Empty Cart View**: Custom view for empty cart state

### Favorites Management

- **Favorites Screen**: Grid of saved products
- **View Product**: Navigate to product details from favorites
- **Remove from Favorites**: One-tap removal
- **Empty Favorites View**: Custom view for empty state

### Checkout Flow

- **Shipping Address Screen**: Add/select delivery address
- **Pickup/Delivery Option**: Choose between shipping or in-store pickup
- **Store Selection Screen**: Choose pickup location (if applicable)
- **Payment Method Screen**: Select payment option through MercadoPago Checkout Pro
- **Order Review**: Final confirmation before purchase (planned)
- **Success Confirmation**: Order placed confirmation (planned)

### Store Locations

- **Store Finder**: Browse physical store locations
- **City/Zone Navigation**: Hierarchical location browsing
- **Store Details**: Basic store information

### User Account & Authentication

- **Profile Screen**: User information with profile picture display and account options
- **Authentication System**:
  - Email-based registration and login
  - Secure token-based authentication
  - Password reset flow
  - Auth prompt for non-authenticated states
  - Token persistence between sessions
  - Email verification flow
  - Password change capability
  - Explicit logout with splash animation
  - Terms & privacy policy acceptance
  - Mock API integration (ready for backend)
- **Profile Picture Upload/Edit**: Photo selection, cropping, and management
- **Social Authentication**: Google and Apple login (planned)
- **Order History**: Past purchases and status (planned)
- **Saved Addresses**: Management of shipping addresses (planned)

## Technical Implementation

### Frontend Architecture

- **React Native**: Cross-platform mobile development framework
- **Expo SDK 49+**: Development toolkit for streamlined native builds
- **TypeScript**: Static typing system for improved code quality
- **Expo Router**: File-based routing system (similar to Next.js)
- **React Hooks**: Functional component patterns throughout the app

### State Management

- **Zustand Stores**:
  - `cartStore.ts`: Shopping cart with optimistic updates
  - `favoritesStore.ts`: Favorites management
  - `authStore.ts`: Authentication state

### Data Persistence

- **MMKV Storage**: High-performance key-value storage for cart and favorites
- **Expo SecureStore**: Secure storage for authentication tokens
- **Cross-session Restoration**: Automatic state restoration between app launches

### UI Components

- **Custom Component Library**: Purpose-built UI components
- **Advanced Animations**: Polished micro-interactions and transitions
- **Skeleton Screens**: Progressive loading patterns for all data-dependent screens
- **Bottom Tab Navigation**: Core navigation between primary app sections
- **Multiple Card Variants**: Specialized product cards for different contexts

### Performance Optimizations

- **Lazy Loading**: On-demand asset and data loading
- **List Virtualization**: Efficient handling of long product lists
- **Image Optimization**: Progressive and cached image loading
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Debounced Search**: Performance-optimized text search

### API & Data Handling

- **Mock API Layer**: Simulated backend with realistic delays
- **TypeScript Interfaces**: Strong typing for all data models
- **Error Handling**: Comprehensive error states with recovery
- **Offline Support**: Basic functionality without network connection
- **Synchronized State**: Background synchronization of local state

### Product Status System

- **Status Types**: 8 distinct product status categories:
  - `NEW`: New arrivals and recently added products
  - `SALE`: Products with discounted pricing
  - `FEATURED`: Products highlighted throughout the app
  - `OPPORTUNITY`: Special deal or limited opportunity products
  - `RECOMMENDED`: Products recommended to users
  - `POPULAR`: Most popular or trending products
  - `APP_EXCLUSIVE`: Products available only through the app
  - `HIGHLIGHTED`: Products featured on the home screen
- **Localized Labels**: Spanish-language UI labels for each status (e.g., "Nuevo", "Destacado")
- **Priority System**: Display logic for products with multiple statuses
- **Filtering Support**: Category-like filtering by product status

### Development Tools

- **ESLint/Prettier**: Code quality and formatting tools
- **Jest Testing**: Unit and component testing framework
- **Husky Hooks**: Pre-commit code quality checks
- **TypeScript Checks**: Static type checking for all files

This feature set represents the current state of the Tifossi app, with ongoing development focusing on enhancing user experience, performance optimization, and expansion of commerce capabilities.

## Out-of-Scope Features

The following features are explicitly excluded from the current scope of the application:

### General App Features

- **Accessibility Features**: Screen reader support, dynamic text sizing, and other accessibility optimizations
- **Push Notifications**: Remote notifications for order status, promotions, etc.
- **Analytics Integration**: User behavior tracking and reporting
- **Deep Linking (Deferred)**: Handling links when the app is _not_ installed (i.e., redirecting to the App/Play Store and then navigating post-install). _Standard deep linking (opening links when the app is installed) is IN scope._
- **Personalized Recommendations**: User-specific product recommendations based on browsing/purchase history
- **Alternative Home Screens**: Specialized home screens (e.g., "Tiffosi Sport")
- **Custom Designs**: Any components or designs outside of what was specified in the approved designs

### User Support & Engagement Features

- **Chat Support**: Live chat with customer service representatives
- **Support/FAQ Section**: Help articles and frequently asked questions
- **Call Feature**: Direct calling functionality to customer service
- **Help Section**: Dedicated help and support area
- **User Settings**: Advanced user preference configurations
- **Messages Feature**: In-app messaging system

### Promotional Features

- **Coupon System**: Discount code entry and processing
- **Gift Cards**: Purchase and redemption of gift cards

### Payment Platform Integration

- **MercadoPago Checkout Pro**: Hosted payment solution that handles all payment methods available in Uruguay
- **Security**: PCI-DSS compliance managed by MercadoPago
- **Supported Methods**: All credit/debit cards, MercadoPago wallet, and local payment methods
- **Webhooks**: Automatic payment status updates via MercadoPago webhooks
- **Fees**: 5.23% per transaction (14-day settlement) or 4.01% (30-day settlement)

These features may be considered for future development phases but are not part of the current implementation plan.
