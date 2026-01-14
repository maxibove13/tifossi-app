/**
 * Firebase Authentication Service - Real Implementation
 *
 * This service provides Firebase authentication using React Native Firebase.
 * Supports email/password, Apple Sign-In, and Google Sign-In authentication.
 *
 * IMPORTANT: Uses dynamic imports to prevent native module crashes during early initialization.
 * Firebase modules are loaded lazily when first accessed, not at module load time.
 */

import { Platform } from 'react-native';

// Types are imported normally (no native code execution)
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { User as AppUser } from '../../_types/auth';

// Lazy-loaded module references
let _firebaseAuthModule: typeof import('@react-native-firebase/auth') | null = null;
let _appleAuthModule: typeof import('expo-apple-authentication') | null = null;
let _googleSigninModule: typeof import('@react-native-google-signin/google-signin') | null = null;

/**
 * Lazy load Firebase Auth module to prevent early native initialization crashes
 */
const getFirebaseAuthModule = (): typeof import('@react-native-firebase/auth') => {
  if (!_firebaseAuthModule) {
    _firebaseAuthModule = require('@react-native-firebase/auth');
  }
  return _firebaseAuthModule!;
};

/**
 * Lazy load Apple Authentication module
 */
const getAppleAuthModule = (): typeof import('expo-apple-authentication') => {
  if (!_appleAuthModule) {
    _appleAuthModule = require('expo-apple-authentication');
  }
  return _appleAuthModule!;
};

/**
 * Lazy load Google Sign-In module
 */
const getGoogleSigninModule = (): typeof import('@react-native-google-signin/google-signin') => {
  if (!_googleSigninModule) {
    _googleSigninModule = require('@react-native-google-signin/google-signin');
  }
  return _googleSigninModule!;
};

interface AuthResult {
  success: boolean;
  user?: AppUser;
  token?: string;
  error?: string;
}

interface PasswordChangeCredentials {
  currentPassword: string;
  newPassword: string;
}

// Firebase Auth error codes mapping
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/user-not-found': 'No se encontró una cuenta con este correo electrónico.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
  'auth/weak-password': 'La contraseña es demasiado débil. Elige una contraseña más fuerte.',
  'auth/operation-not-allowed': 'Esta operación no está permitida.',
  'auth/invalid-credential': 'Las credenciales proporcionadas no son válidas.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta nuevamente más tarde.',
  'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
  'auth/requires-recent-login': 'Inicia sesión nuevamente para completar esta acción.',
  'auth/invalid-action-code': 'Código de verificación inválido o expirado.',
  'auth/expired-action-code': 'El código de verificación ha expirado.',
  'auth/invalid-continue-uri': 'URL de continuación inválida.',
  'auth/unauthorized-continue-uri': 'URL de continuación no autorizada.',
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con este correo electrónico pero con credenciales de inicio de sesión diferentes.',
  ERROR_CANCELED: 'Apple Sign-In fue cancelado por el usuario.',
  ERROR_NOT_AVAILABLE: 'Apple Sign-In no está disponible en este dispositivo.',
  ERROR_INVALID_RESPONSE: 'Respuesta inválida de Apple Sign-In.',
  'apple-signin-unavailable': 'Apple Sign-In no está disponible en esta plataforma.',
  SIGN_IN_CANCELLED: 'Google Sign-In fue cancelado por el usuario.',
  IN_PROGRESS: 'Google Sign-In ya está en progreso.',
  PLAY_SERVICES_NOT_AVAILABLE: 'Google Play Services no está disponible en este dispositivo.',
  'google-signin-unavailable': 'Google Sign-In no está disponible en esta plataforma.',
  'google-signin-failed': 'Error al iniciar sesión con Google.',
};

// Lazy-initialize auth to prevent crashes if Firebase isn't ready
let _authInstance: ReturnType<typeof import('@react-native-firebase/auth').getAuth> | null = null;
const getAuthSafe = () => {
  if (!_authInstance) {
    try {
      const { getAuth } = getFirebaseAuthModule();
      _authInstance = getAuth();
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error);
      throw error;
    }
  }
  return _authInstance;
};

class FirebaseAuthService {
  private isInitialized = false;

