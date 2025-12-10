# Tifossi App Structure Documentation

## Overview

Tifossi is a mobile-first iOS e-commerce application built with React Native and Expo. This document outlines the structure of the application, its components, screens, and overall architecture to help developers understand the codebase organization.

![Application Sitemap](../sitemaps.png)

## Project Structure

### Root Directory Structure

```
/
├── app/                # Main application code (Expo Router)
├── assets/             # Static assets (images, fonts, icons)
├── docs/               # Documentation files
├── hooks/              # Custom React hooks
│   ├── useProducts.ts  # Product data fetching hooks
│   ├── useSearch.ts    # Search functionality hook
│   ├── useFavoriteStatus.ts # Favorite status hooks
│   ├── useProductFilters.ts # Product filtering hooks
│   └── useThemeColor.ts # Theme color selection
├── scripts/            # Project utility scripts
├── ios/                # iOS specific configuration
├── android/            # Android specific configuration
├── types/              # Global type definitions
├── __tests__/          # Test files and utilities
├── run/                # Husky scripts and hooks
├── .vscode/            # VSCode configuration
└── .cursor/            # Project guidelines and rules (if exists)
```

### App Directory Structure (Expo Router)

```
app/
├── (tabs)/             # Tab-based navigation screens
│   ├── _layout.tsx     # Tab navigation layout
│   ├── index.tsx       # Home screen (store)
│   ├── cart.tsx        # Shopping cart screen
│   ├── favorites.tsx   # Favorite products screen
│   ├── profile.tsx     # User profile screen
│   └── tiffosiExplore.tsx # Explore screen
├── (home)/             # Home-specific screens
│   ├── _layout.tsx     # Home layout
│   └── index.tsx       # Home entry point
├── auth/               # Authentication screens
│   ├── _layout.tsx     # Auth screens layout
│   ├── login.tsx       # User login screen
│   ├── signup.tsx      # User registration screen
│   ├── forgot-password.tsx # Password reset request
│   ├── verify-email.tsx    # Email verification screen
│   ├── verify-success.tsx  # Verification success screen
│   └── verification-code.tsx # Verification code input
├── cart/               # Cart specific screens
│   └── deleted.tsx     # Cart item deleted confirmation
├── catalog/            # Catalog screens
│   └── index.tsx       # Catalog listing
├── checkout/           # Checkout process screens
│   ├── _layout.tsx     # Checkout layout
│   ├── shipping-address.tsx # Shipping address form
│   ├── payment-selection.tsx # Payment method selection
│   ├── shipping-pickup.tsx   # Pickup shipping option
│   ├── shipping-pickup-zone.tsx # Pickup zone selection
│   ├── store-selection.tsx   # Store selection screen
│   ├── new-address.tsx # New address entry form (supports guest mode)
│   └── guest-contact-info.tsx # Guest contact information form
├── locations/          # Store location screens
│   └── [cityId]/       # Dynamic city routes
│       ├── index.tsx   # Store zone selection screen
│       └── [zoneId].tsx # Store details screen
├── products/           # Product-related screens
│   ├── _layout.tsx     # Products layout
│   ├── product.tsx     # Product details screen
│   └── index.ts        # Product exports
├── profile/            # Profile-related screens
│   └── change-password.tsx # Password change screen
├── legal/              # Legal screens
│   ├── terms.tsx       # Terms and conditions screen
│   └── privacy.tsx     # Privacy policy screen
├── _components/        # All React components (organized sections below)
├── _services/          # Application services
│   ├── preload/        # Asset preloading system
│   │   ├── service.ts         # Preload service singleton
│   │   ├── assetLoader.ts     # Asset loading utilities
│   │   ├── dataLoader.ts      # Data loading utilities
│   │   ├── homeAssets.ts      # Home screen asset loader
│   │   ├── hoc.tsx            # High order components for preloading
│   │   ├── hooks.ts           # Preloading hooks
│   │   ├── index.ts           # Entry point exports
│   │   └── types.ts           # Preload type definitions
│   ├── api/            # API service and implementations
│   │   ├── httpClient.ts      # HTTP client with auth and validation
│   │   ├── publicPaths.ts     # Public endpoint detection
│   │   ├── mockApi.ts         # Mock API for development
│   │   ├── strapiApi.ts       # Strapi backend integration
│   │   ├── errorHandler.ts    # API error handling
│   │   └── queryHooks.ts      # React Query hooks
│   └── mmkvTest.ts     # MMKV testing/implementation
├── _stores/            # Global state stores
│   ├── cartStore.ts    # Shopping cart state management
│   ├── favoritesStore.ts # Favorites state management
│   ├── authStore.ts    # Authentication state management
│   ├── paymentStore.ts # Payment state including guest checkout data
│   └── localStorageAdapter.ts # Storage adapter for state persistence
├── _types/             # TypeScript type definitions
│   ├── README.md       # Type system documentation
│   ├── STYLE_GUIDE.md  # Style system guidelines
│   ├── auth.ts         # Authentication types and interfaces
│   ├── product.ts      # Product interfaces and types
│   ├── product-status.ts # Product status enums
│   ├── product-card.ts # Product card types
│   ├── category.ts     # Category types
│   ├── model.ts        # Model types
│   ├── navigation.ts   # Navigation types
│   ├── constants.ts    # Constants
│   └── ui.ts           # UI component types
├── _styles/            # Global styles and themes
│   ├── colors.ts       # Color definitions
│   ├── spacing.ts      # Spacing constants
│   ├── typography.ts   # Typography styles
│   ├── shadows.ts      # Shadow definitions
│   └── tokens/         # Design tokens by feature
│       └── featured.ts # Featured section tokens
├── _data/              # Mock data and content
│   ├── products.ts     # Mock product data
│   ├── categories.ts   # Category definitions
│   ├── models.ts       # Model definitions
│   └── stores.ts       # Store location data
├── not-found.tsx       # 404 error page
├── _layout.tsx         # Root layout component
└── index.tsx           # Entry point
```

