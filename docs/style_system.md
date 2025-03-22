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
  border: '#DCDCDC',
  error: '#AD3026',
  success: '#367C39',
  background: {
    light: '#FFFFFF',
    dark: '#0C0C0C',
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
};

export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 20,
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
};
```

Use these spacing tokens for margin, padding, and positioning:

```typescript
import { spacing, radius, layout } from '../../styles/spacing';

const styles = StyleSheet.create({
  container: {
    padding: layout.screenPadding,
    marginBottom: spacing.md,
    borderRadius: radius.md,
  },
  button: {
    paddingVertical: layout.buttonPadding.vertical,
    paddingHorizontal: layout.buttonPadding.horizontal,
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

## Style Evolution

The style system should evolve with the application:

1. Add new color tokens as needed, following the established naming pattern
2. Refactor repeated styles into reusable components
3. Document any style system changes
4. Maintain backward compatibility where possible