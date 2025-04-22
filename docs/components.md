# Tifossi Component System Documentation

## Overview

The Tifossi component system follows a modular, domain-driven organization with a strong focus on type safety and consistent design. This document serves as the comprehensive specification and implementation reference for all components in the Tifossi e-commerce app.

## Component Organization

### Directory Structure

```
app/components/
├── common/           # Shared utility components
│   ├── animation/    # Animation utilities
│   ├── ErrorBoundary.tsx
│   ├── GradientBackground.tsx
│   ├── Subheader.tsx
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
    │   └── ProfileCard.tsx
    ├── form/         # Form controls
    │   ├── Counter.tsx
    │   ├── CountrySelect.tsx
    │   ├── Input.tsx
    │   ├── SelectionControl.tsx
    │   └── SingleChoice.tsx
    ├── layout/       # Layout primitives
    │   ├── Grid.tsx
    │   └── Section.tsx
    ├── toggle/       # Toggle components
    │   └── ToggleSport.tsx
    └── typography/   # Text components
        └── Text.tsx
```

## Component Categories

### Core UI Components (`/app/components/ui/`)

These are the fundamental building blocks that form the foundation of the UI system.

#### Typography (`/typography/Text.tsx`)

The Text component provides consistent typography across the app with support for various styles.

```tsx
import { Text } from '../components/ui/typography/Text';

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

#### Buttons (`/buttons/Button.tsx`)

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

#### Layout Components (`/layout/`)

Layout components provide consistent structure for content:

1. **Grid** (`/layout/Grid.tsx`): Flexible grid layout for items
   ```tsx
   import { Grid } from '../components/ui/layout/Grid';
   
   <Grid columns={2} spacing={spacing.md}>
     {products.map(product => (
       <ProductCard key={product.id} product={product} />
     ))}
   </Grid>
   ```

2. **Section** (`/layout/Section.tsx`): Consistent section with optional header
   ```tsx
   import { Section } from '../components/ui/layout/Section';
   
   <Section 
     title="Featured Products" 
     action={{ label: "See All", onPress: handleSeeAll }}
   >
     <FeaturedProducts />
   </Section>
   ```

### Form Components (`/app/components/ui/form/`)

Form components handle user input with consistent styling and behavior.

#### Input (`/form/Input.tsx`)

Text input with label and error handling.

```tsx
import { Input } from '../components/ui/form/Input';

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="your@email.com"
  error={emailError}
  required
/>
```

#### Counter (`/form/Counter.tsx`)

Quantity selector with increment/decrement.

```tsx
import { Counter } from '../components/ui/form/Counter';

<Counter 
  value={quantity} 
  onChange={setQuantity} 
  min={1} 
  max={10} 
/>
```

#### CountrySelect (`/form/CountrySelect.tsx`)

Country selection with flag display.

```tsx
import { CountrySelect } from '../components/ui/form/CountrySelect';

<CountrySelect
  value={country}
  onChange={setCountry}
  countries={availableCountries}
/>
```

#### SingleChoice (`/form/SingleChoice.tsx`)

Single selection from multiple options.

```tsx
import { SingleChoice } from '../components/ui/form/SingleChoice';

<SingleChoice
  options={sizes}
  value={selectedSize}
  onChange={setSelectedSize}
  label="Size"
