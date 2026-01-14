# Tifossi Component System Documentation

## Overview

The Tifossi component system follows a modular, domain-driven organization with a strong focus on type safety and consistent design. This document serves as the comprehensive specification and implementation reference for all components in the Tifossi e-commerce app.

## Component Organization

### Directory Structure

```
app/_components/
├── common/           # Shared utility components
│   ├── animation/    # Animation utilities
│   ├── ErrorBoundary.tsx
│   ├── ScreenHeader.tsx
│   ├── Subheader.tsx
│   ├── SubheaderClose.tsx
│   ├── VideoBackground.tsx
│   └── share/        # Sharing functionality
├── home/             # Home screen components
│   ├── HomeContent.tsx
│   └── HomeHeader.tsx
├── navigation/       # Navigation components
│   ├── TabBar.tsx
│   └── category/     # Category navigation
├── skeletons/        # Loading state components
│   └── HomeScreenSkeleton.tsx
├── splash/           # App initialization
│   └── SplashScreen.tsx
├── store/            # Store-specific components
│   ├── layout/       # Store layouts
│   │   ├── Categories.tsx
│   │   ├── CategoryShowcase.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Locations.tsx
│   │   └── ProductHeader.tsx
│   ├── product/      # Product display components
│   │   ├── ColorSlider.tsx
│   │   ├── ProductDetails.tsx
│   │   ├── index.tsx
│   │   ├── swipeable/  # Swipeable components
│   │   │   ├── ProductDetails.tsx
│   │   │   ├── ProductInfoHeader.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   └── SupportOption.tsx
│   │   └── types.ts
│   └── review/       # Product reviews
│       └── ReviewCard.tsx
└── ui/               # Core UI components
    ├── buttons/      # Button components
    │   └── Button.tsx
    ├── cards/        # Card components
    ├── badges/       # Badge components
    │   └── DiscountBadge.tsx
    ├── form/         # Form controls
    │   ├── Input.tsx
    │   ├── Dropdown.tsx
    │   ├── RadioButton.tsx
    │   ├── SelectionControl.tsx
    │   └── SingleChoice.tsx
    ├── layout/       # Layout primitives
    │   ├── Grid.tsx
    │   └── Section.tsx
    ├── toggle/       # Toggle components
    │   └── ToggleSport.tsx
    ├── icons/        # Icon components
    │   ├── HeartActiveIcon.tsx
    │   └── index.ts
    ├── links/        # Link components
    │   └── index.ts
    ├── navigation/   # Navigation UI
    │   └── index.ts
    └── typography/   # Text components
        └── Text.tsx
```

## Component Categories

### Core UI Components (`/app/_components/ui/`)

These are the fundamental building blocks that form the foundation of the UI system.

#### Typography (`/_components/ui/typography/Text.tsx`)

The Text component provides consistent typography across the app with support for various styles.

```tsx
import { Text } from '../_components/ui/typography/Text';

<Text variant="heading">Product Title</Text>
<Text variant="body">Product description text goes here</Text>
<Text variant="label">Size</Text>
<Text variant="caption" color="secondary">In stock</Text>
```

Props:

- `variant`: 'heading' | 'subheading' | 'body' | 'label' | 'caption'
- `color`: 'primary' | 'secondary' | 'error' | 'success'
- `weight`: 'regular' | 'medium' | 'semibold' | 'bold'
- `align`: 'left' | 'center' | 'right'
- `numberOfLines`: number - Truncates text with ellipsis
- `style`: StyleProp<TextStyle> - Additional styling

#### Buttons (`/_components/ui/buttons/Button.tsx`)

The Button component provides consistent button styling with multiple variants.

```tsx
import { Button } from '../components/ui/buttons/Button';

<Button variant="primary" onPress={handlePress}>Add to Cart</Button>
<Button variant="secondary" onPress={handleCancel}>Cancel</Button>
<Button variant="text" onPress={handleMore}>See More</Button>
```

Props:

- `variant`: 'primary' | 'secondary' | 'text' | 'outlined'
- `size`: 'small' | 'medium' | 'large'
- `onPress`: () => void - Button press handler
- `disabled`: boolean - Disables button
- `loading`: boolean - Shows loading indicator
- `icon`: ReactNode - Optional icon
- `style`: StyleProp<ViewStyle> - Additional styling
- `textStyle`: StyleProp<TextStyle> - Custom text styling (fontSize, fontWeight, etc.)

