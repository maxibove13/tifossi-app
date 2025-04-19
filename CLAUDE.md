# Tifossi Expo Project Guidelines

## IMPORTANT GUIDELINES
- NEVER commit changes to git without being expressly asked to do so
- Always run linters and type checkers before submitting changes
- NEVER test the application by running it directly; only make code changes
- Follow the code style guidelines below

## Build Commands
- `npm install` - Install dependencies
- `npx expo start` - Start development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test

## Code Style
- **TypeScript**: Use strict mode with proper type annotations
- **Components**: Functional components with hooks
- **File Structure**: Group related components in directories (/ui, /store, /common)
- **Imports**: Group imports - React/RN, third-party, local components, types, styles
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Products**: Use typed interfaces (see product.ts, product-card.ts, product-status.ts)
- **Product Descriptions**: Use shortDescription (with line1 and line2) and longDescription instead of the deprecated description field
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
- **Debugging**: Always read app_structure.md before searching the codebase
- **NEVER Change User Experience During Refactoring**: When refactoring or cleaning up code, NEVER change the visual appearance, behavior, or functionality as experienced by the user without explicit approval
- **Preserve Design Intent**: Custom components (like SVG icons, animations, layout) were created for specific design reasons - don't replace them with generic alternatives during cleanup
- **Test Visual Integrity**: After any code changes, verify that visual appearance remains identical
- **Functional Equivalence**: Ensure that any cleanup or refactoring maintains exact functional equivalence

## Development Workflow
- Check for inconsistencies or potential issues in each module
- Propose improvements based on software engineering best practices
- Consider how components are being used in the broader context
- When in doubt, refer to the JSX and reference screenshots from Figma designs
- Use raw-components folder to understand design intent and implementation details

## Expo Router Configuration
The app uses a combination of approaches to prevent utility files from being treated as routes:

1. **Naming convention approach:**
   - Files that should not be routes are prefixed with underscore (_filename.ts)
   - Declaration files (.d.ts) are placed in an _excluded directory
   - This follows Expo Router's convention where `_` prefixed files are not treated as routes

2. **Default export approach:**
   - Utility files include a default export with metadata:
     ```typescript
     // Add default export to fix router warnings
     const utilityExport = {
       name: 'UtilityName',
       version: '1.0.0'
     };
     
     export default utilityExport;
     ```

3. **File organization:**
   - Keep type definitions and utility files in directories that are clearly not routes
   - Move declaration files (.d.ts) to appropriate subdirectories to avoid routing conflicts

After making changes:
- Clean the build cache: `npx expo start --clear`
- Verify TypeScript still works: `npm run typecheck`