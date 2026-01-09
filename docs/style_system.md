# Style System Documentation

## Overview

The Tifossi Expo app implements a comprehensive style system using React Native's StyleSheet API combined with TypeScript for type safety. This document explains the style system organization, design tokens, and best practices for styling components.

## Style Organization

The style system is organized in the `app/styles` directory:

- `colors.ts`: Color palette definitions
- `spacing.ts`: Spacing, radius, and layout measurements
- `typography.ts`: Font families, sizes, weights, and line heights
- `shadows.ts`: Cross-platform shadow definitions
- `tokens/`: Additional design tokens organized by feature

## Design Tokens

### Colors

Colors are defined in `colors.ts` and provide a consistent color palette:

```typescript
export const colors = {
  primary: '#0C0C0C',
  secondary: '#707070',
  tertiary: '#5C5C5C',          // Tertiary brand color
  gray800: '#575757',           // GRAY/800 - address text, subtitles
  border: '#DCDCDC',
  divider: '#CAC4D0',           // Divider lines
  error: '#AD3026',
  errorBackground: '#FFEBEE',   // For error banner backgrounds
  errorBorder: '#FFCDD2',       // For error banner borders
  success: '#367C39',
  text: {
    tertiary: '#5C5C5C',        // Tertiary text color
    lightGray: '#E1E1E1',       // Light gray text (on dark backgrounds)
  },
  background: {
    light: '#FFFFFF',
    dark: '#0C0C0C',
    medium: '#F5F5F5',
    offWhite: '#FBFBFB',
    offWhite25: 'rgba(251, 251, 251, 0.25)',
    antiflash: '#FAFAFA',       // Auth screens background
  },
};
```

Use these color tokens in your styles instead of hardcoding color values:

```typescript
import { colors } from '../../styles/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.light,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.error,
  },
  // For error banners/alerts
  errorBanner: {
    backgroundColor: colors.errorBackground,
    borderColor: colors.errorBorder,
    borderWidth: 1,
  },
});
```

### Spacing

Spacing tokens provide consistent spacing throughout the application:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
  xxxxl: 96,   // Extra large spacing for headers
};

export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 20,
  button: 22,
  buttonLarge: 28,
  xxl: 24,
  circle: 100,
};

export const layout = {
  screenPadding: spacing.lg,
  headerTopPadding: spacing.xxxl,
  sectionPadding: spacing.lg,
  gridGap: spacing.lg,
  buttonPadding: {
    vertical: spacing.md,
    horizontal: spacing.xl,
  },
  safeAreaBottom: 34,  // iOS safe area bottom margin
};

// Component-specific tokens for consistent sizing
export const components = {
  button: {
    height: 48,
    heightLarge: 56,
  },
  selectionRow: {
    height: 56,
  },
  closeButton: {
    width: 40,
    height: 24,
  },
  dropdown: {
    height: 40,
    maxHeight: 220,
  },
  flagImage: {
    width: 24,
    height: 16,
  },
  input: {
    numberWidth: 80,
  },
};
```

Use these spacing tokens for margin, padding, and positioning:

```typescript
import { spacing, radius, layout, components } from '../../styles/spacing';

const styles = StyleSheet.create({
  container: {
    padding: layout.screenPadding,
    marginBottom: spacing.md,
    borderRadius: radius.md,
  },
  button: {
    height: components.button.height,
    paddingVertical: layout.buttonPadding.vertical,
    paddingHorizontal: layout.buttonPadding.horizontal,
  },
  closeButton: {
    width: components.closeButton.width,
    height: components.closeButton.height,
  },
  actionButtons: {
    marginBottom: layout.safeAreaBottom,
  },
});
```

### Component Tokens

Component-specific tokens provide standardized dimensions for UI components. Use these to ensure consistency:

```typescript
import { components } from '../../styles/spacing';

const styles = StyleSheet.create({
  // Buttons
  primaryButton: {
    height: components.button.height,
  },
  // Close buttons (header)
  closeButton: {
    width: components.closeButton.width,
    height: components.closeButton.height,
  },
  // Dropdowns
  dropdown: {
    height: components.dropdown.height,
    maxHeight: components.dropdown.maxHeight,
  },
  // Number inputs
  numberInput: {
    width: components.input.numberWidth,
  },
});
```

### Typography

Typography tokens define font styles:

```typescript
export const fonts = {
  primary: 'Roboto',
  secondary: 'Inter',
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const lineHeights = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  xxxl: 44,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
```

Use these tokens for text styling:

```typescript
import { fonts, fontSizes, lineHeights, fontWeights } from '../../styles/typography';

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: '600', // Using string literal for fontWeight
  },
  body: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: '400', // Using string literal for fontWeight
  },
});
```

### Shadows

Cross-platform shadow definitions:

```typescript
export const shadows = {
  button: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  small: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  medium: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  large: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
  },
};
```

Apply shadows to your components:

```typescript
import { shadows } from '../../styles/shadows';