#### Layout Components (`/_components/ui/layout/`)

Layout components provide consistent structure for content:

1. **Grid** (`/_components/ui/layout/Grid.tsx`): Flexible grid layout for items

   ```tsx
   import { Grid } from '../_components/ui/layout/Grid';

   <Grid columns={2} spacing={spacing.md}>
     {products.map((product) => (
       <ProductCard key={product.id} product={product} />
     ))}
   </Grid>;
   ```

2. **Section** (`/_components/ui/layout/Section.tsx`): Consistent section with optional header

   ```tsx
   import { Section } from '../_components/ui/layout/Section';

   <Section title="Featured Products" action={{ label: 'See All', onPress: handleSeeAll }}>
     <FeaturedProducts />
   </Section>;
   ```

### Form Components (`/app/_components/ui/form/`)

Form components handle user input with consistent styling and behavior.

#### Input (`/_components/ui/form/Input.tsx`)

Text input with label and error handling.

```tsx
import { Input } from '../_components/ui/form/Input';

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="your@email.com"
  error={emailError}
  required
/>;
```

#### Dropdown (`/_components/ui/form/Dropdown.tsx`)

Dropdown selector for options.

```tsx
import { Dropdown } from '../_components/ui/form/Dropdown';

<Dropdown
  label="Select Option"
  options={options}
  selectedOption={selectedOption}
  onSelect={setSelectedOption}
/>;
```

#### RadioButton (`/_components/ui/form/RadioButton.tsx`)

Radio button selection component.

```tsx
import { RadioButton } from '../_components/ui/form/RadioButton';

<RadioButton value={selected} onChange={setSelected} label="Option" />;
```

#### SingleChoice (`/_components/ui/form/SingleChoice.tsx`)

Single selection from multiple options.

```tsx
import { SingleChoice } from '../_components/ui/form/SingleChoice';

<SingleChoice options={sizes} value={selectedSize} onChange={setSelectedSize} label="Size" />;
```

### Store Components (`/app/_components/store/`)

Components specific to the e-commerce store functionality.

#### Product Components (`/_components/store/product/`)

1. **ProductDetails** (`/_components/store/product/swipeable/ProductDetails.tsx`): Comprehensive product display

   ```tsx
   import { ProductDetails } from '../_components/store/product/swipeable/ProductDetails';

   <ProductDetails product={product} />;
   ```

2. **ColorSlider** (`/_components/store/product/ColorSlider.tsx`): Color selection for products

   ```tsx
   import { ColorSlider } from '../_components/store/product/ColorSlider';

   <ColorSlider
     colors={product.colors}
     selectedColor={selectedColor}
     onSelect={setSelectedColor}
   />;
   ```

#### Swipeable Components (`/_components/store/product/swipeable/`)

Components that support swipe gestures for interactive product displays.

1. **ProductDetails** (`/_components/store/product/swipeable/ProductDetails.tsx`): Swipeable product view
2. **ProductInfoHeader** (`/_components/store/product/swipeable/ProductInfoHeader.tsx`): Product header
3. **SectionHeader** (`/_components/store/product/swipeable/SectionHeader.tsx`): Section header
4. **SupportOption** (`/_components/store/product/swipeable/SupportOption.tsx`): Support options
5. **SwipeableEdge** (`/_components/store/product/swipeable/SwipeableEdge.tsx`): Main swipeable panel component for product details
   - Performance-optimized with device-width based height caching
   - Uses lightweight View component for background instead of LinearGradient
   - Implements efficient memory usage techniques for smooth animations
   - **"Comprar ahora" flow:** Uses `handleOverlayBuyNow` callback to store product in `pendingBuyNowItem` (paymentStore) instead of adding to cart, allowing clean checkout abandonment

#### Overlay Components (`/_components/store/product/overlay/`)

Modal overlay components for the checkout process.

1. **OverlayAddingToCart** (`/_components/store/product/overlay/OverlayAddingToCart.tsx`): Loading overlay shown while adding item to cart
   - Displays animated progress bar
   - Shows "Agregando al carrito..." message
   - Allows user to cancel the operation
