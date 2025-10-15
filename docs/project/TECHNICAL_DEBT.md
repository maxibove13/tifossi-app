# Technical Debt Backlog

## Overview

This document tracks technical debt items identified during code audits that require future attention.

## Deferred Items

### Agent 5: Overlay Component Refactoring

**Priority**: Medium
**Estimated Effort**: Small
**Focus**: Eliminate duplication in 9 overlay components
**Location**: `app/_components/store/product/overlay/**`

**Current Issues**:

- 9 overlay components with significant code duplication
- Each component (~200-300 lines) repeats:
  - Modal animation logic
  - Backdrop handling
  - Close button functionality
  - Gesture handlers
  - Style definitions

**Proposed Solution**:

1. Create `BaseOverlay` component with common functionality:

   ```typescript
   interface BaseOverlayProps {
     visible: boolean;
     onClose: () => void;
     title?: string;
     children: React.ReactNode;
   }
   ```

2. Extract shared logic:
   - Slide animations (Animated.View)
   - Backdrop with opacity animation
   - Pan gesture responder for swipe-to-close
   - Common styles (container, backdrop, content)

3. Refactor each overlay to extend BaseOverlay:
   - OverlayCheckoutQuantity
   - OverlayCheckoutShipping
   - OverlayDeleteConfirmation
   - OverlayProductEdit
   - OverlayProductEditSize
   - OverlayProductFilters
   - OverlayProductRemoving
   - OverlayProductSearch
   - OverlayShippingSelection

**Expected Benefits**:

- Reduce code by ~40% (800-1000 lines)
- Consistent behavior across all overlays
- Easier maintenance and updates
- Better testability

**Files to Modify**:

```
app/_components/store/product/overlay/
├── BaseOverlay.tsx (NEW)
├── OverlayCheckoutQuantity.tsx
├── OverlayCheckoutShipping.tsx
├── OverlayDeleteConfirmation.tsx
├── OverlayProductEdit.tsx
├── OverlayProductEditSize.tsx
├── OverlayProductFilters.tsx
├── OverlayProductRemoving.tsx
├── OverlayProductSearch.tsx
└── OverlayShippingSelection.tsx
```

**Validation**:

- All overlays should maintain current functionality
- Visual appearance must remain identical
- Gesture behaviors preserved
- Component tests should pass

---

## Completed Items

_Items will be moved here once resolved_

## Notes

- Last audit: August 2025
- Total estimated debt: Medium to Large effort required
- Critical items being addressed in current sprint
