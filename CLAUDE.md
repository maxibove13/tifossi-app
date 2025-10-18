# Tifossi Expo Project Guidelines

## PROJECT STATUS

**Status**: Code Complete - App Store Compliance Required (8 Critical Blockers)
**Last Audit**: 2025-10-18 Multi-Agent Review
**Rejection Risk**: 95% without fixes to iOS entitlements, privacy manifest, ATT permission
**Ground Truth Documents**:

- FUNCIONALIDADES_APP_TIFOSSI.md (client deliverables)
- COSTOS_OPERATIVOS_URUGUAY_2025.md (infrastructure costs)
- TIFOSSI_DELIVERY_PLAN.md (execution roadmap with audit findings)

## CRITICAL APP STORE BLOCKERS (2025-10-18 Audit)

Before App Store submission, these must be resolved:

1. **Empty iOS Entitlements** - `ios/tifossi/tifossi.entitlements` contains only `<dict/>` (Apple Sign-In will crash)
2. **Empty Privacy Manifest** - `NSPrivacyCollectedDataTypes` array is empty (collecting 10+ data types but none declared)
3. **Missing ATT Permission** - Analytics enabled but no `NSUserTrackingUsageDescription` in Info.plist
4. **Backend Payment Configuration** - MercadoPago service crashes on startup without credentials
5. **Bundle ID Inconsistency** - Mismatch between app.json and eas.json
6. **Google Sign-In Incomplete** - Button present but returns hardcoded error
7. **Production Code Quality** - 83 console.log statements, generic URL schemes
8. **Unnecessary Permissions** - Microphone permission declared but not used

See [TIFOSSI_DELIVERY_PLAN.md](./docs/project/TIFOSSI_DELIVERY_PLAN.md) for complete details.

## DEPLOYMENT REQUIREMENTS

1. Deploy Strapi backend to Render.com ✅ COMPLETED
2. Apple Sign-In: ✅ Implemented via Firebase (expo-apple-authentication)
3. Update bundle identifiers to production values (awaiting Apple/Google accounts)
4. Configure Firebase and MercadoPago production credentials
5. Remove all TODO/placeholder content
6. Fix 8 critical App Store blockers identified in audit

## PROGRESS TRACKING

**IMPORTANT**: TIFOSSI_DELIVERY_PLAN.md is the SINGLE SOURCE OF TRUTH for:

- Project delivery goals vs current state
- All current issues and blockers
- Implementation status tracking
- Gap analysis between commitments and reality

After completing ANY task or making significant changes:

1. Check alignment with TIFOSSI_DELIVERY_PLAN.md
2. Update status in the plan (Implemented/Code Complete/Awaiting Credentials)
3. Mark completed tasks with ✅ in the execution checklist
4. Document any blockers or issues discovered
5. Keep clear distinction between GOAL (deliverables) and CURRENT STATE (actual status)

**File Roles**:

- FUNCIONALIDADES_APP_TIFOSSI.md: Client commitments and deliverables (THE GOAL)
- TIFOSSI_DELIVERY_PLAN.md: Current status, issues, and gap analysis (THE REALITY)
- COSTOS_OPERATIVOS_URUGUAY_2025.md: Infrastructure costs and scaling

## IMPORTANT GUIDELINES

- NEVER commit changes to git without being expressly asked to do so
- Always run linters and type checkers before submitting changes
- NEVER test the application by running it directly; only make code changes
- Follow the code style guidelines below
- ALWAYS follow rules in /.cursor/rules if they exist
- ALWAYS refer to README.md and the /docs folder to understand project structure and guidelines
- NEVER execute de application yourself
- ALWAYS check related components or how components are used before finishing

## Client Commitments

- **Mobile App**: React Native/Expo with Firebase auth, MercadoPago payments
- **Backend**: Strapi CMS with product/order management
- **Infrastructure**: $35/month Render hosting + MercadoPago fees (5.23%)
- **Delivery**: Functional app ready for store submission
- **NOT Included**: CFE invoice integration (client responsibility)

## Authentication Setup

- **Firebase Required**: The app uses Firebase Authentication for user management
- **Apple Sign-In**: ✅ Implemented via Firebase (required for App Store submission)
- **Setup Guide**: See `FIREBASE_SETUP_GUIDE.md` for detailed client instructions
- **Current Status**: Firebase authentication implemented, awaiting production credentials

## Build Commands

- `npm install` - Install dependencies
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run check-all` - Run all checks (prettier, eslint, typecheck, tests)
- `npm run fix-imports` - Automatically fix unused imports
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npx expo run:ios` - This is how we usually run the app

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
  - When troubleshooting complex layout issues, if parent component styles appear correct but the desired layout is not achieved, inspect the styling of child components for unexpected flex properties (e.g., `flex: 1`) or other layout-influencing styles that might conflict with or override the parent's intended layout.
- **Proactive Investigation**: When debugging, actively investigate potential related issues or conflicts beyond the initially reported problem.
- **Performance Optimization**: For animation-heavy components, implement performance optimizations like:
  - Replacing expensive components (LinearGradient) with simpler alternatives when visually equivalent
  - Implementing device-based dimension caching to avoid repeated measurements
  - Removing console logs, especially in render methods
  - Using the appropriate techniques described in style_system.md
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
   - Files that should not be routes are prefixed with underscore (\_filename.ts)
   - Declaration files (.d.ts) are placed in an \_excluded directory
   - This follows Expo Router's convention where `_` prefixed files are not treated as routes

2. **Default export approach:**
   - Utility files include a default export with metadata:

     ```typescript
     // Add default export to fix router warnings
     const utilityExport = {
       name: 'UtilityName',
       version: '1.0.0',
     };

     export default utilityExport;
     ```

3. **File organization:**
   - Keep type definitions and utility files in directories that are clearly not routes
   - Move declaration files (.d.ts) to appropriate subdirectories to avoid routing conflicts

After making changes:

- Clean the build cache: `npx expo start --clear`
- Verify TypeScript still works: `npm run typecheck`

## Cleaning iOS Build

If you encounter iOS build issues, use this command to clean everything:

```
cd ios && pod deintegrate && pod cache clean --all && rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData && cd .. && npm install && cd ios && pod install && cd ..
```

## Linting and Code Quality

The project uses a comprehensive code quality setup:

1. **ESLint Configuration**:
   - Uses Expo recommended config with Prettier integration
   - Special plugin for detecting and removing unused imports
   - Custom rules for variable naming and React imports

2. **Pre-commit Hooks**:
   - Husky runs lint-staged before each commit
   - Prettier formatting on all TS/TSX files
   - ESLint checks on modified files
   - Jest tests on related test files

3. **Manual Quality Checks**:
   - `npm run lint`: Run ESLint on all files
   - `npm run typecheck`: Run TypeScript type checking
   - `npm run check-all`: Run all checks (prettier, eslint, typecheck, tests)
   - `npm run fix-imports`: Fix unused imports automatically

Always run both linting and type checking before submitting changes:

```
npm run lint && npm run typecheck
```

## Backend Commands

- `cd backend && npm install` - Install Strapi dependencies
- `npm run develop` - Run Strapi in development mode
- `npm run build` - Build Strapi for production
- `npm run start` - Start Strapi in production mode

## Deployment

- **Backend**: Deploy to Render.com using render.yaml configuration
- **Frontend**: Build with EAS for App Store and Google Play
- **Environment**: Use .env files for configuration (never commit secrets)