2. **OverlayProductAdding** (`/_components/store/product/overlay/OverlayProductAdding.tsx`): Success confirmation after adding to cart
   - Shows "Item añadido al carrito" message
   - Provides "Comprar ahora" button to proceed to checkout
   - Provides "Volver a Tienda" button that navigates to the store tab (not back to product page)
   - Integrates with OverlayShippingSelection for checkout flow
3. **OverlayCheckoutShipping** (`/_components/store/product/overlay/OverlayCheckoutShipping.tsx`): Add-to-cart selection overlay
   - Requires explicit user selection of both size AND quantity before showing action buttons
   - Shows "Seleccionar" until user manually picks options (prevents accidental defaults)
   - Action buttons ("Comprar ahora" / "Agregar al carrito") hidden until both selections made
   - Resets nested overlay states (quantity, size, shipping) when main overlay closes to prevent UI blocking
   - "Comprar ahora" uses `onBuyNow` callback (stores in paymentStore) instead of adding to cart
4. **OverlayCheckoutQuantity** (`/_components/store/product/overlay/OverlayCheckoutQuantity.tsx`): Product quantity selection overlay
5. **OverlayDeleteConfirmation** (`/_components/store/product/overlay/OverlayDeleteConfirmation.tsx`): Delete confirmation overlay
6. **OverlayProductEdit** (`/_components/store/product/overlay/OverlayProductEdit.tsx`): Product editing overlay
7. **OverlayProductEditSize** (`/_components/store/product/overlay/OverlayProductEditSize.tsx`): Size selection overlay
8. **OverlayProductFilters** (`/_components/store/product/overlay/OverlayProductFilters.tsx`): Product filters overlay
9. **OverlayProductRemoving** (`/_components/store/product/overlay/OverlayProductRemoving.tsx`): Cart item removal with undo
10. **OverlayProductSearch** (`/_components/store/product/overlay/OverlayProductSearch.tsx`): Search overlay triggered from the header, using `useSearch` hook for client-side product searching
11. **OverlayShippingAddress** (`/_components/store/product/overlay/OverlayShippingAddress.tsx`): Shipping address overlay
12. **OverlayShippingSelection** (`/_components/store/product/overlay/OverlayShippingSelection.tsx`): Shipping method selection overlay
    - Props: `isVisible`, `onClose`, `onGoBack?`, `onSelectShipping`, `initialMethod?`
    - `onGoBack` (optional): Called when user presses X or backdrop to return to previous overlay. Falls back to `onClose` if not provided.
    - Used by `OverlayCheckoutShipping` and `OverlayProductAdding` for nested overlay navigation

#### Layout Components (`/_components/store/layout/`)

Store layout components define the overall structure of the store screens.

1. **Header (`/_components/store/layout/Header.tsx`):**
   - Provides the top navigation bar for different contexts (store, product details, catalog).
   - Displays the screen title or the Tiffosi logo.
   - Includes action icons relevant to the context:
     - **Store:** Search icon.
     - **Product Details:** Back button, Share icon (triggers native share sheet with product title and description), Favorite icon.
     - **Catalog:** Back button, Filter icon, Search icon.
   - Manages visibility of search and filter overlays.

2. **Footer (`/_components/store/layout/Footer.tsx`):**
   - Displays branding and copyright information.
   - (Add more details if implemented)

3. **Categories (`/_components/store/layout/Categories.tsx`):**
   - Horizontal scrolling list of product categories.
   - (Add more details if implemented)

4. **Locations (`/_components/store/layout/Locations.tsx`):**
   - Component for displaying store location information.
   - (Add more details if implemented)

5. **CategoryShowcase (`/_components/store/layout/CategoryShowcase.tsx`):**
   - Component for showcasing product categories.
   - Displays category information in a visually appealing format.

#### Orders Components (`/store/orders/`)

Components related to order management.

1. **EmptyOrders (`/orders/EmptyOrders.tsx`):** Placeholder shown when user has no orders. Displays a message and button to navigate to the store.

#### Review Components (`/store/review/`)

Components for displaying product reviews.