  /**
   * Initialize Firebase Auth
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Firebase is already initialized in the config file
      this.isInitialized = true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Map Firebase user to app user format
   */
  private mapFirebaseUserToAppUser(firebaseUser: FirebaseAuthTypes.User): AppUser {
    // Determine auth provider from Firebase providerData
    const providerData = firebaseUser.providerData || [];
    let provider: 'email' | 'google' | 'apple' = 'email';

    for (const providerInfo of providerData) {
      if (providerInfo.providerId === 'google.com') {
        provider = 'google';
        break;
      }
      if (providerInfo.providerId === 'apple.com') {
        provider = 'apple';
        break;
      }
    }

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      profilePicture: firebaseUser.photoURL,
      isEmailVerified: firebaseUser.emailVerified,
      metadata: {
        provider,
      },
    };
  }

  /**
   * Handle Firebase Auth errors
   */
  private handleAuthError(error: any): string {
    const errorCode = error?.code || error?.message || 'unknown-error';
    const message =
      AUTH_ERROR_MESSAGES[errorCode] || error.message || 'Ocurrió un error inesperado.';

    return message;
  }

  /**
   * Email/Password Authentication
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { signInWithEmailAndPassword, getIdToken } = getFirebaseAuthModule();
      const userCredential = await signInWithEmailAndPassword(getAuthSafe(), email, password);
      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await getIdToken(userCredential.user);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Create account with email and password
   */
  async createUserWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> {
    try {
      const { createUserWithEmailAndPassword, updateProfile, getIdToken } = getFirebaseAuthModule();
      const userCredential = await createUserWithEmailAndPassword(getAuthSafe(), email, password);

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await getIdToken(userCredential.user);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Google OAuth Sign-In
   *
   * IMPORTANT - PRODUCTION CREDENTIALS REQUIRED:
   * The webClientId below is a placeholder and MUST be replaced before deployment.
   *
   * How to get the production webClientId:
   * 1. Go to Firebase Console: https://console.firebase.google.com
   * 2. Select your project
   * 3. Go to Project Settings > General
   * 4. Scroll down to "Your apps" section
   * 5. Find the Web App or create one if it doesn't exist
   * 6. Copy the "Web Client ID" (format: XXXXX.apps.googleusercontent.com)
   * 7. Replace the placeholder below with your actual Web Client ID
   *
   * Note: This is different from the Android/iOS client IDs in google-services.json
   * and GoogleService-Info.plist. You need the Web Client ID specifically.
   *
   * See docs/guides/FIREBASE_SETUP_GUIDE.md for detailed instructions.
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { GoogleSignin } = getGoogleSigninModule();
      const { signInWithCredential, GoogleAuthProvider, updateProfile, getIdToken } =
        getFirebaseAuthModule();

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: '351272853841-24k61p1j3a3cas6ejhb3t9nuhjclp9uu.apps.googleusercontent.com',
        offlineAccess: false,
      });

      // Check if Google Play Services is available (Android only)
      // Note: hasPlayServices() only works on Android and will fail on iOS
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Get Google credentials
      const userInfo = await GoogleSignin.signIn();

      // Check if sign-in was successful (not cancelled)
      if (userInfo.type === 'cancelled') {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.SIGN_IN_CANCELLED,
        };
      }

      if (!userInfo.data.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential from Google ID token
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

      // Sign in with Firebase using Google credential
      const userCredential = await signInWithCredential(getAuthSafe(), googleCredential);

      // Update display name if provided by Google (only on first sign-in)
      if (userInfo.data.user.name && !userCredential.user.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userInfo.data.user.name,
        });
      }

      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await getIdToken(userCredential.user);

      return {
        success: true,
        user,
        token,
      };
    } catch (error: any) {
      const { statusCodes: GoogleSigninStatusCodes } = getGoogleSigninModule();

      // Handle Google Sign-In cancellation
      if (error.code === GoogleSigninStatusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.SIGN_IN_CANCELLED,
        };
      }

      // Handle Google Play Services not available
      if (error.code === GoogleSigninStatusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.PLAY_SERVICES_NOT_AVAILABLE,
        };
      }

      // Handle sign-in already in progress
      if (error.code === GoogleSigninStatusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: AUTH_ERROR_MESSAGES.IN_PROGRESS,
        };
      }

      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Apple Sign-In
   */
  async signInWithApple(): Promise<AuthResult> {
    console.log('[Apple Sign-In] Starting...');
    try {
      const AppleAuthentication = getAppleAuthModule();
      const { signInWithCredential, AppleAuthProvider, updateProfile, getIdToken } =
        getFirebaseAuthModule();

      // Check if Apple auth is available
      console.log('[Apple Sign-In] Checking availability...');
      const isAppleAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('[Apple Sign-In] Available:', isAppleAvailable);
      if (!isAppleAvailable) {
        return {
          success: false,
          error: 'Apple Sign-In no está disponible en este dispositivo',
        };
      }

      // Perform Apple sign-in
      console.log('[Apple Sign-In] Requesting Apple authentication...');
      const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('[Apple Sign-In] Apple response received:', {
        user: appleAuthRequestResponse.user?.substring(0, 10) + '...',
        email: appleAuthRequestResponse.email,
        hasIdentityToken: !!appleAuthRequestResponse.identityToken,
        identityTokenLength: appleAuthRequestResponse.identityToken?.length,
        hasAuthorizationCode: !!appleAuthRequestResponse.authorizationCode,
        fullName: appleAuthRequestResponse.fullName,
      });

      // Create Firebase credential
      const { identityToken } = appleAuthRequestResponse;

      if (!identityToken) {
        console.log('[Apple Sign-In] ERROR: No identity token received');
        throw new Error('No identity token received from Apple');
      }

      console.log('[Apple Sign-In] Creating Firebase credential with identity token...');
      const appleCredential = AppleAuthProvider.credential(identityToken);
      console.log('[Apple Sign-In] Firebase credential created, signing in...');

      // Sign in with Firebase
      const userCredential = await signInWithCredential(getAuthSafe(), appleCredential);
      console.log('[Apple Sign-In] Firebase sign-in successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
      });

      // Update display name if provided by Apple (only on first sign-in)
      if (appleAuthRequestResponse.fullName?.givenName) {
        const displayName = [
          appleAuthRequestResponse.fullName.givenName,
          appleAuthRequestResponse.fullName.familyName,
        ]
          .filter(Boolean)
          .join(' ');

        if (displayName && !userCredential.user.displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }

      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await getIdToken(userCredential.user);
      console.log('[Apple Sign-In] Complete success, token length:', token?.length);

      return {
        success: true,
        user,
        token,
      };
    } catch (error: any) {
      console.log('[Apple Sign-In] ERROR:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // Handle Apple Sign-In cancellation (multiple possible codes/messages)
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      const isCancelled =
        errorCode === 'ERR_CANCELLED' ||
        errorCode === 'ERR_CANCELED' ||
        errorCode === 'ERR_REQUEST_CANCELED' ||
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('unknown reason');

      if (isCancelled) {
        return {
          success: false,
          error: 'cancelled', // Normalized cancel indicator
        };
      }

      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOutUser(): Promise<void> {
    try {
      const { signOut } = getFirebaseAuthModule();
      await signOut(getAuthSafe());
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { sendPasswordResetEmail } = getFirebaseAuthModule();
      const auth = getAuthSafe();
      auth.languageCode = 'es';
      await sendPasswordResetEmail(auth, email, {
        url: 'https://tifossi-strapi-backend.onrender.com/api/auth/email-action',
        handleCodeInApp: true,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    credentials: PasswordChangeCredentials
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
        getFirebaseAuthModule();
      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        credentials.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, credentials.newPassword);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<{ success: boolean; error?: string }> {
    try {
      const { sendEmailVerification } = getFirebaseAuthModule();
      const auth = getAuthSafe();
      auth.languageCode = 'es';
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      await sendEmailVerification(currentUser, {
        url: 'https://tifossi-strapi-backend.onrender.com/api/auth/email-action',
        handleCodeInApp: true,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Get current app user
   */
  getCurrentAppUser(): AppUser | null {
    const firebaseUser = getAuthSafe().currentUser;
    return firebaseUser ? this.mapFirebaseUserToAppUser(firebaseUser) : null;
  }

  /**
   * Get ID token
   */
  async getIdToken(forceRefresh?: boolean): Promise<string> {
    try {
      const { getIdToken } = getFirebaseAuthModule();
      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      return await getIdToken(currentUser, forceRefresh);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize auth state listener
   */
  initializeAuthStateListener(callback: (user: AppUser | null) => void): () => void {
    const { onAuthStateChanged } = getFirebaseAuthModule();
    const unsubscribe = onAuthStateChanged(getAuthSafe(), (firebaseUser) => {
      const appUser = firebaseUser ? this.mapFirebaseUserToAppUser(firebaseUser) : null;
      callback(appUser);
    });

    // Return cleanup function
    return unsubscribe;
  }

  /**
   * Verify email verification code (simplified)
   */
  async verifyEmailCode(code: string): Promise<void> {
    try {
      const { applyActionCode } = getFirebaseAuthModule();
      await applyActionCode(getAuthSafe(), code);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password reset code and return email (simplified)
   */
  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      const { verifyPasswordResetCode } = getFirebaseAuthModule();
      const email = await verifyPasswordResetCode(getAuthSafe(), code);
      return email;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmPasswordReset(
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { confirmPasswordReset } = getFirebaseAuthModule();
      await confirmPasswordReset(getAuthSafe(), code, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Delete the current Firebase user account
   */
  async deleteCurrentUser(): Promise<{ success: boolean; error?: string }> {
    try {
      const { deleteUser } = getFirebaseAuthModule();
      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      await deleteUser(currentUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Reauthenticate current user with email/password
   */
  async reauthenticateWithEmail(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { EmailAuthProvider, reauthenticateWithCredential } = getFirebaseAuthModule();
      const currentUser = getAuthSafe().currentUser;
      if (!currentUser || !currentUser.email) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Reauthenticate current user with Google
   */
  async reauthenticateWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const { GoogleSignin } = getGoogleSigninModule();
      const { reauthenticateWithCredential, GoogleAuthProvider } = getFirebaseAuthModule();

      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: '351272853841-24k61p1j3a3cas6ejhb3t9nuhjclp9uu.apps.googleusercontent.com',
        offlineAccess: false,
      });

      // Check if Google Play Services is available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Get Google credentials
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.type === 'cancelled') {
        return { success: false, error: 'cancelled' };
      }

      if (!userInfo.data.idToken) {
        return { success: false, error: 'No se recibió token de Google' };
      }

      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      await reauthenticateWithCredential(currentUser, googleCredential);

      return { success: true };
    } catch (error: any) {
      const { statusCodes: GoogleSigninStatusCodes } = getGoogleSigninModule();

      if (error.code === GoogleSigninStatusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'cancelled' };
      }

      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Reauthenticate current user with Apple
   * Returns authorizationCode for token revocation
   */
  async reauthenticateWithApple(): Promise<{
    success: boolean;
    error?: string;
    authorizationCode?: string;
  }> {
    try {
      const AppleAuthentication = getAppleAuthModule();
      const { reauthenticateWithCredential, AppleAuthProvider } = getFirebaseAuthModule();

      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      const isAppleAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAppleAvailable) {
        return { success: false, error: 'Apple Sign-In no está disponible en este dispositivo' };
      }

      const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, authorizationCode } = appleAuthRequestResponse;

      if (!identityToken) {
        return { success: false, error: 'No se recibió token de Apple' };
      }

      const appleCredential = AppleAuthProvider.credential(identityToken);
      await reauthenticateWithCredential(currentUser, appleCredential);

      return {
        success: true,
        authorizationCode: authorizationCode || undefined,
      };
    } catch (error: any) {
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      const isCancelled =
        errorCode === 'ERR_CANCELLED' ||
        errorCode === 'ERR_CANCELED' ||
        errorCode === 'ERR_REQUEST_CANCELED' ||
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('unknown reason');

      if (isCancelled) {
        return { success: false, error: 'cancelled' };
      }

      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const firebaseAuth = new FirebaseAuthService();

// Export convenience methods
export const initializeFirebaseAuth = () => firebaseAuth.initialize();
export const signInWithEmail = (email: string, password: string) =>
  firebaseAuth.signInWithEmail(email, password);
export const createUserWithEmail = (email: string, password: string, displayName?: string) =>
  firebaseAuth.createUserWithEmail(email, password, displayName);
export const signInWithGoogle = () => firebaseAuth.signInWithGoogle();
export const signInWithApple = () => firebaseAuth.signInWithApple();
export const signOutUser = () => firebaseAuth.signOutUser();
export const sendPasswordReset = (email: string) => firebaseAuth.sendPasswordReset(email);
export const changePassword = (credentials: PasswordChangeCredentials) =>
  firebaseAuth.changePassword(credentials);
export const sendEmailVerificationToCurrentUser = () => firebaseAuth.sendEmailVerification();
export const getCurrentUser = () => firebaseAuth.getCurrentAppUser();
export const getIdToken = (forceRefresh?: boolean) => firebaseAuth.getIdToken(forceRefresh);
export const initializeAuthStateListener = (callback: (user: AppUser | null) => void) =>
  firebaseAuth.initializeAuthStateListener(callback);

// Add default export to fix router warnings
const utilityExport = {
  name: 'FirebaseAuth',
  version: '1.0.0',
  service: firebaseAuth,
};

export default utilityExport;
