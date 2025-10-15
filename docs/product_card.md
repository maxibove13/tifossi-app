# Product Card Components

This document specifies the implementation details for various product card components in the Tifossi app.

## Common Features

All product card variants share these common characteristics:

- Written in TypeScript with full type safety
- Use React Native components
- Follow consistent styling patterns
- Support dark/light mode through the theme system
- Use standardized dimensions from the type system

## Type System

### Core Types

```typescript
type CardVariant = 'default' | 'featured' | 'horizontal' | 'minicard' | 'image-only';
type CardSize = 'small' | 'large';

interface CardDimensions {
  width: number | 'full';
  height: number;
  imageSize: number;
  aspectRatio?: number;
}

interface BaseProductCardProps {
  product: Product;
  onPress?: () => void;
  isDark?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface SizeableProductCardProps<T extends CardVariant> extends BaseProductCardProps {
  size?: CardSizeByVariant<T>;
}

// The actual CARD_DIMENSIONS constant structure
const CARD_DIMENSIONS: Record<CardVariant, Partial<Record<CardSize, CardDimensions>>> = {
  default: {
    small: { width: 132, height: 196, imageSize: 132 },
    large: { width: 160, height: 272, imageSize: 160 },
  },
  featured: {
    small: { width: 'full', height: 420, imageSize: 220 },
    large: { width: 'full', height: 160, imageSize: 160 },
  },
  horizontal: {
    large: { width: 'full', height: 142, imageSize: 119 },
  },
  minicard: {
    large: { width: 128, height: 304, imageSize: 256 },
  },
  'image-only': {
    small: { width: 132, height: 132, imageSize: 132 },
    large: { width: 160, height: 264, imageSize: 160 },
  },
} as const;
```

### Card Variants

#### 1. Default Card

**Variants**: Small (132x196), Large (160x272)  
**Props**: `DefaultCardProps extends SizeableProductCardProps<'default'>`  
**Implementation**: `/app/_components/store/product/default/small.tsx` and `/app/_components/store/product/default/large.tsx`  
**Features**:

- Product image (132x132 or 160x160)
- New tag (optional)
- Product name
- Price
- Wishlist button
- Size variants affect image and text scaling
- Customizable indicator (large variant only)

#### 1B. Promotion Card

**Variants**: Uses a custom size  
**Props**: `PromotionProductCardProps extends { product: Product, onPress?: () => void, style?: StyleProp<ViewStyle> }`  
**Implementation**: `/app/_components/store/product/promotion/PromotionCard.tsx`  
**Features**:

- Product image (132x132)
- New tag or discount label
- Product name
- Original and sale price (if discounted)
- Wishlist button with toggle state
- Dark mode and inverted text color support
- Similar to DefaultCard but optimized for promotions

#### 2. Featured Card

**Variants**: Small (Full Width x 420), Large (Full Width x 160)  
**Props**: `FeaturedCardProps extends SizeableProductCardProps<'featured'> & { onBuyPress?: () => void; }`  
**Implementation**: `/app/_components/store/product/featured/FeaturedCard.tsx`  
**Features**:

