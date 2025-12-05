# Android Setup Execution Plan - Tifossi

## Overview

This document provides a complete execution plan for enabling Android support in the Tifossi Expo/React Native e-commerce app. A fresh Claude instance can follow these phases sequentially.

**Estimated Total Time**: 22-26 hours
**Prerequisites**: Firebase Console access, domain hosting access for assetlinks.json

---

## Project Context

- **Framework**: Expo SDK 52+ with React Native
- **Auth**: Firebase Auth (Email, Google Sign-In, Apple Sign-In iOS-only)
- **Payments**: MercadoPago integration
- **Navigation**: Expo Router with deep linking
- **Current State**: iOS production-ready, Android has placeholder configs

---

## Phase 1: Configuration Fixes (Pre-Build)

**Time Estimate**: 2-3 hours
**Goal**: Fix all configuration issues before attempting Android build

### 1.1 Bundle ID Consistency

**Problem**: Mismatch between gradle and app.json

| Location | Current Value | Should Be |
|----------|---------------|-----------|
| `android/app/build.gradle` namespace | `com.tifossi` | `app.tiffosi.store` |
| `android/app/build.gradle` applicationId | `com.tifossi` | `app.tiffosi.store` |
| `app.json` android.package | `app.tiffosi.store` | `app.tiffosi.store` |

**Files to Edit**:
```
/Users/max/Documents/tifossi-expo/tifossi/android/app/build.gradle
```

**Action**: Update namespace and defaultConfig.applicationId to `app.tiffosi.store`

### 1.2 Firebase Android Configuration

**Problem**: `google-services.json` contains placeholder values

**File**: `/Users/max/Documents/tifossi-expo/tifossi/google-services.json`

**Current (WRONG)**:
```json
{
  "project_id": "placeholder-project-id",
  "package_name": "com.anonymous.tifossi"
}
```

**Action**:
1. Access Firebase Console → Project Settings
2. Add Android app with package name `app.tiffosi.store`
3. Download generated `google-services.json`
4. Replace the placeholder file at project root

**Verification**: File should contain real `project_id` matching iOS (`tiffosi-production`)

### 1.3 Add Adaptive Icon

**Problem**: No adaptive icon configuration for Android 8+

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app.json`

**Action**: Add to the `android` section:
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/images/adaptive-icon.png",
  "backgroundColor": "#FFFFFF"
}
```

**Note**: Ensure `adaptive-icon.png` exists (should be 1024x1024 with safe zone margins)

### 1.4 Verify App.json Android Config

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app.json`

**Checklist**:
- [ ] `android.package` = `app.tiffosi.store`
- [ ] `android.googleServicesFile` = `./google-services.json`
- [ ] Intent filters have `autoVerify: true`
- [ ] Adaptive icon configured

---

## Phase 2: Code Fixes (Android UI Compatibility)

**Time Estimate**: 3-4 hours
**Goal**: Fix known Android-specific UI issues

### 2.1 Missing Shadow Elevation

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app/_components/store/product/overlay/OverlayProductFilters.tsx`
**Line**: 434-437

**Problem**: `sliderMarker` style has iOS shadow props but no Android `elevation`

**Fix**: Add `elevation: 4` to the sliderMarker style:
```typescript
sliderMarker: {
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 4,  // ADD THIS
},
```

### 2.2 Tab Bar Safe Area

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app/_components/navigation/TabBar.tsx`
**Lines**: 119-120

**Problem**: Fixed `paddingBottom: 34` wastes space on Android

**Fix**: Use safe area insets:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Inside component:
const insets = useSafeAreaInsets();

// In styles, replace:
// paddingBottom: 34,
// With:
paddingBottom: Math.max(insets.bottom, 16),
```

### 2.3 Header Safe Area

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app/_components/store/layout/Header.tsx`
**Line**: 243

**Problem**: Fixed `paddingTop: 64` is iOS-specific

**Fix**: Use safe area insets:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Inside component:
const insets = useSafeAreaInsets();

// Replace fixed paddingTop: 64 with:
paddingTop: insets.top + 20,
```

### 2.4 StatusBar Android Visibility

**Files to check**:
- `/Users/max/Documents/tifossi-expo/tifossi/app/products/[id].tsx`
- `/Users/max/Documents/tifossi-expo/tifossi/app/product.tsx`

**Problem**: `<StatusBar style="dark" />` without Android background

**Fix**: Add platform-specific handling:
```typescript
import { Platform } from 'react-native';

<StatusBar
  style="dark"
  backgroundColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
/>
```

