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
type CardVariant = 'default' | 'featured' | 'horizontal' | 'minicard' | 'image-only'
type CardSize = 'small' | 'large'

interface CardDimensions {
  width: number | 'full'
  height: number
  imageSize: number
  aspectRatio?: number
}

interface BaseProductCardProps {
  product: Product
  onPress?: () => void
  isDark?: boolean
  isLoading?: boolean
  style?: StyleProp<ViewStyle>
}

interface SizeableProductCardProps<T extends CardVariant> extends BaseProductCardProps {
  size?: CardSizeByVariant<T>
}
```

### Card Variants

#### 1. Default Card
**Variants**: Small (132x196), Large (160x272)  
**Props**: `DefaultCardProps extends SizeableProductCardProps<'default'>`  
**Features**:
- Product image (132x132 or 160x160)
- New tag (optional)
- Product name
- Price
- Wishlist button
- Size variants affect image and text scaling
- Customizable indicator (large variant only)

#### 2. Featured Card
**Variants**: Small (Full Width x 420), Large (Full Width x 160)  
**Props**: `FeaturedCardProps extends SizeableProductCardProps<'featured'>`  
**Features**:
- Dark gradient background (#373737 to #0C0C0C)
- New tag (optional)
- Product name
- Price
- Buy button with semi-transparent background
- Customizable indicator
- Large image placement (220px or 160px)
- Full width container
- Centered content with 28px gaps
- Exact Figma-matched typography and spacing

#### 3. Horizontal Card
**Variants**: Large only (Full Width x 142)  
**Props**: `HorizontalCardProps extends BaseProductCardProps`  
**Features**:
- Horizontal layout
- Fixed image width (119px)  
- Product details on right
- Structured description with two text elements separated by divider
- Support for shortDescription with line1 and line2 properties
- Status label with color variants

#### 4. Minicard
**Variants**: Large only (128x304)  
**Props**: `MinicardProps extends BaseProductCardProps`  
**Features**:
- Tall image format (256px)
- Minimal product info
- Name and price only
- Clean, focused design

#### 5. Image Only Card
**Variants**: Small (132x132), Large (160x264)  
**Props**: `ImageOnlyCardProps extends SizeableProductCardProps<'image-only'>`  
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
  quantity: number
  color: string  // Required
  size?: string
  onEdit?: () => void
}
```

## Implementation Guidelines

### 1. Directory Structure
```
app/components/store/product/
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
│   └── large.tsx
├── image/                # Image-focused cards
│   ├── ImageOnlyCard.tsx
│   └── ProductImage.tsx
├── promotion/            # Promotion cards
│   └── PromotionCard.tsx
├── cart/                 # Cart cards
│   └── CartProductCard.tsx
└── color/                # Color selection components
    └── ColorSlider.tsx
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
// Default Card
<DefaultCard 
  product={product}
  size="large"
  onPress={() => {}}
/>

// Featured Card
<FeaturedCard
  product={product}
  size="small"
  onBuyPress={() => {}}
/>

// Horizontal Card
<HighlightedCard
  product={product}
  onPress={() => {}}
/>

// Minicard
<MinicardLarge
  product={product}
  onPress={() => {}}
/>

// Image Only Card
<ImageOnlyCard
  product={product}
  size="small"
  onPress={() => {}}
/>
```

### 5. Type Safety
- Use proper type guards for validation:
```typescript
export function isValidSize(size: unknown): size is CardSize {
  return typeof size === 'string' && (size === 'small' || size === 'large')
}

export function isValidCardSize<T extends CardVariant>(
  variant: T,
  size: unknown
): size is CardSizeByVariant<T> {
  return isValidSize(size) && size in CARD_DIMENSIONS[variant]
}
```
- Use dimension helpers:
```typescript
export function getCardDimensions<T extends CardVariant>(
  variant: T,
  size: CardSizeByVariant<T>
): CardDimensions {
  return CARD_DIMENSIONS[variant][size] as CardDimensions
}
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

### 7. Accessibility
- Support screen readers with proper labels
- Provide meaningful accessibility hints
- Handle focus states for interactive elements
- Support proper color contrast ratios
- Follow platform-specific accessibility guidelines
- Test with VoiceOver (iOS) and TalkBack (Android)