1. **ReviewCard (`/review/ReviewCard.tsx`):** Displays a single customer review.

### Common Components (`/app/components/common/`)

Utility components used throughout the application.

#### SubheaderClose (`/common/SubheaderClose.tsx`)

Reusable subheader with title and close button for modal-like screens (auth, checkout, legal, locations).

```tsx
import SubheaderClose from '../_components/common/SubheaderClose';

<SubheaderClose
  title="Direcciones de envío"
  onClose={() => router.navigate('/(tabs)')}
  closeTestID="address-close-button"
/>
```

Props:
- `title`: string - The header title text
- `onClose`: () => void - Close button handler
- `closeTestID`: string (optional) - Test ID for the close button

Used in: Auth screens, checkout screens, legal screens, locations, store detail views.

#### Empty State Component (`/common/EmptyState.tsx`)

Shared component for displaying empty state UI across screens (favorites, cart).

```tsx
import EmptyState from '../_components/common/EmptyState';

// Favorites screen - no favorites saved
<EmptyState variant="noFavorites" onPress={handleGoToStore} />

// Favorites screen - not logged in
<EmptyState variant="notLoggedIn" onPress={handleLogin} />

// Cart screen - empty cart
<EmptyState variant="emptyCart" onPress={handleGoToStore} />
```

Props:
- `variant`: 'noFavorites' | 'notLoggedIn' | 'emptyCart' - Determines content displayed
- `onPress`: () => void - Handler for the action button

#### Background Components

1. **VideoBackground** (`/common/VideoBackground.tsx`): Video background

   ```tsx
   import { VideoBackground } from '../components/common/VideoBackground';

   <VideoBackground source={videoSource}>
     <Content />
   </VideoBackground>;
   ```

2. **Custom Background Solutions**
   - For gradient backgrounds, use React Native's built-in components:

   ```tsx
   import { LinearGradient } from 'expo-linear-gradient';

   <LinearGradient colors={['#0C0C0C', '#3E3E3E']} style={styles.gradient}>
     <Content />
   </LinearGradient>;
   ```

   - For performance-critical components, use simpler alternatives:

   ```tsx
   <View style={[styles.background, { backgroundColor: 'rgba(12,12,12,0.98)' }]}>
     <Content />
   </View>
   ```

#### Error Handling

**ErrorBoundary** (`/common/ErrorBoundary.tsx`): Catches React component errors

```tsx
import { ErrorBoundary } from '../components/common/ErrorBoundary';

<ErrorBoundary fallback={<ErrorScreen />}>
  <ComponentThatMightError />
</ErrorBoundary>;
```

#### Animation Components (`/common/animation/`)

**AdvancedAnimation** (`/common/animation/AdvancedAnimation.tsx`): Configurable animations

```tsx
import { AdvancedAnimation } from '../components/common/animation/AdvancedAnimation';

<AdvancedAnimation type="fade" duration={300} delay={100}>
  <Content />
</AdvancedAnimation>;
```

### Navigation Components (`/app/components/navigation/`)

Components for app navigation.

#### TabBar (`/navigation/TabBar.tsx`)

Bottom tab navigation with customizable tabs.

```tsx
import { TabBar } from '../components/navigation/TabBar';

<TabBar tabs={navigationTabs} activeIndex={activeTabIndex} onChange={setActiveTabIndex} />;
```

#### CategoryNavigation (`/navigation/category/CategoryNavigation.tsx`)

Horizontal scrolling category navigation.

```tsx
import { CategoryNavigation } from '../components/navigation/category/CategoryNavigation';

<CategoryNavigation
  categories={categories}
  activeCategory={activeCategory}
  onSelectCategory={setActiveCategory}
/>;
```

### Skeleton Components (`/app/components/skeletons/`)

Loading state placeholders with progressive loading support.

#### HomeScreenSkeleton (`/skeletons/HomeScreenSkeleton.tsx`)

Advanced skeleton with progressive section loading:

```tsx
import { HomeScreenSkeleton } from '../components/skeletons/HomeScreenSkeleton';

// Simple usage - full skeleton
{
  isLoading ? <HomeScreenSkeleton /> : <HomeContent />;
}

// Progressive loading with section states
<HomeScreenSkeleton
  isLoading={false}
  sectionLoadingState={{
    highlighted: true, // Still loading
    featured: false, // Already loaded
    recommended: true, // Still loading
    trending: false, // Already loaded
  }}
/>;
```

