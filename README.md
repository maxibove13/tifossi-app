# Tifossi - Mobile E-commerce App

Tifossi is a mobile-first iOS e-commerce application built with React Native and Expo. The app provides a seamless shopping experience with a focus on fashion products.

![App Screenshot](./figma-images/product-screen.png)

## Features

- **Product Browsing**: Browse products by category with intuitive navigation
- **Product Details**: View detailed product information with swipeable interfaces
- **Shopping Cart**: Add and manage products in your shopping cart
- **User Profile**: Manage user account and preferences
- **Favorites**: Save and manage favorite products

## Technologies

- **React Native**: Core framework for cross-platform mobile development
- **Expo**: Development platform for building React Native apps
- **TypeScript**: Type-safe JavaScript for improved development experience
- **Reanimated**: Advanced animations for smooth user interactions
- **Expo Router**: File-based routing for seamless navigation

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

4. **Run on other platforms**

   ```bash
   npm run android
   npm run web
   ```

## Development

- **Linting**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Testing**: `npm test`
- **Reset project**: `npm run reset-project`

## Project Structure

The app follows a structured organization pattern. Refer to [app_structure.md](./docs/app_structure.md) for detailed information about the codebase organization.

```
tifossi/
├── app/                   # Main application code
│   ├── (home)/            # Home routes
│   ├── (tabs)/            # Tab navigation routes
│   ├── components/        # React components
│   │   ├── common/        # Shared components
│   │   ├── home/          # Home screen components
│   │   ├── navigation/    # Navigation components
│   │   ├── skeletons/     # Loading skeletons
│   │   ├── splash/        # Splash screen
│   │   ├── store/         # Store components
│   │   │   ├── layout/    # Store layout components
│   │   │   ├── product/   # Product components
│   │   │   │   ├── cart/  # Cart related components
│   │   │   │   ├── color/ # Color selection
│   │   │   │   ├── swipeable/ # Swipeable product details
│   │   │   │   └── ...    # Other product components
│   │   │   └── review/    # Product reviews
│   │   └── ui/            # UI components
│   │       ├── buttons/   # Button components
│   │       ├── cards/     # Card components
│   │       ├── form/      # Form components
│   │       └── ...        # Other UI components
│   ├── data/              # Data sources
│   ├── _styles/            # Style definitions
│   └── _types/             # TypeScript type definitions
├── assets/                # Static assets
│   ├── fonts/             # Custom fonts
│   ├── icons/             # App icons
│   ├── images/            # Image assets
│   └── videos/            # Video assets
├── docs/                  # Documentation
├── figma-images/          # Screenshots from Figma
├── hooks/                 # Custom React hooks
├── raw-components/        # Reference components
├── android/               # Android specific code
├── ios/                   # iOS specific code
├── scripts/               # Utility scripts
└── types/                 # Global type definitions
```

## Documentation

- [App Structure](./docs/app_structure.md) - Overview of the application structure
- [Components](./docs/components.md) - Component specifications and usage
- [Product Cards](./docs/product_card.md) - Product card implementation details

## Design Reference

The implementation is based on Figma designs created by a professional designer. Component references are available in the `/raw-components` directory, including:
- JSX implementations for reference
- Screenshot images for visual verification

## Development Principles

- **Mobile-First iOS**: Designed primarily for iOS with native-feeling interactions
- **Design Fidelity**: Follow Figma designs closely for visual consistency
- **Component Architecture**: Modular components with clear responsibilities
- **Type Safety**: Comprehensive TypeScript type system
- **Simplicity Over Complexity**: Prioritize clean, maintainable code

## License

Proprietary - All rights reserved