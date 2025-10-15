# Tifossi - Mobile E-commerce App

Tifossi is a mobile-first iOS e-commerce application built with React Native and Expo. The app provides a seamless shopping experience with a focus on fashion products, featuring Firebase authentication, Strapi backend integration, and MercadoPago payments.

## Features

- **User Authentication**: Firebase-powered login/signup with biometric support
- **Product Catalog**: Browse products by category with search and filters
- **Shopping Cart**: Add, manage, and sync cart across devices
- **Favorites**: Save and manage favorite products with persistence
- **Secure Payments**: MercadoPago integration with deep linking
- **Offline Support**: Continue shopping with offline queue and sync

## Technologies

- **React Native & Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development experience
- **Firebase**: Authentication and user management
- **Strapi**: Headless CMS for content management
- **MercadoPago**: Payment processing
- **Zustand**: State management
- **TanStack Query**: Server state and caching
- **MMKV**: Fast, secure data storage

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

3. **Run on iOS (primary platform)**

   ```bash
   npm run ios
   ```

4. **Run on Android or Web** (optional)

   ```bash
   npm run android
   npm run web
   ```

## Development

### Quality Assurance

- **Linting**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Testing**: `npm test`
- **All checks**: `npm run check-all`
- **Fix imports**: `npm run fix-imports`

### Build Management

- **Version bump**: `./scripts/version-bump.sh [major|minor|patch]`
- **Environment check**: `./scripts/check-environment.js`
- **Bundle analysis**: `./scripts/bundle-analyzer.js`

## Project Structure

The app follows a structured organization pattern. Refer to [app_structure.md](./docs/app_structure.md) for detailed information about the codebase organization.

```
tifossi/
├── app/                   # Main application code
│   ├── (tabs)/            # Tab navigation routes
│   ├── auth/              # Authentication screens
│   ├── checkout/          # Checkout flow screens
│   ├── _components/       # React components
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared components
│   │   ├── store/         # Shopping components
│   │   └── ui/            # Reusable UI components
│   ├── _services/         # API and business logic
│   ├── _stores/           # Zustand state stores
│   ├── _styles/           # Design system and styles
│   └── _types/            # TypeScript definitions
├── assets/                # Static assets (images, icons, fonts)
├── docs/                  # Essential documentation
├── hooks/                 # Custom React hooks
├── scripts/               # Build and utility scripts
├── android/ & ios/        # Native platform code
└── backend/               # Strapi backend (separate deployment)
```

## Documentation

Essential documentation is available in the `/docs` folder:

- [App Structure](./docs/app_structure.md) - Codebase organization and architecture
- [Components](./docs/components.md) - Component library and usage
- [Authentication](./docs/authentication.md) - Firebase auth integration
- [State Management](./docs/state_management.md) - Zustand stores and patterns
- [Style System](./docs/style_system.md) - Design tokens and styling approach

## Development Principles

- **Mobile-First iOS**: Designed primarily for iOS with native-feeling interactions
- **Design Fidelity**: Follow Figma designs closely for visual consistency
- **Type Safety**: Comprehensive TypeScript usage throughout the application
- **Component Architecture**: Modular, reusable components with clear responsibilities
- **Performance**: Optimized for smooth user experience with offline support

## License

Proprietary - All rights reserved