/>
```

### Store Components (`/app/components/store/`)

Components specific to the e-commerce store functionality.

#### Product Components (`/store/product/`)

1. **ProductDetails** (`/product/ProductDetails.tsx`): Comprehensive product display
   ```tsx
   import { ProductDetails } from '../components/store/product/ProductDetails';
   
   <ProductDetails product={product} />
   ```

2. **ColorSlider** (`/product/ColorSlider.tsx`): Color selection for products
   ```tsx
   import { ColorSlider } from '../components/store/product/ColorSlider';
   
   <ColorSlider 
     colors={product.colors} 
     selectedColor={selectedColor}
     onSelect={setSelectedColor} 
   />
   ```

#### Swipeable Components (`/store/product/swipeable/`)

Components that support swipe gestures for interactive product displays.

1. **ProductDetails** (`/product/swipeable/ProductDetails.tsx`): Swipeable product view
2. **ProductInfoHeader** (`/product/swipeable/ProductInfoHeader.tsx`): Product header
3. **SectionHeader** (`/product/swipeable/SectionHeader.tsx`): Section header
4. **SupportOption** (`/product/swipeable/SupportOption.tsx`): Support options
5. **SwipeableEdge** (`/product/swipeable/SwipeableEdge.tsx`): Main swipeable panel component for product details
   - Performance-optimized with device-width based height caching
   - Uses lightweight View component for background instead of LinearGradient
   - Implements efficient memory usage techniques for smooth animations

#### Overlay Components (`/store/product/overlay/`)

Modal overlay components for the checkout process.

1. **OverlayCheckoutShipping** (`/product/overlay/OverlayCheckoutShipping.tsx`): Shipping information overlay
2. **OverlayCheckoutQuantity** (`/product/overlay/OverlayCheckoutQuantity.tsx`): Product quantity selection overlay
3. **OverlayShippingSelection** (`/product/overlay/OverlayShippingSelection.tsx`): Shipping method selection overlay
4. **OverlayProductSearch** (`/product/overlay/OverlayProductSearch.tsx`): Search overlay triggered from the header, using `useSearch` hook for client-side product searching.

#### Layout Components (`/store/layout/`)

Components for store layout structure.

1. **Categories** (`/layout/Categories.tsx`): Category navigation
   ```tsx
   import { Categories } from '../components/store/layout/Categories';
   
   <Categories categories={categories} onSelect={handleCategorySelect} />
   ```

2. **Header** (`/layout/Header.tsx`): Store header with search and actions
   ```tsx
   import { Header } from '../components/store/layout/Header';
   
   <Header title="Products" onSearch={handleSearch} />
   ```

3. **Footer** (`/layout/Footer.tsx`): Store footer with branding
   ```tsx
   import { Footer } from '../components/store/layout/Footer';
   
   <Footer />
   ```

4. **Locations** (`/layout/Locations.tsx`): Store locations display
   ```tsx
   import { Locations } from '../components/store/layout/Locations';
   
   <Locations locations={storeLocations} />
   ```

### Common Components (`/app/components/common/`)

Utility components used throughout the application.

#### Background Components

1. **VideoBackground** (`/common/VideoBackground.tsx`): Video background
   ```tsx
   import { VideoBackground } from '../components/common/VideoBackground';
   
   <VideoBackground source={videoSource}>
     <Content />
   </VideoBackground>
   ```

2. **Custom Background Solutions**
   - For gradient backgrounds, use React Native's built-in components:
   ```tsx
   import { LinearGradient } from 'expo-linear-gradient';
   
   <LinearGradient 
     colors={['#0C0C0C', '#3E3E3E']} 
     style={styles.gradient}
   >
     <Content />
   </LinearGradient>
   ```
   - For performance-critical components, use simpler alternatives:
   ```tsx
   <View style={[
     styles.background, 
     { backgroundColor: 'rgba(12,12,12,0.98)' }
   ]}>
     <Content />
   </View>
   ```

#### Error Handling

**ErrorBoundary** (`/common/ErrorBoundary.tsx`): Catches React component errors
```tsx
import { ErrorBoundary } from '../components/common/ErrorBoundary';

