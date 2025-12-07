# Code Conventions

## TypeScript
- Use strict mode with proper type annotations
- See `type_system.md` for detailed type patterns

## Components
- Functional components with hooks
- PascalCase for components, camelCase for variables/functions
- Group in directories: `/ui`, `/store`, `/common`

## Imports
Order: React/RN, third-party, local components, types, styles

## Products
- Use typed interfaces from `product.ts`, `product-card.ts`, `product-status.ts`
- Use `shortDescription` (line1/line2) and `longDescription` - `description` is deprecated

## Styling
- Use `StyleSheet.create` with design tokens from `styles/`
- Colors: `styles/colors.ts`
- Typography: `styles/typography.ts`
- Spacing: `styles/spacing.ts`
- Card dimensions: see `product_card.md`

## Error Handling
- Use `ErrorBoundary` for critical sections