### Components Directory Structure

```
_components/
├── auth/               # Authentication components
│   ├── AuthPrompt.tsx     # Reusable auth prompt component
│   └── ProfilePictureEditor.tsx # Profile picture upload/edit component
├── ui/                 # Core UI components
│   ├── layout/         # Layout primitives
│   │   ├── Grid.tsx    # Grid system
│   │   └── Section.tsx # Section containers
│   ├── typography/     # Text components
│   │   └── Text.tsx    # Text component with variants
│   ├── buttons/        # Button variants
│   │   └── Button.tsx  # Button component
│   ├── cards/          # Generic card components
│   ├── badges/         # Badge components
│   │   └── DiscountBadge.tsx # Discount badge
│   ├── toggle/         # Toggle components
│   │   └── ToggleSport.tsx # Sport toggle
│   ├── form/           # Form components
│   │   ├── Input.tsx        # Text input
│   │   ├── Dropdown.tsx     # Dropdown selector
│   │   ├── RadioButton.tsx  # Radio button
│   │   ├── SelectionControl.tsx # Base selection control
│   │   └── SingleChoice.tsx # Option selector
│   ├── icons/          # Icon components
│   │   ├── HeartActiveIcon.tsx # Active heart icon
│   │   └── index.ts      # Icon exports
│   ├── links/          # Link components
│   │   └── index.ts      # Link exports
│   ├── navigation/     # Navigation UI elements
│   │   └── index.ts      # Navigation exports
│   └── README.md       # UI component guidelines
├── store/              # Store-specific components
│   ├── product/        # Product card variants
│   │   ├── types.ts        # Product component types
│   │   ├── ColorSlider.tsx # Color selection slider
│   │   ├── default/        # Default product cards
│   │   │   ├── small.tsx     # Small card variant
│   │   │   ├── large.tsx     # Large card variant
│   │   │   └── index.tsx     # Exports
│   │   ├── featured/       # Featured product cards
│   │   │   └── FeaturedCard.tsx # Featured card implementation
│   │   ├── horizontal/     # Horizontal product cards
│   │   │   └── HighlightedCard.tsx # Highlighted card impl
│   │   ├── promotion/      # Promotion product cards
│   │   │   └── PromotionCard.tsx # Promotion card impl
│   │   ├── minicard/       # Mini card variants
│   │   │   ├── index.tsx     # Exports
│   │   │   └── large.tsx     # Large minicard impl
│   │   ├── image/          # Image-only cards
│   │   │   ├── ImageOnlyCard.tsx # Image card impl
│   │   │   └── ProductImage.tsx  # Product image component
│   │   ├── swipeable/      # Swipeable product details (performance optimized)
│   │   │   ├── ProductDetails.tsx  # Product details
│   │   │   ├── ProductInfoHeader.tsx # Info header
│   │   │   ├── SectionHeader.tsx # Section header
│   │   │   ├── SupportOption.tsx # Support option
│   │   │   ├── SwipeableEdge.tsx # Swipeable edge component
│   │   │   └── styles.ts         # Swipeable styles
│   │   ├── gallery/        # Product gallery components
│   │   │   ├── EnhancedProductGallery.tsx # Gallery component
│   │   │   └── views/      # Gallery views
│   │   │       └── ProductViewGallery.tsx # Gallery view
│   │   ├── overlay/        # Overlay components
│   │   │   ├── OverlayCheckoutQuantity.tsx # Quantity selection
│   │   │   ├── OverlayCheckoutShipping.tsx # Shipping selection
│   │   │   ├── OverlayDeleteConfirmation.tsx # Delete confirmation
│   │   │   ├── OverlayProductEdit.tsx      # Product editing
│   │   │   ├── OverlayProductEditSize.tsx  # Size selection
│   │   │   ├── OverlayProductFilters.tsx   # Product filters
│   │   │   ├── OverlayProductRemoving.tsx  # Cart item removal with undo
│   │   │   ├── OverlayProductSearch.tsx    # Product search
│   │   │   ├── OverlayShippingAddress.tsx  # Shipping address
│   │   │   └── OverlayShippingSelection.tsx # Shipping method
│   │   ├── cart/           # Cart product cards
│   │   │   ├── AddToCartButton.tsx # Add to cart button
│   │   │   └── CartProductCard.tsx # Cart product card
│   │   ├── details/        # Product details components
│   │   │   └── ExpandableSection.tsx # Expandable section
│   │   ├── info/           # Product info components
│   │   ├── information/    # Product information components
│   │   ├── related/        # Related products components
│   │   │   └── RelatedProducts.tsx # Related products
│   │   ├── sections/       # Product sections
│   │   │   └── ProductSections.tsx # Product sections component
│   │   ├── support/        # Support components
│   │   └── index.tsx       # Product component exports
│   ├── layout/         # Store layout components
│   │   ├── Header.tsx       # Store header
│   │   ├── Footer.tsx       # Store footer
│   │   ├── Categories.tsx   # Category navigation
│   │   ├── CategoryShowcase.tsx # Category showcase
│   │   ├── Locations.tsx    # Store locations
│   │   └── index.tsx        # Layout exports
│   ├── cart/           # Cart components
│   │   └── EmptyCart.tsx    # Empty cart state
│   ├── favorites/      # Favorites components
│   │   └── EmptyFavorites.tsx # Empty favorites state
│   └── review/          # Product review components
│       └── ReviewCard.tsx   # Review component
├── home/               # Home screen components
│   ├── HomeContent.tsx # Home content
│   └── HomeHeader.tsx  # Home header
├── skeletons/          # Loading state components
│   ├── FavoritesSkeleton.tsx # Favorites loading skeleton
│   ├── HomeScreenSkeleton.tsx # Home screen loading skeleton
│   ├── ProductGridSkeleton.tsx # Product grid loading skeleton
│   └── ProgressiveLoadingSection.tsx # Progressive loading
├── checkout/           # Checkout components
│   └── SelectionListScreen.tsx # Selection list for checkout
├── common/             # Shared utility components
│   ├── ErrorBoundary.tsx   # Error handler
│   ├── ScreenHeader.tsx    # Screen header
│   ├── Subheader.tsx       # Subheader component
│   ├── VideoBackground.tsx # Video background
│   ├── animation/          # Animation components
│   └── share/              # Sharing functionality
├── navigation/         # Navigation components
│   ├── TabBar.tsx          # Bottom tab bar
│   ├── TabBarBackground.tsx # Tab bar background
│   └── category/           # Category navigation
│       └── CategoryNavigation.tsx # Category menu
└── splash/             # Splash screen components
    └── SplashScreen.tsx    # App splash screen
```