<ErrorBoundary fallback={<ErrorScreen />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

#### Animation Components (`/common/animation/`)

**AdvancedAnimation** (`/common/animation/AdvancedAnimation.tsx`): Configurable animations
```tsx
import { AdvancedAnimation } from '../components/common/animation/AdvancedAnimation';

<AdvancedAnimation 
  type="fade" 
  duration={300} 
  delay={100}
>
  <Content />
</AdvancedAnimation>
```

### Navigation Components (`/app/components/navigation/`)

Components for app navigation.

#### TabBar (`/navigation/TabBar.tsx`)

Bottom tab navigation with customizable tabs.

```tsx
import { TabBar } from '../components/navigation/TabBar';

<TabBar 
  tabs={navigationTabs}
  activeIndex={activeTabIndex}
  onChange={setActiveTabIndex}
/>
```

#### CategoryNavigation (`/navigation/category/CategoryNavigation.tsx`)

Horizontal scrolling category navigation.

```tsx
import { CategoryNavigation } from '../components/navigation/category/CategoryNavigation';

<CategoryNavigation 
  categories={categories}
  activeCategory={activeCategory}
  onSelectCategory={setActiveCategory}
/>
```

### Skeleton Components (`/app/components/skeletons/`)

Loading state placeholders with progressive loading support.

#### HomeScreenSkeleton (`/skeletons/HomeScreenSkeleton.tsx`)

Advanced skeleton with progressive section loading:

```tsx
import { HomeScreenSkeleton } from '../components/skeletons/HomeScreenSkeleton';

// Simple usage - full skeleton
{isLoading ? <HomeScreenSkeleton /> : <HomeContent />}

// Progressive loading with section states
<HomeScreenSkeleton
  isLoading={false}
  sectionLoadingState={{
    highlighted: true,    // Still loading
    featured: false,      // Already loaded
    recommended: true,    // Still loading
    trending: false,      // Already loaded
  }}
/>
```

Props:
- `isLoading`: boolean - When true, shows the entire skeleton
- `sectionLoadingState`: Partial<SectionLoadingState> - Per-section loading states
- `children`: ReactNode - Content to show when not loading

#### ProgressiveLoadingSection (`/skeletons/ProgressiveLoadingSection.tsx`)

Reusable component for section-specific progressive loading:

```tsx
import { ProgressiveLoadingSection, createSectionSkeleton } from '../components/skeletons/ProgressiveLoadingSection';

<ProgressiveLoadingSection
  isLoading={sectionLoadingState.featured}
  skeleton={createSectionSkeleton({
    title: true,
    height: 400,
    borderRadius: 8
  })}
>
  <FeaturedContent />
</ProgressiveLoadingSection>
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

<SplashScreen onComplete={handleSplashComplete} />
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

<Input
  value={value}
  onChangeText={setValue}
  label="Username"
/>
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

| Category | Component | Status | Notes |
|----------|-----------|--------|-------|
| **UI** | Typography | ✅ | Fully implemented with all variants |
| **UI** | Buttons | ✅ | All variants implemented |
| **UI** | Grid | ✅ | Fully implemented |
| **UI** | Section | ✅ | Fully implemented |
| **Form** | Input | ✅ | Fully implemented with validation |
| **Form** | Counter | ✅ | Fully implemented |
| **Form** | CountrySelect | ✅ | Fully implemented |
| **Form** | SingleChoice | ✅ | Fully implemented |
| **Store** | ProductDetails | ✅ | Fully implemented |
| **Store** | ColorSlider | ✅ | Fully implemented |
| **Store** | Swipeable components | ✅ | All variants implemented |
| **Store** | Overlay checkout components | ✅ | Shipping, quantity selection, and search implemented |
| **Store** | Categories | ✅ | Fully implemented |
| **Store** | Header | ✅ | Fully implemented with search integration |
| **Store** | Footer | ✅ | Fully implemented |
| **Store** | Locations | ✅ | Fully implemented |
| **Common** | Background Solutions | ✅ | Optimized for performance |
| **Common** | VideoBackground | ✅ | Fully implemented |
| **Common** | ErrorBoundary | ✅ | Fully implemented |
| **Common** | AdvancedAnimation | ✅ | Implemented with useMemo optimization |
| **Navigation** | TabBar | ✅ | Fully implemented |
| **Navigation** | CategoryNavigation | ✅ | Fully implemented |
| **Skeletons** | HomeScreenSkeleton | ✅ | Fully implemented with progressive loading |
| **Skeletons** | ProgressiveLoadingSection | ✅ | Fully implemented |
| **Services** | PreloadService | ✅ | Full asset preloading system implemented |
| **Services** | Home Asset Loader | ✅ | Home screen asset loading implemented |

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
   import { Button } from '../components/ui';
   
   // Avoid direct imports unless necessary
   import { Button } from '../components/ui/buttons/Button';
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