### 2.5 Input AutoComplete for Android

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app/_components/ui/form/Input.tsx`
**Lines**: 68-79

**Problem**: Missing `autoComplete` prop breaks Android password managers

**Fix**: Add autoComplete prop support:
```typescript
<TextInput
  autoComplete={props.autoComplete || 'off'}
  // ... existing props
/>
```

---

## Phase 3: ProGuard Configuration

**Time Estimate**: 2 hours
**Goal**: Configure code minification for release builds

### 3.1 Update ProGuard Rules

**File**: `/Users/max/Documents/tifossi-expo/tifossi/android/app/proguard-rules.pro`

**Current content** (minimal):
```proguard
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
```

**Add these rules**:
```proguard
# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Google Sign-In
-keep class com.google.android.gms.auth.** { *; }
-keep class com.reactnativegooglesignin.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.react.**

# Expo
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# MercadoPago (if using native SDK)
-keep class com.mercadopago.** { *; }
-dontwarn com.mercadopago.**

# Keep native methods
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}
```

### 3.2 Enable ProGuard for Release (Optional)

**File**: `/Users/max/Documents/tifossi-expo/tifossi/android/gradle.properties`

**To enable** (test thoroughly first):
```properties
android.enableProguardInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

**Warning**: Only enable after testing. Can cause runtime crashes if rules are incomplete.

---

## Phase 4: Deep Linking Setup

**Time Estimate**: 1-2 hours
**Goal**: Enable verified Android App Links

### 4.1 Create assetlinks.json

**Hosting Location**: `https://tifossi.app/.well-known/assetlinks.json`

**Content Template**:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.tiffosi.store",
    "sha256_cert_fingerprints": ["<SHA256_FINGERPRINT>"]
  }
}]
```

### 4.2 Get SHA256 Fingerprint

**For Debug** (testing):
```bash
cd android
./gradlew signingReport
```

Look for `SHA-256` under `debugAndroidTest` variant.

**For Release** (production):
Requires the production keystore (not created yet - out of scope per proposal).

### 4.3 Verify Intent Filters

**File**: `/Users/max/Documents/tifossi-expo/tifossi/app.json`
**Lines**: 74-103

**Already configured** - just verify these domains match assetlinks.json:
- `https://tifossi.app`
- `https://auth.tifossi.app`
- `https://pay.tifossi.app`

---

## Phase 5: Build and Initial Testing

**Time Estimate**: 3-4 hours
**Goal**: Get a working Android build on emulator

### 5.1 Clean and Rebuild

```bash
# Clean everything
cd android
./gradlew clean
cd ..

# Regenerate native code
npx expo prebuild --platform android --clean

# Build for emulator
npx expo run:android
```

### 5.2 Build Troubleshooting

**Common Issues**:

1. **Bundle ID mismatch errors**: Re-check Phase 1.1
2. **google-services.json errors**: Re-check Phase 1.2
3. **Missing SDK/NDK**: Run Android Studio → SDK Manager → Install required
4. **Gradle sync failed**: Delete `android/.gradle` folder and retry

### 5.3 Initial Smoke Test

Once built, verify basic functionality:

- [ ] App launches without crash
- [ ] Splash screen displays correctly
- [ ] Home screen loads products
- [ ] Navigation works (tabs, stack)
- [ ] Images load properly

---

## Phase 6: Systematic Testing

**Time Estimate**: 4-5 hours
**Goal**: Test all critical flows

### 6.1 Authentication Flows

| Test | Steps | Expected |
|------|-------|----------|
| Email Registration | Sign up with new email | Account created, verification email sent |
| Email Login | Login with existing account | Successful login, redirected to home |
| Google Sign-In | Tap Google button | Play Services dialog → Google account picker → Login success |
| Password Reset | Request reset, check email | Reset email received, link works |
| Logout | Tap logout in profile | Returned to login screen |

**Known Limitation**: Apple Sign-In will NOT appear on Android (by design)

### 6.2 Product Browsing

| Test | Steps | Expected |
|------|-------|----------|
| Browse products | Scroll home screen | Products load, images display |
| Product details | Tap product card | Detail sheet opens smoothly |
| Image gallery | Swipe product images | Smooth horizontal scrolling |
| Filters | Apply category/price filters | Products filter correctly |
| Search | Use search bar | Results appear |

### 6.3 Cart and Checkout

| Test | Steps | Expected |
|------|-------|----------|
| Add to cart | Tap add button | Item added, cart badge updates |
| View cart | Navigate to cart tab | Cart shows items |
| Update quantity | Change item quantity | Price updates |
| Remove item | Swipe/tap remove | Item removed |
| Checkout start | Begin checkout | Shipping form appears |

### 6.4 Payments (Sandbox)