### Types Directory Structure

```
types/
├── declarations/      # Type declarations
│   ├── images.d.ts    # Image module declarations
│   └── svg.d.ts       # SVG module declarations
├── svg.d.ts           # SVG type definitions
└── quantity-icons.d.ts # Quantity icons type definitions
```

### Tests Directory Structure

```
app/_tests/
├── setup.ts                      # Test setup and configuration
├── smoke.test.tsx                # Basic smoke tests
├── components.test.tsx           # Component tests
└── services/
    └── httpClient.test.ts        # HTTP client and public path tests
```

### Styles Directory Structure

```
styles/
├── colors.ts      # Color palette definitions
├── typography.ts  # Typography styles
├── spacing.ts     # Spacing and layout constants
├── shadows.ts     # Shadow styles
└── tokens/        # Design tokens
    └── featured.ts # Featured section tokens
```

## Navigation Structure

The app uses Expo Router with a tab-based navigation structure:

1. **Store Tab** - Main product browsing experience
2. **Favorites Tab** - Saved/favorite products
3. **Home Tab** - Landing/home page with featured content
4. **Cart Tab** - Shopping cart management
5. **Profile Tab** - User settings and information

## Component Categories

### UI Components

1. **Layout Components**
   - Grid system for responsive layouts
   - Section containers with consistent spacing
   - Flexible layout primitives

