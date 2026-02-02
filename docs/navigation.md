# Navigation System Documentation

## Overview

The Tifossi app uses Expo Router for navigation, providing a file-system based routing approach that creates a clear and maintainable navigation structure. This document explains the navigation architecture, routing patterns, and navigation components.

## Navigation Architecture

### File-System Based Routing

Expo Router uses the file system to define routes:

- Files in the `app/` directory automatically become routes
- Directories with a leading `(...)` become route groups (non-URL segments)
- Files named `_layout.tsx` define layout components for their directory
- File named `index.tsx` becomes the default route for a directory

### Main Navigation Structure

```
app/
├── (home)/                 # Home route group
│   └── index.tsx           # Home screen
├── (tabs)/                 # Tabs route group
│   ├── _layout.tsx         # Tab navigation layout
│   ├── index.tsx           # Store tab (default)
│   ├── cart.tsx            # Cart tab
│   ├── favorites.tsx       # Favorites tab
│   ├── profile.tsx         # Profile tab
│   └── tiffosiExplore.tsx  # Explore tab
├── cart/                   # Cart specific screens
│   └── deleted.tsx         # Cart item deleted confirmation
├── checkout/               # Checkout process screens
│   ├── _layout.tsx         # Checkout layout
│   ├── shipping-address.tsx # Shipping address form
│   ├── payment-selection.tsx # Payment method selection
│   └── new-address.tsx     # New address entry form
├── locations/              # Store location screens
│   └── [cityId]/           # Dynamic city routes
│       ├── index.tsx       # Store zone selection screen
│       └── [zoneId].tsx    # Store details screen
├── products/               # Product-related screens
│   ├── _layout.tsx         # Products layout
│   ├── product.tsx         # Product details screen
│   └── index.ts            # Product exports
├── profile/                # Profile-related screens
│   ├── _layout.tsx         # Profile screens layout
│   ├── change-password.tsx # Password change screen
│   └── orders/             # Order management screens
│       ├── index.tsx       # Orders list screen
│       └── [id].tsx        # Order detail screen
├── not-found.tsx           # 404 page
├── _layout.tsx             # Root layout (includes splash screen)
└── index.tsx               # Entry point (redirects to tabs)
```

## Navigation Flow

1. **App Initialization**:
   - `app/_layout.tsx` controls app initialization, splash screen, and font loading
   - After the splash screen, navigates to main tab navigation

2. **Tab Navigation**:
   - `app/(tabs)/_layout.tsx` defines the tab bar and tab screens
   - Custom `TabBar` component handles tab switching
   - Tab routes: Home (Inicio), Favorites, Explore, Cart, Profile

3. **Product Details**:
   - Accessed from product cards across the app
   - Implemented as a modal screen in the tab navigator
   - Receives product data via route parameters

4. **Error Handling**:
   - `app/+not-found.tsx` renders when a route isn't found

## Navigation Components

### Root Layout (`app/_layout.tsx`)

The root layout component handles:

- Font loading with `useFonts`
- Splash screen management
- GestureHandler setup for gestures throughout the app
- Root Stack navigator configuration

```tsx
export default function Layout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    Roboto: Roboto_500Medium,
    Inter: Inter_500Medium,
  });

  // Splash screen logic
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();

      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (showSplash) {
    return <SplashScreenComponent />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(home)/index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

### Tab Layout (`app/(tabs)/_layout.tsx`)

The tab layout component manages:

- Tab navigation with Expo Router's `Tabs` component
- Custom `TabBar` component for the UI
- Tab routing configuration
- Tab options and visibility

```tsx
export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={({ state, navigation }) => (
          <TabBar
            activeRoute={getActiveRoute(state.index)}
            onChangeRoute={(route) => {
              const routeMap: Record<TabRoute, string> = {
                store: 'index',
                favorites: 'favorites',
                tiffosi: 'tiffosiExplore',
                cart: 'cart',
                profile: 'profile',
              };
              navigation.navigate(routeMap[route]);
            }}
          />
        )}
      >
        {/* Tab screens */}
        <Tabs.Screen name="index" options={{ href: '/' }} />
        <Tabs.Screen name="favorites" options={{ href: '/favorites' }} />
        <Tabs.Screen name="tiffosiExplore" options={{ href: '/tiffosiExplore' }} />
        <Tabs.Screen name="cart" options={{ href: '/cart' }} />
        <Tabs.Screen name="profile" options={{ href: '/profile' }} />
        <Tabs.Screen
          name="product"
          options={{
            tabBarButton: () => null, // Hide from tab bar
          }}
        />
      </Tabs>
    </View>
  );
}
```

### Custom TabBar (`components/navigation/TabBar.tsx`)

The TabBar component provides:

- Custom bottom navigation UI
- Active state management
- Tab icons and labels
- Cart badge for item count
- Center logo tab

```tsx
export type TabRoute = 'store' | 'favorites' | 'tiffosi' | 'cart' | 'profile';

interface TabBarProps {
  activeRoute: TabRoute;
  onChangeRoute: (route: TabRoute) => void;
  cartItemCount?: number;
  isDark?: boolean;
}

