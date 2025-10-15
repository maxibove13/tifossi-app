# Type System Documentation

## Overview

The Tifossi Expo app uses TypeScript for type safety throughout the codebase. This document explains the type system organization, common patterns, and best practices for using and extending types.

## Type Organization

All types are organized in the `app/_types` directory, with the following structure:

- `index.ts`: Central export point for all types (import from here)
- `product.ts`: Product data models and utility functions
- `product-card.ts`: Product card component types and dimension definitions
- `product-status.ts`: Enums and utilities for product statuses and labels
- `navigation.ts`: Navigation route parameters and navigation component props
- `ui.ts`: Common UI component prop interfaces
- `declarations/svg.d.ts`: TypeScript declaration for SVG imports (excluded from routing)

## Core Type Domains

### 1. Product Types

The product domain includes several related type definitions:

```typescript
// Product data model
interface Product {
  id: string;
  title: string;
  price: number;
  categoryId: string; // Category reference
  modelId: string; // Model identifier for grouping similar products
  images?: (string | ImageSourcePropType)[]; // Array of product images
  frontImage: string | ImageSourcePropType; // Main/front image to display (REQUIRED)
  videoSource?: number | string; // Video source for product displays
  statuses: ProductStatus[]; // Array of product statuses (NEW, FEATURED, etc.)
  /** @deprecated Use shortDescription or longDescription instead */
  description?: string | string[];
  shortDescription?: {
    line1: string;
    line2: string;
  };
  longDescription?: string | string[];
  discountedPrice?: number;
  isCustomizable?: boolean;
  colors: ProductColor[]; // Required array of product colors
  size?: string;
  sizes?: ProductSize[];
  warranty?: string;
  returnPolicy?: string;
  dimensions?: {
    height?: string;
    depth?: string;
    width?: string;
  };
}

// Product color with images
interface ProductColor {
  colorName: string; // Human-readable name like "Negro", "Blanco"
  quantity: number;
  images: ProductColorImages;
  hex?: string; // Hex color code like "#FFFFFF" for display in UI
}

interface ProductColorImages {
  main: string | ImageSourcePropType;
  additional?: Array<string | ImageSourcePropType>;
}

// Product card data model (for display)
interface ProductCardData {
  id: string;
  name: string;
  price: number;
  image: string | ImageSourcePropType;
  isNew?: boolean;
  description?:
    | string
    | string[]
    | {
        line1: string;
        line2: string;
      };
  discountPercentage?: number;
  originalPrice?: number;
  quantity?: number;
  color?: string;
  size?: string;
  // ...other properties
}
```

### 2. Product Status System

Product statuses and labels are defined using TypeScript enums:

```typescript
enum ProductStatus {
  NEW = 'new',
  SALE = 'sale',
  FEATURED = 'featured',
  OPPORTUNITY = 'opportunity',
  RECOMMENDED = 'recommended',
  POPULAR = 'popular',
  APP_EXCLUSIVE = 'app_exclusive',
  HIGHLIGHTED = 'highlighted',
}

enum ProductLabel {
  NEW = 'Nuevo',
  FEATURED = 'Destacado',
  OPPORTUNITY = 'Oportunidad',
  SALE = 'Descuento',
  RECOMMENDED = 'Recomendado',
  POPULAR = 'Popular',
  APP_EXCLUSIVE = 'Exclusivo in-app',
  HIGHLIGHTED = 'Destacado Home',
}
```

These enums are used with type guard functions like `isValidStatus()` and `isValidLabel()` for runtime validation.

### 3. Product Card System

The product card system uses sophisticated TypeScript features for type safety:

```typescript
// Card variants and sizes
type CardVariant = 'default' | 'featured' | 'horizontal' | 'minicard' | 'image-only';
type CardSize = 'small' | 'large';

// Dimensions for different card variants and sizes
interface CardDimensions {
  width: number | 'full';
  height: number;
  imageSize: number;
  aspectRatio?: number;
}

// Type that maps variants to their available sizes
type CardSizeByVariant<T extends CardVariant> = keyof (typeof CARD_DIMENSIONS)[T];
```

### 4. UI Component Props

Common UI component prop interfaces like:

```typescript
interface ButtonProps extends BaseComponentProps {
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'text' | 'outlined';
  size?: 'small' | 'medium' | 'large';
}

interface InputProps extends FormControlProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}
```

### 5. Navigation Types

Navigation routes and parameters:

```typescript
type RootTabParamList = {
  home: undefined;
  product: { product: Product };
  favorites: undefined;
  cart: undefined;
  profile: undefined;
  tiffosiExplore: undefined;
};

type RootStackParamList = {
  '(tabs)': undefined;
  '(home)': undefined;
  // ...other routes
};
```

## Style Types

React Native style types are used throughout the codebase:

- `ViewStyle`: For View components
- `TextStyle`: For Text components
- `ImageStyle`: For Image components
- `StyleProp<ViewStyle>`: For component props that accept View styles

Example of typed styles:

```typescript
type Styles = {
  container: ViewStyle;
  title: TextStyle;
  content: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.heading.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
  },
  content: {
    marginTop: spacing.sm,
  },
});
```

## Type Safety Best Practices

### 1. Importing Types

Import types from the central `index.ts` file:

```typescript
// ✅ DO THIS - Import from central location
import { Product, ButtonProps, CardVariant } from '../types';

// ❌ AVOID THIS - Don't import directly from individual files
import { Product } from '../types/product';
```

### 2. Type Guards

Use type guards for runtime type checking:

```typescript
// Example type guard
function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;

  const p = value as Partial<Product>;
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    typeof p.price === 'number' &&
    p.frontImage !== undefined &&
    Array.isArray(p.statuses) &&
    p.statuses.every((status) => isValidStatus(status))
  );
}
```

### 3. Extending Types

Extend existing types using interface inheritance or type intersections:

```typescript
// Interface inheritance
interface ExtendedProductProps extends BaseProductCardProps {
  highlightColor: string;
  onFavorite: () => void;
}

// Type intersection
type CombinedProps = ProductCardProps & AnimationProps;
```

### 4. Generic Types

Use generic type parameters for flexible, reusable types:

```typescript
// Example generic type from card system
type CardSizeByVariant<T extends CardVariant> = keyof (typeof CARD_DIMENSIONS)[T];

// Usage
function getCardDimensions<T extends CardVariant>(
  variant: T,
  size: CardSizeByVariant<T>
): CardDimensions {
  return CARD_DIMENSIONS[variant][size] as CardDimensions;
}
```

### 5. Style Type Safety

Follow style typing best practices:

- Use `StyleSheet.create<Styles>({...})` with a defined `Styles` type
- Use string literals for fontWeight (`'400'`, `'500'`, etc.)
- Type props that accept styles as `StyleProp<ViewStyle>` or `StyleProp<TextStyle>`

## Adding New Types

1. Determine the appropriate domain file for your new type
2. Add the type definition to the appropriate file
3. Export the type from the file
4. Add the type to the exports in `index.ts` if needed
5. Use consistent naming conventions (PascalCase for interfaces, types, and enums)

## Type System Evolution

The type system should evolve with the application:

1. Refactor types when common patterns emerge
2. Create utility types for repeated patterns
3. Keep type definitions close to their domain
4. Document complex types with comments

## Running Type Checks

To check for type errors:

```bash
npm run typecheck
# or
npx tsc --noEmit
```

Fix any type errors before committing code.
