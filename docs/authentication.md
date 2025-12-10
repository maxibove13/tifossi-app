# Tifossi Authentication System

## Overview

The Tifossi authentication system provides comprehensive user account management through a token-based authentication flow. The system is designed to be secure, maintainable, and ready for integration with backend services. This document outlines the current implementation status, architecture, user flows, and integration points.

## Current Implementation Status

The authentication system is **implemented** with the following components:

| Component              | Status         | Notes                                                     |
| ---------------------- | -------------- | --------------------------------------------------------- |
| Authentication Store   | ✅ Implemented | Token storage, state management, and mock API integration |
| Login UI               | ✅ Implemented | Form with validation, error handling                      |
| Signup UI              | ✅ Implemented | Registration form with terms checkbox and validation      |
| Password Reset UI      | ✅ Implemented | Form for initiating password reset                        |
| Auth Prompt            | ✅ Implemented | Reusable component for non-authenticated states           |
| Profile UI             | ✅ Implemented | Displays user info when authenticated                     |
| Profile Picture Editor | ✅ Implemented | Component for uploading/editing profile photos            |
| Password Change        | ✅ Implemented | Secure password change screen with validation             |
| Logout UI              | ✅ Implemented | Explicit logout with confirmation dialog                  |
| Email Verification     | ✅ Implemented | Email verification flow with resend option                |
| Terms & Privacy        | ✅ Implemented | Legal screens and signup integration                      |
| Backend Integration    | 🚧 Pending     | Currently using mock API implementation                   |
| Token Refresh          | 🚧 Pending     | Not yet implemented                                       |
| Session Persistence    | ✅ Implemented | Token stored in SecureStore                               |

## Architecture

### Components and Files

1. **Auth Store** (`app/_stores/authStore.ts`)
   - Core state management for authentication
   - Implements Zustand store with persistence middleware
   - Handles token storage via SecureStore
   - Provides new auth methods (change password, update profile picture, email verification)
   - Mock API integration for all auth operations

2. **Auth Types** (`app/_types/auth.ts`)
   - Type definitions for User and AuthState
   - Extended with email verification, password change types
   - Provides interfaces for all auth-related data structures

3. **Auth UI Screens** (`app/auth/`)
   - `login.tsx`: User login screen
   - `signup.tsx`: User registration screen with terms acceptance
   - `forgot-password.tsx`: Password reset request
   - `verify-email.tsx`: Email verification instructions
   - `verify-success.tsx`: Verification success confirmation
   - `_layout.tsx`: Layout wrapper for auth screens

4. **Profile Screens** (`app/profile/`)
   - `change-password.tsx`: Password change form

5. **Legal Screens** (`app/legal/`)
   - `terms.tsx`: Terms and conditions
   - `privacy.tsx`: Privacy policy

6. **Auth Components** (`app/_components/auth/`)
   - `AuthPrompt.tsx`: Reusable component for non-authenticated states
   - `ProfilePictureEditor.tsx`: Reusable profile picture editor

7. **Mock API** (`app/_services/api/mockApi.ts`)
   - Simulates authentication API endpoints
   - Extended with new auth operations (change password, update profile picture, email verification)
   - Provides mock user data and token handling
   - Implements delay for realistic behavior

### Authentication Providers

The Tifossi authentication system supports multiple authentication providers:

| Provider       | Status         | Platform Support                     | Notes                                 |
| -------------- | -------------- | ------------------------------------ | ------------------------------------- |
| Email/Password | ✅ Implemented | iOS, Android, Web                    | Traditional credential authentication |
| Google Sign-In | ✅ Implemented | iOS, Android, Web                    | OAuth 2.0 with Google                 |
| Apple Sign-In  | ✅ Implemented | iOS (Native), Android (Web fallback) | Required for App Store compliance     |

#### Apple Sign-In Integration

Apple Sign-In is fully integrated with the existing authentication system and provides:

- **Native iOS Experience**: Uses `expo-apple-authentication` for seamless iOS integration
- **Privacy Protection**: Supports Apple's private email relay feature
- **App Store Compliance**: Required for apps offering third-party authentication
- **Firebase Integration**: Apple credentials are exchanged for Firebase tokens
- **Multi-Provider Support**: Users can link Apple Sign-In with existing accounts

For detailed Apple Sign-In implementation information, see [Apple Sign-In Implementation Guide](./apple-signin-implementation.md).

### State Management Flow

The authentication state is managed through the `authStore.ts` Zustand store with the following state structure:

```typescript
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isChangingPassword?: boolean;
  isUploadingProfilePicture?: boolean;
  isVerifyingEmail?: boolean;

  // Authentication methods
  initializeAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  linkWithApple: () => Promise<void>;
  logout: () => Promise<void>;

  // New methods for additional functionality
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;

  // Apple Sign-In utility methods
  isAppleSignInAvailable: () => Promise<boolean>;
  getAppleCredentialState: (userId: string) => Promise<number>;
}
```

Key features of the enhanced auth store:

1. **Token Persistence**: Tokens are securely stored in `expo-secure-store`
2. **Automatic Initialization**: Auth state is initialized on app launch
3. **Status Tracking**: Provides loading/error states during auth operations
4. **Cross-Store Integration**: Triggers cart/favorites synchronization after login
5. **Extended Authentication Operations**: Support for password change, profile picture, and email verification
6. **Loading State Indicators**: Separate loading states for different auth operations

## User Flows

### Authentication Initialization

On application startup:

1. The root layout component initializes auth state
2. The authStore checks SecureStore for an existing token
3. If a token exists, it's validated with the backend
4. User data is loaded if token is valid
5. Auth state is updated with the authenticated user
6. Cart and favorites data are synchronized

### Login Flow

1. User navigates to login screen
2. User enters email and password
3. Client-side validation checks credentials format
4. Credentials are sent to the backend (currently mocked)
5. On success:
   - Auth token is stored in SecureStore
   - User data is saved in auth state
   - Cart and favorites are synchronized
   - User is redirected to the profile screen
6. On failure:
   - Error message is displayed
   - User remains on login screen

### Registration Flow

1. User navigates to signup screen
2. User enters name, email, password, and confirmation
3. User must accept terms and privacy policy via checkbox
4. Client-side validation checks the form and terms acceptance
5. Registration data is sent to the backend (currently mocked)
6. On success:
   - Auth token is stored in SecureStore
   - User is redirected to email verification screen
7. On failure:
   - Error message is displayed
   - User remains on signup screen

### Email Verification Flow

1. After signup, user is shown the verification screen
2. Screen displays the email address and verification instructions
3. User can request a new verification email
4. Once verified, user is shown success screen
5. User can continue to their profile

### Password Reset Flow

1. User navigates to forgot-password screen
2. User enters email
3. Client-side validation checks email format
4. Reset request is submitted (currently mocked)
5. Confirmation message is displayed
6. User is redirected to login screen

### Password Change Flow

1. Authenticated user navigates to password change screen from profile
2. User enters current password and new password (with confirmation)
3. Client-side validation checks password match and requirements
4. Password change request is submitted (currently mocked)
5. On success:
   - Success message is displayed
   - User is returned to profile screen
6. On failure:
   - Error message is displayed
   - User remains on password change screen

### Profile Picture Management

1. User taps on profile picture in profile screen
2. Image action sheet appears with options:
   - Select photo from gallery
   - Remove photo
3. If selecting a photo:
   - Image picker opens for selection/cropping
   - Selected image is uploaded (currently mocked)
   - Profile picture is updated in UI
4. If removing photo:
   - Confirmation dialog appears
   - Profile picture is removed from UI

### Terms & Privacy Policy

1. Signup form includes terms checkbox
2. User can tap on links to view full terms and privacy policy
3. Terms/privacy screens display full legal text
4. User can accept and return to signup flow

### Apple Sign-In Flow

1. User taps "Sign in with Apple" button
2. System checks if Apple Sign-In is available on device
3. If available, native Apple authentication dialog appears
4. User authenticates using Touch ID, Face ID, or Apple ID password
5. Apple returns identity token and authorization code
6. Credentials are exchanged with Firebase for custom token
7. On success:
   - User data is extracted from Apple credentials
   - Profile information is stored (respecting privacy choices)
   - Auth state is updated with authenticated user
   - User is redirected to authenticated experience
8. On failure:
   - Appropriate error message is displayed
   - User remains on authentication screen

### Apple Account Linking Flow

1. Authenticated user navigates to account settings
2. User taps "Link Apple Account" option
3. Apple authentication dialog appears
4. User completes Apple Sign-In process
5. Apple credentials are linked to existing Firebase account
6. Success confirmation is displayed
7. User can now authenticate using either method

### Logout Flow

1. User taps "Cerrar Sesión" in profile screen
2. Confirmation dialog appears
3. If confirmed, logout process starts:
   - Token is invalidated with the backend (currently mocked)
   - Token is removed from SecureStore
   - Auth state is reset to non-authenticated values
   - UI updates to reflect logged-out state
4. If cancelled, dialog dismisses with no changes

## Integration with Backend

Currently, the authentication system uses a mock implementation in `mockApi.ts`. The following endpoints are simulated:

- **login**: Accepts email/password, returns token and user data
- **register**: Accepts registration data, returns token and user data
- **loginWithGoogle**: Handles Google OAuth authentication
- **loginWithApple**: Exchanges Apple identity token for Firebase token
- **linkWithApple**: Links Apple credentials to existing account
- **validateToken**: Validates a token, returns user data
- **logout**: Invalidates a token
- **changePassword**: Updates user password
- **updateProfilePicture**: Handles profile image upload
- **resendVerificationEmail**: Triggers a new verification email
- **verifyEmail**: Verifies an email with a verification code

For future backend integration, these mock endpoints should be replaced with real API calls, maintaining the same interface.

## UI Components

### Auth Prompt Component

The `AuthPrompt.tsx` component provides a reusable UI for prompting users to authenticate. Features:

- Custom messaging
- Configurable login/signup button text
- Background image with overlay
- Customizable styling

Usage:

```tsx
<ReusableAuthPrompt message="Aún no iniciaste sesión." style={styles.authPromptStyle} />
```

### Profile Picture Editor Component

The `ProfilePictureEditor.tsx` component provides a reusable UI for editing profile pictures:

- Upload/edit profile pictures
- Image selection with action sheet
- Remove existing photos
- Upload indicator with loading state
- Circular cropping and display

Usage:

```tsx
<ProfilePictureEditor
  currentImage={userProfileImage}
  size={80}
  onImageChange={handleProfilePictureChange}
/>
```

### Auth Screens

All authentication screens share common styling and behavior:

1. **Common Features**:
   - Consistent header with title and close button
   - Form validation with error messages
   - Action buttons at screen bottom
   - Navigation between auth screens

2. **Login Screen** (`login.tsx`):
   - Email and password inputs
   - "Forgot password" option
   - "Create account" navigation

3. **Signup Screen** (`signup.tsx`):
   - Name, email, password inputs
   - Password confirmation
   - Terms and privacy policy acceptance
   - "Already have account" navigation

4. **Forgot Password Screen** (`forgot-password.tsx`):
   - Email input
   - Explanatory text
   - Confirmation after submission

5. **Email Verification Screen** (`verify-email.tsx`):
   - Email display with verification instructions
   - "Resend email" option
   - Navigation to login

6. **Verification Success Screen** (`verify-success.tsx`):
   - Success confirmation
   - Continue to profile option

### Legal and Profile Screens

1. **Terms and Conditions** (`legal/terms.tsx`):
   - Full terms of service text
   - Accept and return button

2. **Privacy Policy** (`legal/privacy.tsx`):
   - Full privacy policy text
   - Accept and return button

3. **Password Change** (`profile/change-password.tsx`):
   - Current password input
   - New password input with confirmation
   - Validation for password match
   - Save changes button

## Profile Integration

The profile screen (`app/(tabs)/profile.tsx`) integrates with the authentication state to show:

1. **Logged-out state**:
   - Auth prompt component for non-authenticated users
   - Login/signup buttons

2. **Logged-in state**:
   - User profile information (name, email)
   - Profile picture editor component
   - Action buttons for account-related features
   - Change password option
   - Explicit logout button with confirmation

## Development Features

For easier development and testing, the auth system includes:

- `dev_toggleLogin()`: Method to toggle authentication state
- Development-only toggle button in Profile screen
- Mock user for testing authenticated state

## Apple Sign-In Error Codes

The system includes comprehensive Spanish error messages for Apple Sign-In:

```typescript
export const APPLE_AUTH_ERRORS_ES = {
  ERROR_CANCELED: 'Inicio de sesión cancelado',
  ERROR_NOT_AVAILABLE: 'Apple Sign-In no está disponible en este dispositivo',
  ERROR_INVALID_RESPONSE: 'Respuesta inválida de Apple',
  ERROR_UNKNOWN: 'Error desconocido con Apple Sign-In',
  ERROR_NETWORK: 'Error de conexión. Verifica tu conexión a internet',
  ERROR_USER_NOT_FOUND: 'Usuario no encontrado',
  ERROR_INVALID_CREDENTIALS: 'Credenciales inválidas',
  ERROR_ACCOUNT_DISABLED: 'La cuenta está deshabilitada',
  ERROR_TOO_MANY_REQUESTS: 'Demasiados intentos. Intenta más tarde',
  ERROR_AUTHORIZATION_FAILED: 'La autorización con Apple falló',
  ERROR_EMAIL_ALREADY_IN_USE: 'Este email ya está en uso con otra cuenta',
};
```

These error messages are automatically displayed to users when Apple Sign-In encounters issues, providing clear feedback in Spanish for the target audience.

## Testing Authentication

To test the authentication flow:

1. **Login with test account**:
   - Email: `test@tifossi.com`
   - Password: `password`

