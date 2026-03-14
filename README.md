# Tifossi

iOS e-commerce app for sports merchandise, built with React Native and Expo.

## Tech Stack

- **Frontend:** React Native / Expo (SDK 52, New Architecture)
- **Navigation:** Expo Router with typed routes
- **State:** Zustand (local) + React Query (server)
- **Auth:** Firebase (Apple Sign-In, Google Sign-In)
- **Payments:** MercadoPago
- **Backend:** Strapi CMS on Render.com

## Getting Started

```bash
npm install
npx expo start
npx expo run:ios
```

Requires Node.js, Xcode, and an iOS simulator or device.

## Scripts

| Command | Description |
|---|---|
| `npm run check-all` | Lint + typecheck (frontend and backend) |
| `npm run test` | Run unit tests |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm run e2e:test` | Detox end-to-end tests |
| `npm run build` | EAS production build |

## Project Structure

```
app/                  Screens and app code (Expo Router)
  (tabs)/             Tab navigation (Home, Favorites, Cart, Profile)
  auth/               Authentication screens
  checkout/           Checkout flow
  products/           Product screens
  _components/        React components
  _services/          API clients, preloading
  _stores/            Zustand state stores
  _styles/            Design tokens and themes
backend/strapi/       Strapi CMS backend
assets/               Images, fonts, icons
hooks/                Shared React hooks
docs/                 Internal documentation
```

## License

Private