const styles = StyleSheet.create({
  card: {
    ...shadows.button,
    backgroundColor: '#fff',
  },
});
```

## Type-Safe Styling

### StyleSheet with TypeScript

Use StyleSheet.create with TypeScript generics for type safety:

```typescript
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  image: ImageStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '500',
    color: colors.primary,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
});
```

### Style Props in Component Interfaces

Use the appropriate style prop types in your component interfaces:

```typescript
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}
```

### fontWeight Type Safety

When working with fontWeight, use string literals instead of references to avoid type issues:

```typescript
// ✅ DO THIS - Use string literals for fontWeight
const styles = StyleSheet.create<Styles>({
  title: {
    fontWeight: '500', // String literal
  },
  subtitle: {
    fontWeight: '400', // String literal
  },
});

// ❌ AVOID THIS - Using references can cause type issues
const styles = StyleSheet.create<Styles>({
  title: {
    fontWeight: fontWeights.medium as const, // TypeScript may complain
  },
});
```

## Component Styling Patterns

### Composable Styles

Create styles that can be easily composed:

```typescript
const Button = ({ style, textStyle, ...props }) => (
  <TouchableOpacity style={[styles.button, style]} {...props}>
    <Text style={[styles.buttonText, textStyle]}>{props.title}</Text>
  </TouchableOpacity>
);
```

### Responsive Styles

Use dimensions to create responsive styles:

```typescript
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create<Styles>({
  container: {
    width: width > 768 ? '80%' : '100%',
  },
});
```

### Conditional Styling

Apply styles conditionally:

```typescript
<View style={[
  styles.container,
  isDark && styles.darkContainer,
  isActive && styles.activeContainer,
]} />
```

## Style Best Practices

1. **Design Tokens**: Always use design tokens from the style system rather than hardcoded values

2. **Type Safety**: Use StyleSheet.create<Styles>({...}) for type-safe styles

3. **Consistent Naming**: Use consistent naming for style properties:
   - container: For the outermost container
   - content: For content containers
   - header, footer: For section containers
   - title, subtitle, label, text: For text elements
   - image, icon: For image elements

4. **Inline Styles**: Avoid inline styles; use StyleSheet.create for better performance

5. **Platform-Specific Styles**: Use Platform.select for platform-specific styling

6. **Style Commenting**: Add comments for complex style properties

7. **Reuse Common Styles**: Extract common styles into reusable objects

8. **Keep Styles Colocated**: Keep styles close to their components

9. **Test in Both Themes**: Test components in both light and dark themes

10. **Performance Optimization**:
    - Use simpler components (View instead of LinearGradient) for performance-critical areas
    - Cache dimensions using device width/height-based keys to avoid repeated measurements
    - Remove all console.log statements in production, especially in animation components
    - Implement device-based caching for layout measurements to avoid jank on first render

## Debugging Styles

To debug style issues:

1. Use the React Native Debugger to inspect component styles
2. Add temporary borders to identify layout issues:
   ```typescript
   {
     borderWidth: 1,
     borderColor: 'red',
   }
   ```
3. Use the `onLayout` event to log component dimensions
4. Test on multiple device sizes to ensure responsive behavior

## Animation and Performance

Optimizing animations is crucial for a smooth user experience, particularly in critical UI elements like the SwipeableEdge component:

### Animation Performance Best Practices

1. **Use Simple Components**:
   - Replace `LinearGradient` with simple `View` components for backgrounds in animated elements
   - When visual fidelity can be maintained, choose the simpler implementation

2. **Measurement Caching**:
   - Cache layout measurements based on device dimensions
   - Avoid measuring components on each render
   - Use `useRef` and `useState` to store measurements

   ```typescript
   // Example from SwipeableEdge.tsx
   const headerHeightCache: Record<number, number> = {};

   // Helper function to get cached height or null
   const getHeaderHeight = (deviceWidth: number): number | null => {
     return headerHeightCache[deviceWidth] || null;
   };

   // Helper function to save height calculation
   const saveHeaderHeight = (deviceWidth: number, height: number): void => {
     if (!headerHeightCache[deviceWidth] && height > 0) {
       headerHeightCache[deviceWidth] = height;
     }
   };
   ```

3. **Avoid Console Logging**:
   - Remove all `console.log` statements in production
   - Especially avoid logging in render or animation methods

4. **Two-Phase Rendering**:
   - Use a two-phase approach for complex components that need measurement
   - First render: measure in a hidden view
   - Second render: use the measurements to render the actual component
   - Cache measurements to avoid this on subsequent renders

5. **Memoize Components**:
   - Use `React.memo` for pure components
   - Properly memoize expensive calculations
   - Use `useCallback` for event handlers
6. **Proper Animation Techniques**:
   - Use `react-native-reanimated` for complex animations
   - Run animations on the UI thread with worklets when possible
   - Use proper interpolation and timing functions

### Example: Performance-Optimized SwipeableEdge

The SwipeableEdge component demonstrates these practices by:

- Replacing LinearGradient with a simple View component
- Implementing device-width based caching for header heights
- Removing console logs to reduce overhead
- Using helper functions to manage the measurement cache
- Implementing efficient initial rendering strategies

## Style Evolution

The style system should evolve with the application:

1. Add new color tokens as needed, following the established naming pattern
2. Refactor repeated styles into reusable components
3. Document any style system changes
4. Maintain backward compatibility where possible
5. Make performance-focused optimizations for animation-heavy components
6. Document performance considerations in component comments
