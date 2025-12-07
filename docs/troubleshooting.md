# Troubleshooting

## iOS Build Issues

Full clean and rebuild:
```bash
cd ios && pod deintegrate && pod cache clean --all && rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData && cd .. && npm install && cd ios && pod install && cd ..
```

## Expo Cache
```bash
npx expo start --clear
```

## TypeScript Issues
```bash
npm run typecheck
```

## Linting Issues
```bash
npm run fix-imports  # Auto-fix unused imports
npm run lint         # Check all files
```