Props:

- `isLoading`: boolean - When true, shows the entire skeleton
- `sectionLoadingState`: Partial<SectionLoadingState> - Per-section loading states
- `children`: ReactNode - Content to show when not loading

#### ProgressiveLoadingSection (`/skeletons/ProgressiveLoadingSection.tsx`)

Reusable component for section-specific progressive loading:

```tsx
import {
  ProgressiveLoadingSection,
  createSectionSkeleton,
} from '../components/skeletons/ProgressiveLoadingSection';

<ProgressiveLoadingSection
  isLoading={sectionLoadingState.featured}
  skeleton={createSectionSkeleton({
    title: true,
    height: 400,
    borderRadius: 8,
  })}
>
  <FeaturedContent />
</ProgressiveLoadingSection>;
```

Props:

- `isLoading`: boolean - When true, shows the skeleton
- `skeleton`: ReactNode - Skeleton placeholder to show while loading
- `children`: ReactNode - Actual content to show when loaded
- `style`: StyleProp<ViewStyle> - Optional container style

### Splash Screen Components (`/app/components/splash/`)

App initialization and global asset loading components.

#### SplashScreen (`/splash/SplashScreen.tsx`)

The app splash screen that handles initial loading of global UI assets:

```tsx
import { SplashScreen } from '../components/splash/SplashScreen';

<SplashScreen onComplete={handleSplashComplete} />;
```

Props:

- `onComplete`: () => void - Called when splash screen loading is complete
- `minDisplayTime`: number - Minimum time to display splash screen (default: 1500ms)

Implementation:

- Uses PreloadService to load only global UI assets (logos, essential UI elements)
- Does NOT load screen-specific content during splash screen
- Shows loading progress indicator
- Transitions to main app when essential loading is complete

## Component Design Principles

### Composition over Inheritance

Components are designed to be composed together rather than extended through inheritance:

```tsx
// Good example - Composition
<Card>
  <CardImage source={imageSource} />
  <CardContent>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardContent>
  <CardActions>
    <Button>View Details</Button>
  </CardActions>
</Card>

// Avoid - Multiple inheritance-like variants
<ProductCard variant="featured" size="large" />
<ProductCard variant="horizontal" size="small" />
```

### Consistent Props Patterns

Components follow consistent prop patterns:

1. **Required props first**: Important props listed first in interface
2. **Common optional props**: Consistent naming across components
3. **Style props last**: Style customization always at the end
4. **Event handlers**: Use `onEventName` convention

```tsx
interface ButtonProps {
  // Required props first
  onPress: () => void;

  // Optional functional props
  disabled?: boolean;
  loading?: boolean;

  // Content props
  children: React.ReactNode;
  icon?: React.ReactNode;

  // Variant props
  variant?: 'primary' | 'secondary' | 'text' | 'outlined';
  size?: 'small' | 'medium' | 'large';

  // Style props last
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}
```

### State Management

Components follow these state management principles:

1. **Controlled by default**: Prefer controlled components with value/onChange
2. **Minimal internal state**: Only use internal state for UI-specific behavior
3. **Clear callback pattern**: Consistent onChange handlers

```tsx
// Controlled component pattern
const [value, setValue] = useState('');

<Input value={value} onChangeText={setValue} label="Username" />;
```

### Style Type Safety

Components use TypeScript for style type safety:

```tsx
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Styles = {
  container: ViewStyle;
  title: TextStyle;
  description: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    color: colors.primary,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.secondary,
  },
});
```

## Component Implementation Status