2. **Email Verification**:
   - Code `123456` is accepted as valid in the mock implementation

3. **Apple Sign-In Testing**:
   - Requires development build or physical iOS device
   - Mock implementation available for Expo Go testing
   - Test both first-time and returning user scenarios

4. **Development toggle**:
   - Use the "DEV: Toggle Login" button on the Profile screen
   - This bypasses the actual API calls for quick testing

## Integration with Other Stores

The authentication system has integration points with:

1. **Cart Store** (`cartStore.ts`):
   - Sync method called after successful login
   - Potential for clearing cart on logout

2. **Favorites Store** (`favoritesStore.ts`):
   - Sync method called after successful login
   - Potential for clearing favorites on logout

## Security Considerations

Current security measures:

1. **Secure Token Storage**:
   - Uses `expo-secure-store` for encrypted token storage
   - Tokens are not accessible to other applications

2. **Validation**:
   - Client-side form validation
   - Password confirmation matching
   - Terms acceptance requirement
   - Token validation on initialization

3. **Authentication Flow**:
   - Email verification after signup
   - Secure password change requiring current password
   - Explicit logout with confirmation

4. **Public Endpoint Security**:
   The HTTP client includes intelligent public endpoint detection to prevent auth token leakage and 401 errors on public endpoints:

   **Public Endpoints (no auth token sent):**
   - `/auth/local` - Login endpoint
   - `/auth/local/register` - Registration endpoint
   - `/products` - Product catalog (public browsing)
   - `/categories` - Category listing
   - `/store-locations` - Store locations
   - `/app-settings` - App configuration

   **Protected Endpoints (auth token required):**
   - `/auth/logout` - Requires valid token to logout
   - `/auth/change-password` - Requires authentication
   - `/users/me` - User profile (GET only, built-in Strapi endpoint)
   - `/user-profile/me` - Update profile, cart, favorites (PUT, custom endpoint)
   - `/orders` - Order management
   - `/payment/*` - Payment operations (supports Firebase tokens via custom policy)

   This system prevents common issues where expired/invalid tokens would cause 401 errors on public endpoints that should work without authentication.

5. **URL Validation**:
   The HTTP client validates all URLs before making requests to prevent common mistakes:
   - Rejects absolute URLs (must use relative paths)
   - Rejects paths missing leading slash
   - Rejects paths with `/api/` prefix (prevents double `/api/api/...` paths)

Pending security enhancements:

1. **Token Refresh Mechanism**:
   - Implementation of token refresh flow
   - Handling expired tokens during sessions

2. **Session Expiration**:
   - Proper handling of expired sessions
   - Automatic logout on token expiration

## Future Enhancements

Planned improvements to the authentication system:

1. **Backend Integration**:
   - Replace mock API with real backend endpoints
   - Implement proper error handling for API failures
   - Add retry mechanisms for network failures

2. **Enhanced Security**:
   - Token refresh mechanism
   - Session timeout handling
   - Biometric authentication option (Face ID/Touch ID)
   - Improved password strength requirements
   - Password strength visual indicator
   - Multi-factor authentication options

3. **Extended Social Login**:
   - Facebook login integration
   - LinkedIn/Twitter authentication options
   - Enhanced account linking between providers
   - Social profile synchronization

4. **Additional User Management**:
   - Account deletion workflow with confirmation
   - Multi-device session management and device list
   - User preferences storage
   - Remember Me functionality for persistent sessions
   - Email change with verification
   - Account recovery options beyond password reset

5. **User Experience Improvements**:
   - Development mode toggle to bypass email verification
   - Push notification integration for authentication events
   - Offline authentication capabilities
   - Improved animation transitions between auth states
   - Progressive form validation with real-time feedback

6. **Expanded Legal Components**:
   - Age verification for regulatory compliance
   - Region-specific legal disclosures
   - More granular consent management
   - Legal updates notification and re-acceptance

## Related Documentation

For further information on the authentication implementation and related systems:

- [State Management](./state_management.md) - Overall state management strategy
- [App Structure](./app_structure.md) - Application structure overview
- [Local State Management](./local_state_management.md) - Client-side state management details
- [Features](./features.md) - Feature overview including authentication

## Conclusion

The Tifossi authentication system provides a comprehensive solution for user account management with robust security features, a well-structured user flow, and a complete set of UI components. The implementation follows best practices for secure authentication while providing a user-friendly experience.

The current implementation uses a mock API layer that can be easily replaced with real backend integration when needed, maintaining the same interface and user experience. The authentication state is managed through a Zustand store that provides clear state tracking and persistence between sessions.

With the addition of email verification, terms acceptance, profile picture management, password change, and explicit logout, the authentication system now offers a complete set of features for a production-ready e-commerce application.