2. **Typography Components**
   - Text variants for different contexts
   - Heading styles with proper hierarchy
   - Styled text elements

3. **Form Components**
   - Input fields with validation
   - Selection controls for user choices
   - Form layout and organization

4. **Button Components**
   - Primary action buttons
   - Secondary/tertiary buttons
   - Icon buttons for compact actions

### Store Components

1. **Product Cards**
   - Default cards (small/large)
   - Featured cards for highlights
   - Horizontal cards for lists
   - Promotion cards for discounts
   - Cart cards for shopping experience

2. **Layout Components**
   - Store header with navigation
   - Category sections
   - Location displays
   - Footer with branding

3. **Review Components**
   - Rating display
   - Review cards with user info

### Common Components

1. **Utility Components**
   - Error boundaries for error handling
   - Video backgrounds (see VideoBackground documentation below)
   - Animation utilities

2. **Navigation Components**
   - Tab bar with icons
   - Category navigation
   - Header navigation elements

#### VideoBackground Component

**Location**: `app/_components/common/VideoBackground.tsx`

A reusable component for displaying video backgrounds with fallback support.

**Features**:
- Supports both local (bundled) and remote (Strapi/CDN) video sources
- Automatic fallback to static image on error
- Configurable overlay gradient
- Preloading integration
- Memoized for performance

**Usage**:

```typescript
// Local bundled video (app UI)
<VideoBackground source={require('../../assets/videos/splash-screen-background.mov')}>
  <YourContent />
</VideoBackground>

// Remote video from Strapi (product videos)
<VideoBackground source="https://cdn.example.com/video.mp4" fallbackImage={productImage}>
  <YourContent />
</VideoBackground>
```

