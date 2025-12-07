# Expo Router Configuration

Prevent utility files from being treated as routes:

## Naming Convention
- Prefix non-route files with underscore: `_filename.ts`
- Place `.d.ts` files in `_excluded/` directory

## Default Export Workaround
For utility files that can't be renamed:
```typescript
const utilityExport = {
  name: 'UtilityName',
  version: '1.0.0',
};
export default utilityExport;
```

## File Organization
Keep type definitions and utilities in directories clearly not routes.

## After Changes
```bash
npx expo start --clear  # Clean build cache
npm run typecheck       # Verify TypeScript
```
