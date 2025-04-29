# Cart Item Removal with Undo Feature

## Overview

The Tifossi app implements a cart item removal feature with an undo capability, providing users with the ability to recover from accidental deletions. This document details the implementation of this feature, including the removal animation, undo functionality, and confirmation screens.

## Components

### 1. OverlayProductRemoving (`app/_components/store/product/overlay/OverlayProductRemoving.tsx`)

This modal overlay provides visual feedback during the item removal process:

- **Animated Progress Bar**: Shows removal progress, giving the user time to cancel
- **Cancel Button**: Allows user to abort the removal process
- **Animation**: Implemented using both React Native Animated and Reanimated libraries
- **Props**: 
  - `isVisible`: Controls whether the overlay is shown
  - `onCancel`: Function to call when user cancels the removal
  - `duration`: Configurable duration of the removal process (defaults to 1000ms)

### 2. Cart Item Deleted Screen (`app/cart/deleted.tsx`)

Confirmation screen shown after an item is removed from the cart:

- **Visual Feedback**: Shows a trash icon and confirmation message
- **Background**: Custom background image with overlay
- **Auto-redirect**: Automatically returns to the main tab screen after 1 second
- **Navigation**: Uses `router.replace()` to prevent back navigation to this screen

## Implementation Flow

1. **Initiate Removal**: User triggers item removal from cart
2. **Show Removal Progress**: `OverlayProductRemoving` appears with animated progress bar
3. **Undo Window**: User has a brief window (default 1000ms) to cancel the removal
4. **Complete or Cancel**:
   - If canceled: Overlay dismisses, item remains in cart
   - If completed: Item is removed from cart, user is redirected to deletion confirmation
5. **Confirmation Screen**: User sees `CartItemDeletedScreen` briefly before returning to main flow

## Technical Implementation

### Progress Bar Animation

The progress bar uses Reanimated for smooth animation:

```typescript
// Initialize progress shared value
const progress = useSharedValue(0);

// Start progress animation when overlay becomes visible
useEffect(() => {
  if (isVisible) {
    progress.value = 0; // Reset progress
    progress.value = withTiming(1, {
      duration: duration, // Configurable duration
      easing: Easing.linear, // Linear progress
    });
  }
}, [isVisible, progress, duration]);

// Create animated style for progress bar fill
const progressBarAnimatedStyle = useAnimatedStyle(() => ({
  width: `${progress.value * 100}%`,
}));
```

### Modal Animation

The modal uses React Native's Animated API for entry and exit animations:

```typescript
// Start fade/slide animations when visible
RNAnimated.parallel([
  RNAnimated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }),
  RNAnimated.timing(slideAnim, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }),
]).start();
```

### Deletion Confirmation

The deleted confirmation screen uses useEffect for auto-redirect:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // Redirect to home screen after 1 second
    router.replace('/(tabs)'); // Replace to prevent back navigation
  }, 1000);

  // Cleanup timer on unmount
  return () => clearTimeout(timer);
}, [router]);
```

## Integration with Cart Store

This feature integrates with the cart state management system:

1. When removal is initiated, the UI shows the removal overlay
2. During the undo window, the item remains in the cart
3. If not canceled, the cart store's `removeItem` action is called after the timeout
4. The cart store updates its state and triggers a redirect to the confirmation screen

## UX Considerations

- **Undo Window Duration**: 1000ms provides a balance between allowing recovery and not slowing down the user
- **Visual Feedback**: Progress bar clearly indicates time remaining to undo
- **Confirmation**: Deleted screen provides clear feedback that action was completed
- **Clean Navigation**: Using `router.replace()` prevents users from navigating back to intermediate screens