**Video Asset Strategy**:
- **Local videos** (via `require()`): App UI elements (home screen, splash)
  - Instant load, no network dependency
  - Bundled with app binary
  - Example: Home screen background
- **Remote videos** (via URL): Dynamic content from Strapi
  - Product videos, demos
  - Managed through CMS
  - Example: Product rotation videos

**Props**:
- `source`: number (require) or string (URL)
- `fallbackImage`: Static image to show if video fails
- `overlayOpacity`: Gradient overlay opacity (default: 0.4)
- `shouldLoop`: Loop video (default: true)
- `shouldMute`: Mute audio (default: true)
- `shouldAutoPlay`: Autoplay on mount (default: true)

## Type System

The app uses TypeScript with a well-structured type system. Key type categories include:

### Product Types

Product data structures and related types for consistent product representation:

```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  image: string | ImageSourcePropType;
  label?: ProductLabel;
  status?: ProductStatus;
  description?: string | string[];
  discountedPrice?: number;
  isCustomizable?: boolean;
  colors?: {
    color: string;
    quantity: number;
  }[];
  size?: string;
  sizes?: ProductSize[];
}
```

### UI Component Types

Consistent prop types for UI components:

```typescript
interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface TextComponentProps {
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}
```

### Card Types

Type system for product cards:

```typescript
type CardVariant = 'default' | 'featured' | 'horizontal' | 'promotion' | 'minicard' | 'image-only';
type CardSize = 'small' | 'large';

interface CardDimensions {
  width: number | string;
  height: number;
  imageSize: number;
}
```

## Development Guidelines

### Debugging and Problem Solving

- **Always read this document first** before searching the codebase
- Refer to the component hierarchy for understanding relationships
- Use the style system documentation for visual styling guidance
- Look at the imports to understand dependencies

### Mobile-First iOS Development

- Always design and implement with iOS as the primary platform
- Follow iOS-native interaction patterns
- Test on iOS devices/simulators first
- Consider iOS system features (safe area, notch, etc.)

### Visual Verification

- Always check that components match both JSX reference and screenshots
- Refer to design tokens in the styles directory for accurate styling
- Verify spacing, typography, and colors match the Figma specs

### Code Organization Principles

- Modular component architecture
- Clear separation of concerns
- Consistent naming and file structure
- Type safety throughout the codebase

### Simplicity Over Complexity

- Prefer simple solutions when possible
- Avoid premature optimization
- Keep component logic focused
- Follow established patterns

## Implementation Status

✅ **Fully Implemented**

- Core UI Components
- Product Card System
- Navigation Structure
- Type System
- Store Layout
- Swipeable Interfaces (Performance Optimized)
- Advanced Animations
- Loading States
- Asset Preloading
- Progressive Loading System
- Local State Management (Cart, Favorites, Auth)
- Product Filtering System
- Cart Item Removal with Undo
- Store Location Screens
- Product Sharing (via Native Share Sheet)
- Authentication System (Complete with mock API integration)
- Profile Management (Password change, profile picture)

🟡 **Partially Implemented**

- Form Components
- Review System
- Server State Integration
- Search Functionality (Initial client-side implementation)

## Additional Resources

- Check [components.md](./components.md) for detailed component specifications
- See [product_card.md](./product_card.md) for product card implementation details
- See [loading_system.md](./loading_system.md) for details on the preloading and progressive loading system
- See [navigation.md](./navigation.md) for details on the navigation system
- See [locations.md](./locations.md) for store location screen implementation
- See [cart_undo.md](./cart_undo.md) for cart item removal with undo feature
- See [product_filters.md](./product_filters.md) for product filtering implementation
- See [authentication.md](./authentication.md) for details on the authentication system
- See [state_management.md](./state_management.md) for overall state management strategy
- See [local_state_management.md](./local_state_management.md) for client-side state implementation details
- See [state_management_client_side.md](./state_management_client_side.md) for the full client-side state implementation plan
- See [state_management_implementation.md](./state_management_implementation.md) for implementation status of state management

## Notes
