/**
 * Firebase Authentication Service - Real Implementation
 *
 * This service provides Firebase authentication using React Native Firebase.
 * Supports email/password, Apple Sign-In, and Google Sign-In authentication.
 */

import {
  getAuth,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  onAuthStateChanged,
  applyActionCode,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  updateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  getIdToken as firebaseGetIdToken,
  signInWithCredential,
  GoogleAuthProvider,
  AppleAuthProvider,
  EmailAuthProvider,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  statusCodes as GoogleSigninStatusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import type { User as AppUser } from '../../_types/auth';

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
let _authInstance: ReturnType<typeof getAuth> | null = null;
const getAuthSafe = (): ReturnType<typeof getAuth> => {
  if (!_authInstance) {
    try {
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
      const userCredential = await firebaseSignInWithEmail(getAuthSafe(), email, password);
      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await firebaseGetIdToken(userCredential.user);

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
      const userCredential = await firebaseCreateUser(getAuthSafe(), email, password);

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await firebaseGetIdToken(userCredential.user);

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
      const token = await firebaseGetIdToken(userCredential.user);

      return {
        success: true,
        user,
        token,
      };
    } catch (error: any) {
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
    try {
      // Check if Apple auth is available
      const isAppleAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAppleAvailable) {
        return {
          success: false,
          error: 'Apple Sign-In no está disponible en este dispositivo',
        };
      }

      // Perform Apple sign-in
      const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create Firebase credential
      const { identityToken } = appleAuthRequestResponse;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const appleCredential = AppleAuthProvider.credential(identityToken);

      // Sign in with Firebase
      const userCredential = await signInWithCredential(getAuthSafe(), appleCredential);

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
      const token = await firebaseGetIdToken(userCredential.user);

      return {
        success: true,
        user,
        token,
      };
    } catch (error: any) {
      // Handle Apple Sign-In cancellation
      if (error.code === 'ERR_CANCELLED' || error.code === 'ERR_REQUEST_CANCELED') {
        return {
          success: false,
          error: 'Apple Sign-In fue cancelado por el usuario',
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
      await firebaseSignOut(getAuthSafe());
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firebaseSendPasswordReset(getAuthSafe(), email);
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
      await firebaseUpdatePassword(currentUser, credentials.newPassword);

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
      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      await firebaseSendEmailVerification(currentUser);
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
      const currentUser = getAuthSafe().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      return await firebaseGetIdToken(currentUser, forceRefresh);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize auth state listener
   */
  initializeAuthStateListener(callback: (user: AppUser | null) => void): () => void {
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
      const email = await firebaseVerifyPasswordResetCode(getAuthSafe(), code);
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
      await firebaseConfirmPasswordReset(getAuthSafe(), code, newPassword);
      return { success: true };
    } catch (error) {
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