const TabBar = ({ activeRoute, onChangeRoute, cartItemCount = 0, isDark = false }: TabBarProps) => {
  // Tab rendering implementation
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {renderTab('store')}
      {renderTab('favorites')}
      {renderTab('tiffosi')}
      {renderTab('cart')}
      {renderTab('profile')}
    </View>
  );
};
```

### Category Navigation (`components/navigation/category/CategoryNavigation.tsx`)

Horizontal scrolling category navigation:

- Scrollable categories
- Gradient button backgrounds
- Category name and item count
- Forward indicator

```tsx
interface CategoryNavigationProps {
  categories: {
    id: string;
    name: string;
    itemCount?: number;
  }[];
  onSelectCategory: (id: string) => void;
}

export const CategoryNavigation = ({ categories, onSelectCategory }: CategoryNavigationProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onSelectCategory(category.id)}
          style={styles.categoryButton}
        >
          <LinearGradient
            colors={['#0C0C0C', '#3E3E3E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.itemCount !== undefined && (
                <Text style={styles.itemCount}>{category.itemCount} items</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
```

## Route Types and Type Safety

Navigation route parameters are typed in `app/types/navigation.ts`:

```typescript
export type RootTabParamList = {
  home: undefined;
  product: { product: Product };
  favorites: undefined;
  cart: undefined;
  profile: undefined;
  tiffosiExplore: undefined;
};

export type RootStackParamList = {
  '(tabs)': undefined;
  '(home)': undefined;
  cart: undefined;
  product: { product: Product };
  'not-found': undefined;
};
```

## Navigation Patterns

### Basic Navigation

Navigate between screens:

```tsx
// Import the router
import { router } from 'expo-router';

// Navigate to a route
router.navigate('/cart');
```

### Navigating with Parameters

Pass parameters to screens:

```tsx
// Navigate to the product screen with product data
router.navigate({
  pathname: '/product',
  params: { product: productData },
});
```

### Accessing Route Parameters

Access parameters in the target screen:

```tsx
import { useLocalSearchParams } from 'expo-router';

export default function ProductScreen() {
  const { product } = useLocalSearchParams();
  // Use the product data
  return <ProductDetails product={product} />;
}
```

### Deep Linking

The app supports deep linking to specific screens:

- Product details: `app://products/product?id=123`
- Cart: `app://cart`
- Favorites: `app://favorites`
- Location stores: `app://locations/{cityId}`
- Location store details: `app://locations/{cityId}/{zoneId}`
- Orders list: `app://profile/orders`
- Order detail: `app://profile/orders/{orderId}`

## Navigation Best Practices

1. **Type Safety**: Always use typed navigation parameters

   ```tsx
   // Define route params in types/navigation.ts
   const goToProduct = (product: Product) => {
     router.navigate({
       pathname: '/product',
       params: { product },
     });
   };
   ```

2. **Tab Navigation**: Use the TabBar component for consistent UI

   ```tsx
   <TabBar
     activeRoute={activeRoute}
     onChangeRoute={handleRouteChange}
     cartItemCount={cartItems.length}
   />
   ```

3. **Navigation Logic**: Keep navigation logic in hooks or utilities

   ```tsx
   // Create a navigation hook
   export function useAppNavigation() {
     const navigateToProduct = (product: Product) => {
       router.navigate({
         pathname: '/product',
         params: { product },
       });
     };

     return {
       navigateToProduct,
     };
   }
   ```

4. **Screen Organization**: Use route groups (`(group)`) to organize related screens

   ```
   app/
   ├── (auth)/              # Authentication screens group
   │   ├── login.tsx        # Login screen
   │   └── register.tsx     # Registration screen
   ├── (tabs)/              # Main tab screens
   ```

5. **Navigation Guards**: Check conditions before navigation
   ```tsx
   const goToCheckout = () => {
     if (!user.isAuthenticated) {
       // Redirect to login first
       router.navigate('/login');
       return;
     }
     router.navigate('/checkout');
   };
   ```

## Accessibility Considerations

1. **Screen Reader Support**: Ensure tab bar items have proper accessibility labels

   ```tsx
   <TouchableOpacity
     accessibilityLabel={`${label} Tab`}
     accessibilityRole="tab"
     accessibilityState={{ selected: isActive }}
   >
   ```

2. **Focus Management**: Properly manage focus when navigating
   ```tsx
   useEffect(() => {
     // Focus an element when screen mounts
     if (headerRef.current) {
       headerRef.current.focus();
     }
   }, []);
   ```

## Performance Optimization

1. **Lazy Loading**: Use dynamic imports for heavy screens

   ```tsx
   // In _layout.tsx
   <Stack.Screen name="heavy-screen" lazy />
   ```

2. **State Persistence**: Preserve state during navigation

   ```tsx
   <Tabs screenOptions={{ unmountOnBlur: false }} />
   ```

3. **Navigation Caching**: Cache screens to prevent unnecessary re-renders

   ```tsx
   <Tabs screenOptions={{ lazy: true }} />
   ```

4. **Optimized Bottom Sheet Transitions**: For performance-critical components like SwipeableEdge

   ```tsx
   // Use device-based dimension caching
   const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(
     headerHeightCache[deviceWidth] || null
   );

   // Cache measurements after first render
   useEffect(() => {
     if (measuredHeaderHeight !== null) {
       headerHeightCache[deviceWidth] = measuredHeaderHeight;
     }
   }, [measuredHeaderHeight, deviceWidth]);
   ```

5. **Simplified Visual Components**: Replace expensive components in transitions
   ```tsx
   // Instead of LinearGradient for background in animations
   <View style={[styles.background, { backgroundColor: 'rgba(12,12,12,0.98)' }]} />
   ```