- Dark gradient background (#373737 to #0C0C0C)
- New tag (optional)
- Product name
- Price
- Buy button with gradient background
- Customizable indicator
- Large image placement (220px or 160px)
- Full width container
- Centered content with 28px gaps
- Exact Figma-matched typography and spacing
- Dedicated buy and press handlers

#### 3. Horizontal Card (HighlightedCard)

**Variants**: Large only (Full Width x 142)  
**Props**: `HorizontalCardProps extends BaseProductCardProps & { aspectRatio?: number }`  
**Implementation**: `/app/_components/store/product/horizontal/HighlightedCard.tsx`  
**Features**:

- Horizontal layout
- Fixed image width (119px)
- Product details on right
- Structured description with two text elements separated by divider
- Support for shortDescription with line1 and line2 properties
- Status label with color variants
- Optional aspectRatio property for image sizing

#### 4. Minicard

**Variants**: Large only (128x304)  
**Props**: `MinicardProps extends BaseProductCardProps`  
**Implementation**: `/app/_components/store/product/minicard/index.tsx` and `/app/_components/store/product/minicard/large.tsx`  
**Features**:

- Tall image format (256px)
- Minimal product info
- Name and price only
- Clean, focused design

#### 5. Image Only Card

**Variants**: Small (132x132), Large (160x264)  
**Props**: `ImageOnlyCardProps extends SizeableProductCardProps<'image-only'>`  
**Implementation**: `/app/_components/store/product/image/ImageOnlyCard.tsx`  
**Features**:

- Pure image display
- Optional name display
- Square or portrait format
- No additional info

### Product Color Requirements

All products must include a color property to ensure consistent presentation across the app. The Product interface enforces this with the following structure:

```typescript
interface ProductColor {
  color: string;
  quantity: number;
  images: ProductColorImages;
}

// Required on all products
colors: ProductColor[];
```

Cart product cards additionally require a color string to be passed:

```typescript
export interface CartProductCardProps extends BaseProductCardProps {
  quantity: number;
  color: string; // Required
  size?: string;
  onEdit?: () => void;
}
```

## Implementation Guidelines

### 1. Directory Structure

```
app/_components/store/product/
├── types.ts                # Shared types
├── index.tsx              # Main export
├── default/               # Default card variants
│   ├── index.tsx
│   ├── small.tsx
│   └── large.tsx
├── featured/              # Featured product cards
│   └── FeaturedCard.tsx
├── horizontal/            # Horizontal layout cards
│   └── HighlightedCard.tsx
├── minicard/             # Minimal info cards
│   ├── index.tsx
│   └── large.tsx
├── image/                # Image-focused cards
│   ├── ImageOnlyCard.tsx
│   └── ProductImage.tsx
├── promotion/            # Promotion cards
│   └── PromotionCard.tsx
├── cart/                 # Cart cards
│   ├── AddToCartButton.tsx
│   └── CartProductCard.tsx
├── color/                # Color selection components
│   └── index.tsx
├── gallery/              # Product gallery components
│   ├── EnhancedProductGallery.tsx
│   └── views/
│       └── ProductViewGallery.tsx
├── swipeable/            # Swipeable components (performance optimized)
│   ├── ProductDetails.tsx
│   ├── ProductInfoHeader.tsx
│   ├── SectionHeader.tsx
│   ├── SupportOption.tsx
│   └── SwipeableEdge.tsx
├── overlay/              # Overlay components
│   ├── OverlayCheckoutQuantity.tsx
│   ├── OverlayCheckoutShipping.tsx
│   ├── OverlayDeleteConfirmation.tsx
│   ├── OverlayProductEdit.tsx
│   ├── OverlayProductEditSize.tsx
│   └── OverlayShippingSelection.tsx
└── many other specialized components...
```

### 2. Styling Guidelines

- Use `StyleSheet.create` for all styles
- Follow spacing system:
  - xs: 4px
  - sm: 8px
  - md: 12px
  - lg: 16px
  - xl: 24px
- Typography:
  - Font Family: Inter for body, Roboto for titles
  - Size Scale: 10px, 12px, 14px, 16px, 20px
  - Weights: 400 (regular), 500 (medium)
- Colors:
  - Primary: #0C0C0C
  - Secondary: #707070
  - Background Light: #FBFBFB
  - New Tag: #70BF73
  - Border: #DCDCDC

### 3. Best Practices

- Use memo for performance optimization
- Handle loading states
- Support accessibility
- Test on both platforms
- Use proper type guards
- Follow consistent naming
- Keep components focused
- Use shared components for common elements

### 4. Usage Examples

```typescript
// Import all product cards from index.tsx
import ProductCards from '../_components/store/product';

// Default Card
<ProductCards.Default
  product={product}
  size="large"
  onPress={() => {}}
/>

// Alternative import approach
import { Default as DefaultCard } from '../_components/store/product';

<DefaultCard
  product={product}
  size="large"
  onPress={() => {}}
/>

// Featured Card
<ProductCards.Featured
  product={product}
  size="small"
  onBuyPress={() => {}}
  onPress={() => {}}
/>

// Horizontal Card
<ProductCards.Highlighted
  product={product}
  onPress={() => {}}
/>

// Promotion Card
<ProductCards.Promotion
  product={product}
  darkMode={false}
  invertTextColor={false}
  isFavorite={false}
  onPress={() => {}}
/>

// Minicard
<ProductCards.Minicard
  product={product}
  onPress={() => {}}
/>

// Image Only Card
<ProductCards.ImageOnly
  product={product}
  size="small"
  onPress={() => {}}
/>
```

### 5. Type Safety

- Use proper type guards for validation:

```typescript
// Located in: app/_types/product-card.ts (or similar utility location)

export function isValidSize(size: unknown): size is CardSize {
  return typeof size === 'string' && (size === 'small' || size === 'large');
}

export function isValidCardSize<T extends CardVariant>(
  variant: T,
  size: unknown
): size is CardSizeByVariant<T> {
  // Assumes CARD_DIMENSIONS is accessible within this scope or imported
  // const internalCardDimensions = ...
  return isValidSize(size) && size in internalCardDimensions[variant];
}
```

- Use dimension helpers:

```typescript
// Located in: app/_types/product-card.ts (or similar utility location)

// This is the preferred way to access card dimensions:
export function getCardDimensions<T extends CardVariant>(
  variant: T,
  size: CardSizeByVariant<T>
): CardDimensions {
  // Assumes CARD_DIMENSIONS is accessible within this scope or imported
  // const internalCardDimensions = ...
  return internalCardDimensions[variant][size] as CardDimensions;
}

// Example Usage:
import { getCardDimensions } from '../../_types/product-card';

const defaultLargeDims = getCardDimensions('default', 'large');
console.log(defaultLargeDims.width); // 160
```

- Keep types in sync with implementation
- Document type constraints
- Use shared type utilities

### 6. Performance Considerations

- Memoize components using React.memo
- Optimize image loading with proper sizing
- Handle large lists efficiently with FlatList
- Minimize re-renders with proper prop types
- Use proper caching strategies for images
- Replace expensive components (like LinearGradient) with simpler alternatives when appropriate
- Implement device-based caching for dimensions to avoid repeated measurements
- Avoid console.log statements in production code, especially within render methods
- Use optimized background components based on performance needs

### 7. Accessibility

- Support screen readers with proper labels
- Provide meaningful accessibility hints
- Handle focus states for interactive elements
- Support proper color contrast ratios
- Follow platform-specific accessibility guidelines
- Test with VoiceOver (iOS) and TalkBack (Android)