| Category       | Component                   | Status | Notes                                                |
| -------------- | --------------------------- | ------ | ---------------------------------------------------- |
| **UI**         | Typography                  | ✅     | Fully implemented with all variants                  |
| **UI**         | Buttons                     | ✅     | All variants implemented                             |
| **UI**         | Grid                        | ✅     | Fully implemented                                    |
| **UI**         | Section                     | ✅     | Fully implemented                                    |
| **Form**       | Input                       | ✅     | Fully implemented with validation                    |
| **Form**       | Counter                     | ✅     | Fully implemented                                    |
| **Form**       | CountrySelect               | ✅     | Fully implemented                                    |
| **Form**       | SingleChoice                | ✅     | Fully implemented                                    |
| **Store**      | ProductDetails              | ✅     | Fully implemented                                    |
| **Store**      | ColorSlider                 | ✅     | Fully implemented                                    |
| **Store**      | Swipeable components        | ✅     | All variants implemented                             |
| **Store**      | Overlay checkout components | ✅     | Shipping, quantity selection, and search implemented |
| **Store**      | Categories                  | ✅     | Fully implemented                                    |
| **Store**      | Header                      | ✅     | Fully implemented with search integration            |
| **Store**      | Footer                      | ✅     | Fully implemented                                    |
| **Store**      | Locations                   | ✅     | Fully implemented                                    |
| **Common**     | Background Solutions        | ✅     | Optimized for performance                            |
| **Common**     | VideoBackground             | ✅     | Fully implemented                                    |
| **Common**     | ErrorBoundary               | ✅     | Fully implemented                                    |
| **Common**     | AdvancedAnimation           | ✅     | Implemented with useMemo optimization                |
| **Navigation** | TabBar                      | ✅     | Fully implemented                                    |
| **Navigation** | CategoryNavigation          | ✅     | Fully implemented                                    |
| **Skeletons**  | HomeScreenSkeleton          | ✅     | Fully implemented with progressive loading           |
| **Skeletons**  | ProgressiveLoadingSection   | ✅     | Fully implemented                                    |
| **Services**   | PreloadService              | ✅     | Full asset preloading system implemented             |
| **Services**   | Home Asset Loader           | ✅     | Home screen asset loading implemented                |

## Best Practices

### Component Development

1. **Mobile-First**: Design and implement for iOS first, then ensure Android compatibility
2. **Visual Verification**: Use reference screenshots to verify implementation
3. **Simplicity**: Prioritize simple implementations over complex ones
4. **Type Safety**: Use proper TypeScript typing for props and styles
5. **Accessibility**: Implement proper accessibility features
6. **Performance**: Optimize renders with useMemo, useCallback, and React.memo

### Component Usage

1. **Import from index**: Import components from feature directories when possible

   ```tsx
   // Good
   import { Button } from '../_components/ui';

   // Avoid direct imports unless necessary
   import { Button } from '../_components/ui/buttons/Button';
   ```

2. **Consistent styling**: Use style tokens from styles directory

   ```tsx
   // Good
   import { colors, spacing } from '../styles';

   const styles = StyleSheet.create({
     container: {
       padding: spacing.md,
       backgroundColor: colors.background.light,
     },
   });

   // Avoid hardcoded values
   const styles = StyleSheet.create({
     container: {
       padding: 12,
       backgroundColor: '#FFFFFF',
     },
   });
   ```

3. **Component composition**: Compose components for complex UIs

   ```tsx
   // Good
   <Section title="Featured Products">
     <Grid columns={2} spacing={spacing.md}>
       {products.map(product => (
         <ProductCard key={product.id} product={product} />
       ))}
     </Grid>
   </Section>

   // Avoid monolithic components
   <FeaturedProductsSection products={products} />
   ```

## Implementation Guidelines

### 1. Follow Design Specifications

Always implement components according to design specifications:

- Use exact colors from the color system
- Follow typography scale for text styles
- Use spacing tokens for margins and padding
- Implement proper animation timing

### 2. Maintain Type Safety

Ensure all components have proper TypeScript typing:

- Define prop interfaces with JSDoc comments
- Use proper style typing (ViewStyle, TextStyle, ImageStyle)
- Type event handlers appropriately
- Use type guards for runtime checks

### 3. Implement Accessibility

All components should be accessible:

- Proper touch target sizes (minimum 44x44)
- Appropriate accessibility labels
- Support for screen readers
- Proper keyboard navigation (web)

### 4. Performance Considerations

Optimize component performance:

- Memoize expensive calculations with useMemo
- Memoize callbacks with useCallback with proper dependencies
- Use React.memo for pure components
- Avoid unnecessary re-renders
- Implement efficient list rendering
