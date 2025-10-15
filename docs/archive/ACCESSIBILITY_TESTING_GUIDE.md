# Accessibility Testing Guide

## Overview

This guide documents the comprehensive accessibility testing suite for the Tifossi Expo app. The test suite ensures WCAG 2.1 AA compliance and provides excellent user experience for people with disabilities.

## Test Coverage

### Core Accessibility Tests (`accessibility.test.tsx`)

- **Button Accessibility**: Proper roles, labels, hints, and keyboard support
- **Product Card Accessibility**: Semantic structure and screen reader support
- **Form Accessibility**: Field associations, validation, and error handling
- **Search Accessibility**: Search regions, autocomplete, and results
- **Focus Management**: Tab order, modal focus trapping
- **Screen Reader Support**: Meaningful content and dynamic announcements
- **Color and Contrast**: Visual hierarchy and non-color dependent information
- **Touch Target Size**: Minimum 44pt touch targets
- **WCAG 2.1 Compliance**: Comprehensive guideline adherence

### Screen Reader Tests (`screen-reader.test.tsx`)

- **VoiceOver/TalkBack Compatibility**: Platform-specific screen reader support
- **Dynamic Content Announcements**: Live regions and status updates
- **Semantic Structure**: Proper heading hierarchy and landmarks
- **State Communication**: Loading, error, and success states
- **Product Information**: Detailed product descriptions and pricing
- **Cart Updates**: Quantity changes and item management
- **Search Results**: Result counting and navigation
- **Form Validation**: Error announcements and field associations

### Navigation and Focus Tests (`navigation.test.tsx`)

- **Keyboard Navigation**: Tab order and keyboard shortcuts
- **Focus Management**: Modal trapping and navigation changes
- **Gesture Alternatives**: Touch gesture alternatives for accessibility
- **Skip Navigation**: Skip to main content functionality
- **Focus Indicators**: Visible focus states and proper contrast
- **Tab Navigation**: Tab bar accessibility and state management
- **Form Navigation**: Logical field ordering and section grouping

### Form Accessibility Tests (`forms.test.tsx`)

- **Field Labels**: Proper label associations and descriptions
- **Validation Errors**: Error announcements and field associations
- **Required Fields**: Clear indication of required vs optional fields
- **Form Structure**: Fieldsets, legends, and semantic grouping
- **Input Types**: Appropriate input types and autocomplete
- **Error Recovery**: Clear error messages and correction guidance
- **Submit States**: Loading states and error handling
- **Complex Forms**: Multi-step forms, dropdowns, and radio groups

### Color and Contrast Tests (`color-contrast.test.tsx`)

- **WCAG Contrast Ratios**: 4.5:1 for normal text, 3:1 for large text
- **Font Scaling**: Support for 200% text scaling
- **Theme Support**: Light, dark, and high contrast modes
- **Color Independence**: Information not conveyed through color alone
- **Focus Indicators**: Sufficient contrast for focus states
- **Status Indicators**: Visual and textual status communication
- **Error States**: Clear error indication beyond color
- **Interactive Elements**: Button and link contrast compliance

### Cart Accessibility Tests (`cart-accessibility.test.tsx`)

- **Item Management**: Accessible quantity controls and removal
- **Dynamic Updates**: Live region announcements for cart changes
- **Empty States**: Clear empty cart messaging and recovery
- **Summary Information**: Comprehensive pricing and total information
- **Checkout Flow**: Accessible checkout button and states
- **Error Handling**: Cart operation error recovery
- **Keyboard Navigation**: Full keyboard support for cart operations
- **Screen Reader**: Detailed item descriptions and states

### Image Accessibility Tests (`image-accessibility.test.tsx`)

- **Alt Text**: Meaningful alternative text for all images
- **Decorative Images**: Proper hiding of decorative images
- **Complex Images**: Detailed descriptions for complex imagery
- **Image Galleries**: Navigation controls and current image context
- **Loading States**: Accessible loading and error states
- **User Avatars**: Profile picture accessibility
- **Product Images**: Zoom functionality and detailed descriptions
- **Image Collections**: Gallery navigation and thumbnail accessibility

### Error Message Tests (`error-messages.test.tsx`)

- **Form Validation**: Field-specific error announcements
- **Network Errors**: Connection error handling and retry options
- **System Errors**: Application error recovery flows
- **Validation Summary**: Comprehensive error summaries with navigation
- **Error Persistence**: Appropriate error timing and dismissal
- **Recovery Guidance**: Clear instructions for error correction
- **Progressive Errors**: Escalating error states (e.g., account lockout)
- **Inline Tooltips**: Contextual error help and guidance

