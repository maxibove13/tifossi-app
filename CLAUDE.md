# Tifossi Expo Project Guidelines

## Project Documentation

**IMPORTANT: When in doubt about implementation details, ALWAYS consult the relevant documentation file listed below rather than guessing or making assumptions.**

- **README.md**: Project overview, setup instructions, and high-level information
- **docs/app_structure.md**: Comprehensive guide to the codebase organization and architecture
- **docs/type_system.md**: Documentation on the type system organization and best practices
- **docs/style_system.md**: Design tokens, style patterns, and type-safe styling
- **docs/components.md**: Component library organization and usage guidelines with examples
- **docs/navigation.md**: Navigation architecture and routing patterns
- **docs/product_card.md**: Detailed specifications for product card components
- **app/types/STYLE_GUIDE.md**: Style system and type safety guidelines for UI components

### Documentation Reference Guide

- For **codebase structure questions**: Refer to `app_structure.md`
- For **type-related questions**: Refer to `type_system.md`
- For **styling questions**: Refer to `style_system.md`
- For **component implementation**: Refer to `components.md`
- For **navigation implementation**: Refer to `navigation.md`
- For **product card implementation**: Refer to `product_card.md`
- For **style type safety**: Refer to `app/types/STYLE_GUIDE.md`

## Build Commands
- `npm install` - Install dependencies
- `npx expo start` - Start development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checker
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npm run reset-project` - Reset project state

## Quality Assurance
- After making significant changes, always run both the linter and type checker:
  ```bash
  npm run lint && npm run typecheck
  ```
- Check for style-related type issues when working on UI components (especially fontWeight issues)
- Use type-safe styling with StyleSheet.create<Styles>({...}) pattern
- Follow the Style Guide in app/types/STYLE_GUIDE.md for proper type-safe styling guidelines
- Use string literals for fontWeight values ('400', '500', etc.) rather than references

## Type System
- Import types from central location: `import { Product, ButtonProps } from '../types'`
- Use proper typing for component props with interfaces
- Follow type patterns in docs/type_system.md
- Use type guards like isProduct(), isValidStatus() for runtime validation
- Use generics for flexible type definitions when appropriate
- Properly type style objects and component style props

## Code Style
- **TypeScript**: Use strict mode with proper type annotations
- **Components**: Functional components with hooks
- **File Structure**: Group related components in directories (/ui, /store, /common)
- **Imports**: Group imports - React/RN, third-party, local components, types, styles
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Products**: Use typed interfaces (see product.ts, product-card.ts, product-status.ts)
- **Styling**: Use StyleSheet.create and design tokens from styles/ directory
- **Colors**: Use color palette from styles/colors.ts
- **Typography**: Follow type scale in styles/typography.ts (font family, size, weight)
- **Spacing**: Use spacing tokens from styles/spacing.ts
- **Error Handling**: Use ErrorBoundary for critical sections
- **Card Components**: Follow dimensions and styling in product_card.md

## Implementation Principles
- **Mobile First**: Always design and implement with iOS as the primary platform
- **Design Fidelity**: Follow Figma designs closely (check raw-components for reference)
- **Visual Verification**: Use screenshots as visual confirmation when implementing components
- **Simplicity**: Prioritize simplicity over complexity
- **Component Alignment**: Ensure components align with both reference screenshots and JSX
- **Documentation First**: Always consult documentation before implementing or modifying code
- **Debugging**: Always read app_structure.md before searching the codebase

## Documentation-Driven Development
- Before implementing any component, read the corresponding documentation
- Before working with the type system, consult type_system.md
- When styling components, follow style_system.md guidelines
- For navigation changes, refer to navigation.md
- Use components.md as a reference for component implementations
- When in doubt, documentation takes precedence over existing code
- If documentation conflicts with requirements, update the documentation first

## Component Development
- Use function components with proper TypeScript typing
- Make components reusable with clear prop interfaces
- Implement error boundaries for critical UI sections
- Follow consistent patterns for animation and interaction
- Organize component files by domain and function
- Use consistent style patterns with type-safe StyleSheet.create
- Implement accessibility features where appropriate
- Test components with different theme configurations (light/dark mode)

## Development Workflow
- Always begin by reviewing relevant documentation in the docs directory
- Check for inconsistencies or potential issues in each module
- Propose improvements based on software engineering best practices
- Consider how components are being used in the broader context
- For visual guidance, refer to JSX and reference screenshots from Figma designs
- Use raw-components folder to understand design intent and implementation details
- Follow patterns and conventions documented in type_system.md and components.md
- Run linter (`npm run lint`) and type checker (`npm run typecheck`) after each significant change or refactor
- Ensure code passes all checks before finalizing any implementation
- If you discover undocumented patterns or missing information, update documentation

## Asking Questions
When you have questions about implementation:
1. First check the relevant documentation file (see Documentation Reference Guide above)
2. Look for examples in the codebase that follow the documented patterns
3. If documentation is unclear or missing details, suggest documentation improvements
4. For conflicting or outdated documentation, update it to match current best practices