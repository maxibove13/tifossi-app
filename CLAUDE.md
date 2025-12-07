# Tifossi Expo Guidelines

## Stack
- React Native/Expo mobile app (iOS primary)
- Firebase auth, MercadoPago payments
- Strapi CMS backend on Render.com

## Source of Truth
`docs/project/TIFOSSI_DELIVERY_PLAN.md` - Project status, blockers, and roadmap

## Commands
```bash
npm run check-all      # Run before finishing any task
npx expo run:ios       # Run the app
```

## Core Rules
- NEVER commit without being asked
- NEVER run the app yourself - only make code changes
- Run `npm run check-all` before finishing
- Read `docs/app_structure.md` before searching codebase
- Check how components are used before modifying them

## Reference Docs
| Topic | File |
|-------|------|
| App structure | `docs/app_structure.md` |
| Code conventions | `docs/code_conventions.md` |
| Implementation | `docs/implementation_guidelines.md` |
| Components | `docs/components.md` |
| Style system | `docs/style_system.md` |
| State management | `docs/state_management.md` |
| Expo Router | `docs/expo_router.md` |
| Troubleshooting | `docs/troubleshooting.md` |

## Backend
```bash
cd backend/strapi && npm run develop  # Local dev
```
See `docs/RENDER_DEPLOYMENT_SETUP.md` for production.
