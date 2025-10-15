# Style System and Type Safety Guide

## Styling Components

When styling components in this project, please follow these guidelines to ensure proper type safety:

### 1. Use Typed StyleSheet.create

Always use the typed version of `StyleSheet.create` to ensure proper type checking for your styles:

```typescript
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Define a type for your styles
type Styles = {
  container: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  // Add other style properties as needed
};

// Use the typed StyleSheet.create
const styles = StyleSheet.create<Styles>({
  container: {
    // ViewStyle properties
  },
  title: {
    // TextStyle properties
  },
  description: {
    // TextStyle properties
  },
});
```

### 2. fontWeight Handling

When using `fontWeight` property, use string literals rather than referencing typography values:

```typescript
// ✅ DO THIS - Use string literals for fontWeight
styles.title = {
  fontFamily: typography.heading.fontFamily,
  fontWeight: '500', // String literal
  fontSize: typography.heading.fontSize,
  color: colors.primary.text,
};

// ❌ AVOID THIS - Don't use as const assertions or direct references that might not match expected types
styles.title = {
  fontFamily: typography.heading.fontFamily,
  fontWeight: typography.heading.fontWeight as const, // This can cause type errors
  fontSize: typography.heading.fontSize,
  color: colors.primary.text,
};
```

### 3. Style Composition

When composing styles dynamically or conditionally, make sure to maintain proper type safety:

```typescript
// When combining styles, maintain type safety
<View style={[styles.container, props.style]} />
```

## Common Style Types

- `ViewStyle`: Used for styling View components (e.g., container, wrapper, etc.)
- `TextStyle`: Used for styling Text components
- `ImageStyle`: Used for styling Image components
- `StyleProp<ViewStyle>`: For props that accept ViewStyle (can be object, array, or undefined)
- `StyleProp<TextStyle>`: For props that accept TextStyle

## Best Practices

1. **Proper Typing**: Always define and use proper types for your styles
2. **Component Props**: Define component props that accept styles to use StyleProp
3. **Consistent Naming**: Use consistent naming for styles (container, wrapper, content, title, subtitle, etc.)
4. **Shadow Implementation**: Use the shadow utilities from styles/shadows.ts for cross-platform shadow effects
5. **Color Usage**: Import colors from styles/colors.ts and use semantic color names
6. **Spacing**: Use spacing values from styles/spacing.ts for consistent margins and padding
7. **Typography**: Use typography definitions from styles/typography.ts for consistent text styling

## TypeScript Config for Styles

The project uses TypeScript with strict type checking. If you encounter type errors in styles, use the appropriate type assertions or fix the type mismatch rather than using type-any (`any` type).

## Running Type Checks

To check for type errors in your code, run:

```bash
npx tsc --noEmit
```

Fix any errors before committing your code.
