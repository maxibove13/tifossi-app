# Types

This directory contains all TypeScript type definitions used throughout the application.

## File Structure

- `index.ts`: Re-exports all types from a central location
- `product.ts`: Product data types and interfaces
- `product-card.ts`: Product card component types and size definitions
- `product-status.ts`: Product status and label enums and utilities
- `navigation.ts`: Navigation route and parameter types
- `ui.ts`: Base UI component prop types and interfaces
- `_utils/types/declarations/svg.d.ts`: TypeScript declaration for SVG imports (excluded from routing)

## Usage Guidelines

1. Import types from the central `index.ts` when possible:

   ```typescript
   import { Product, ProductCardProps, ButtonProps } from '../types';
   ```

2. Keep type definitions focused and organized by domain
3. Use consistent naming conventions for interfaces and types:
   - Interfaces: `PascalCase`
   - Type aliases: `PascalCase`
   - Enums: `PascalCase`
   - Union types: `PascalCase`

4. Prefer interfaces for object definitions that may be extended
5. Use type aliases for unions, intersections, and complex types