### Mobile-Specific Tests (`mobile-specific.test.tsx`)

- **Touch Targets**: iOS (44pt) and Android (48dp) minimum sizes
- **Gesture Alternatives**: Non-gesture alternatives for all interactions
- **VoiceOver/TalkBack**: Platform-specific optimizations
- **Rotor Navigation**: Heading, link, and form element navigation
- **Device Orientation**: Portrait and landscape accessibility
- **Voice Control**: Voice command support and alternatives
- **Platform Differences**: iOS and Android specific features
- **Performance**: Large list accessibility optimization

### Comprehensive Integration Tests (`comprehensive-suite.test.tsx`)

- **End-to-End Flows**: Complete user journeys with assistive technology
- **Shopping Flow**: Product browsing, cart management, checkout
- **Authentication**: Login, registration, and guest access
- **Navigation**: Screen transitions and state management
- **Content Structure**: Semantic markup and landmark roles
- **Dynamic Content**: Real-time updates and announcements
- **Error Recovery**: Application-wide error handling
- **WCAG Compliance**: Full guideline compliance verification

## Testing Methodology

### Screen Reader Testing

- **Semantic HTML/React Native**: Proper roles, properties, and states
- **Live Regions**: Dynamic content announcements
- **Focus Management**: Logical tab order and focus trapping
- **Content Structure**: Heading hierarchy and landmark navigation

### Keyboard Navigation Testing

- **Tab Order**: Logical sequential navigation
- **Focus Indicators**: Visible focus states
- **Keyboard Shortcuts**: Common shortcuts and custom actions
- **Modal Management**: Focus trapping in dialogs and overlays

### Voice Control Testing

- **Voice Commands**: Alternative voice-activated controls
- **Command Discovery**: Clear available voice commands
- **Fallback Options**: Manual alternatives to voice controls

### Assistive Technology Compatibility

- **VoiceOver (iOS)**: Native iOS screen reader support
- **TalkBack (Android)**: Native Android screen reader support
- **Switch Control**: External switch navigation support
- **Voice Control**: Platform voice control integration

## WCAG 2.1 AA Compliance

### Level A Requirements

- ✅ **1.1.1 Non-text Content**: Alt text for all images
- ✅ **1.3.1 Info and Relationships**: Semantic markup
- ✅ **1.3.2 Meaningful Sequence**: Logical reading order
- ✅ **1.4.1 Use of Color**: Information not conveyed by color alone
- ✅ **2.1.1 Keyboard**: All functionality keyboard accessible
- ✅ **2.1.2 No Keyboard Trap**: No keyboard focus traps
- ✅ **2.2.1 Timing Adjustable**: User control of time limits
- ✅ **2.4.1 Bypass Blocks**: Skip navigation links
- ✅ **2.4.2 Page Titled**: Descriptive page/screen titles
- ✅ **3.1.1 Language of Page**: Content language specified
- ✅ **3.2.1 On Focus**: No context changes on focus
- ✅ **3.2.2 On Input**: No context changes on input
- ✅ **3.3.1 Error Identification**: Errors clearly identified
- ✅ **3.3.2 Labels or Instructions**: Form labels provided
- ✅ **4.1.1 Parsing**: Valid markup
- ✅ **4.1.2 Name, Role, Value**: Proper accessibility properties

### Level AA Requirements

- ✅ **1.2.4 Captions (Live)**: Live captions (if applicable)
- ✅ **1.2.5 Audio Description**: Audio descriptions (if applicable)
- ✅ **1.4.3 Contrast (Minimum)**: 4.5:1 contrast ratio
- ✅ **1.4.4 Resize Text**: 200% text scaling support
- ✅ **1.4.5 Images of Text**: Avoid images of text
- ✅ **2.4.5 Multiple Ways**: Multiple navigation methods
- ✅ **2.4.6 Headings and Labels**: Descriptive headings/labels
- ✅ **2.4.7 Focus Visible**: Visible focus indicators
- ✅ **3.1.2 Language of Parts**: Part language identification
- ✅ **3.2.3 Consistent Navigation**: Consistent navigation
- ✅ **3.2.4 Consistent Identification**: Consistent component identification
- ✅ **3.3.3 Error Suggestion**: Error correction suggestions
- ✅ **3.3.4 Error Prevention**: Error prevention for critical actions

## Running the Tests

### All Accessibility Tests

```bash
npm test -- --testPathPattern=accessibility
```

### Specific Test Suites