| Test | Steps | Expected |
|------|-------|----------|
| Payment selection | Choose MercadoPago | Payment options load |
| Card payment | Enter test card | Payment processes |
| Payment success | Complete payment | Success screen, order created |
| Payment failure | Use declined card | Error handled gracefully |

**Test Cards** (MercadoPago sandbox):
- Success: `5031 7557 3453 0604`
- Declined: `5031 7557 3453 0605`

### 6.5 Deep Links

```bash
# Test product deep link
adb shell am start -a android.intent.action.VIEW -d "tifossi://product/test-product-id"

# Test HTTPS link (requires assetlinks.json deployed)
adb shell am start -a android.intent.action.VIEW -d "https://tifossi.app/product/test-product-id"
```

### 6.6 UI/Visual Checks

- [ ] Shadows visible on cards and buttons
- [ ] Tab bar proper height (no excessive padding)
- [ ] Headers don't overlap status bar
- [ ] Keyboard doesn't hide inputs
- [ ] Bottom sheets animate smoothly
- [ ] No gesture conflicts in galleries

---

## Phase 7: Bug Documentation

**Time Estimate**: 2 hours
**Goal**: Document all issues found

### Bug Report Template

```markdown
## Bug: [Title]

**Severity**: Critical / High / Medium / Low
**Component**: [File path]
**Steps to Reproduce**:
1. Step one
2. Step two

**Expected**: What should happen
**Actual**: What actually happens
**Screenshot**: [if applicable]
**Fix Estimate**: X hours
```

### Severity Definitions

- **Critical**: App crashes, data loss, auth broken
- **High**: Feature doesn't work, bad UX
- **Medium**: Visual issues, minor UX problems
- **Low**: Edge cases, polish items

---

## Phase 8: Bug Fixes

**Time Estimate**: 6-10 hours (buffer)
**Goal**: Fix discovered issues

### Priority Order

1. **Critical bugs first** - anything blocking basic usage
2. **High severity** - broken features
3. **Medium severity** - if time permits
4. **Low severity** - document for future

### Common Android Fixes Reference

**Keyboard overlap in BottomSheet**:
```typescript
// SwipeableEdge.tsx
enableDynamicSizing={true}  // Change from false
```

**Gesture conflicts in horizontal scroll**:
```typescript
<ScrollView
  horizontal
  nestedScrollEnabled={true}
  scrollEventThrottle={32}  // Increase from 16
/>
```

**Dimensions caching for performance**:
```typescript
const { width } = useMemo(() => Dimensions.get('window'), []);
```

---

## Verification Checklist

Before marking complete, verify:

### Configuration
- [ ] `google-services.json` has real Firebase credentials
- [ ] Bundle ID consistent everywhere (`app.tiffosi.store`)
- [ ] Adaptive icon configured and displays correctly
- [ ] ProGuard rules don't break anything

### Functionality
- [ ] App builds without errors
- [ ] Email auth works (register, login, reset)
- [ ] Google Sign-In works with Play Services
- [ ] Product browsing smooth
- [ ] Cart operations work
- [ ] Checkout flow completes (sandbox)
- [ ] Deep links navigate correctly

### UI/UX
- [ ] No shadow issues
- [ ] Safe areas handled correctly
- [ ] Keyboard behavior correct
- [ ] Animations smooth
- [ ] No gesture conflicts

---

## Out of Scope (Per Proposal)

These items are explicitly EXCLUDED:

1. Google Play Developer account ($25 - client responsibility)
2. Google Play Store listing creation
3. Production keystore generation
4. Physical device testing
5. Post-delivery bug fixes
6. App Store submission

---

## Files Reference

### Critical Files
```
/android/app/build.gradle           - Bundle ID, signing config
/android/app/proguard-rules.pro     - Minification rules
/google-services.json               - Firebase Android config
/app.json                           - Expo config, intent filters
```

### UI Components to Check
```
/app/_components/navigation/TabBar.tsx
/app/_components/store/layout/Header.tsx
/app/_components/store/product/overlay/OverlayProductFilters.tsx
/app/_components/store/product/swipeable/SwipeableEdge.tsx
/app/_components/ui/form/Input.tsx
```

### Auth Service
```
/app/_services/auth/firebaseAuth.ts  - Google Sign-In implementation (lines 174-254)
```

---

## Notes for Execution

1. **Work in phases** - Complete each phase before moving to next
2. **Test after each change** - Don't batch multiple fixes
3. **Document everything** - Screenshot issues, note line numbers
4. **Commit frequently** - Small atomic commits per fix
5. **Ask for Firebase access early** - Phase 1.2 blocks everything else