```bash
# Screen reader tests
npm test -- screen-reader.test.tsx

# Navigation tests
npm test -- navigation.test.tsx

# Form accessibility tests
npm test -- forms.test.tsx

# Color and contrast tests
npm test -- color-contrast.test.tsx

# Mobile-specific tests
npm test -- mobile-specific.test.tsx

# Comprehensive integration tests
npm test -- comprehensive-suite.test.tsx
```

### Test with Coverage

```bash
npm test -- --coverage --testPathPattern=accessibility
```

### Verbose Output

```bash
npm test -- --verbose --testPathPattern=accessibility
```

## Test Utilities

### Accessibility Helpers (`test-setup.ts`)

- **`checkAccessibilityProps()`**: Validates accessibility properties
- **`findElementsWithoutAccessibility()`**: Identifies accessibility issues
- **Mock screen reader interactions**
- **Focus management testing utilities**
- **Live region testing helpers**

### Mock Data (`mock-data.ts`)

- **Product data**: Complete product information with accessibility content
- **User data**: User profiles with accessibility considerations
- **Cart items**: Shopping cart data with proper labeling
- **API responses**: Mock responses for error testing

## Best Practices

### Writing Accessibility Tests

1. **Test behavior, not implementation**: Focus on user experience
2. **Use real assistive technology patterns**: Match actual usage
3. **Test error states**: Ensure errors are announced properly
4. **Verify focus management**: Test keyboard navigation flows
5. **Check dynamic content**: Test live region announcements
6. **Validate semantic markup**: Ensure proper roles and properties

### Screen Reader Testing

1. **Meaningful labels**: Provide context, not just element names
2. **State communication**: Announce loading, error, and success states
3. **Relationship clarity**: Link related content explicitly
4. **Content structure**: Use proper heading hierarchy
5. **Dynamic updates**: Announce changes appropriately

### Mobile Accessibility

1. **Touch targets**: Meet platform minimum sizes (44pt iOS, 48dp Android)
2. **Gesture alternatives**: Provide non-gesture alternatives
3. **Orientation support**: Test both portrait and landscape
4. **Platform optimization**: Use platform-specific accessibility features
5. **Voice control**: Support voice commands where appropriate

## Continuous Integration

### Automated Testing

- **Pre-commit hooks**: Run accessibility tests before commits
- **CI/CD pipeline**: Include accessibility tests in build process
- **Coverage requirements**: Maintain high accessibility test coverage
- **Regression prevention**: Prevent accessibility regressions

### Manual Testing Checklist

- [ ] VoiceOver/TalkBack navigation through all screens
- [ ] Keyboard-only navigation through entire app
- [ ] High contrast mode verification
- [ ] 200% text scaling verification
- [ ] Voice control functionality testing
- [ ] Color-blind user simulation
- [ ] Touch target size verification

## Accessibility Testing Tools

### React Native Testing Library

- **Accessibility queries**: `getByRole`, `getByLabelText`, `getByA11yLabel`
- **State verification**: `toHaveAccessibilityState`, `toHaveAccessibilityValue`
- **Property validation**: `toHaveAccessibilityLabel`, `toHaveAccessibilityHint`

### Platform Tools

- **iOS Accessibility Inspector**: Real device testing
- **Android Accessibility Scanner**: Automated accessibility checks
- **Flipper Accessibility Plugin**: Development debugging
- **React DevTools**: Component accessibility inspection

### Static Analysis

- **ESLint Plugin**: `eslint-plugin-react-native-a11y`
- **TypeScript**: Type checking for accessibility properties
- **Custom linting rules**: Project-specific accessibility requirements

## Reporting and Documentation

### Test Reports

- **Coverage reports**: Accessibility test coverage tracking
- **Compliance reports**: WCAG 2.1 AA compliance status
- **Issue tracking**: Accessibility defect management
- **Progress monitoring**: Accessibility improvement metrics

### Documentation Standards

- **Accessibility properties**: Document all accessibility attributes
- **User flows**: Document accessible user journey paths
- **Component guidelines**: Accessibility implementation standards
- **Testing procedures**: Step-by-step testing instructions

## Resources

### WCAG Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [How to Meet WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

### React Native Accessibility

- [React Native Accessibility Guide](https://reactnative.dev/docs/accessibility)
- [React Native Testing Library Accessibility](https://callstack.github.io/react-native-testing-library/docs/api#accessibility)
- [Expo Accessibility](https://docs.expo.dev/guides/accessibility/)

### Platform Guidelines

- [iOS Accessibility Guidelines](https://developer.apple.com/accessibility/)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)

This comprehensive testing suite ensures that the Tifossi app provides an excellent experience for all users, including those who rely on assistive technologies.
