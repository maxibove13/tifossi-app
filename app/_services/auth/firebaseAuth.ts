/**
 * Firebase Authentication Service - Real Implementation
 *
 * This service provides Firebase authentication using React Native Firebase.
 * Supports email/password, Apple Sign-In, and Google Sign-In authentication.
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
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
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      profilePicture: firebaseUser.photoURL,
      isEmailVerified: firebaseUser.emailVerified,
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
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await userCredential.user.getIdToken();

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
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Update display name if provided
      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }

      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await userCredential.user.getIdToken();

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
   * Google OAuth Sign-In (placeholder)
   */
  async signInWithGoogle(): Promise<AuthResult> {
    return {
      success: false,
      error: 'Google Sign-In no está configurado aún.',
    };
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

      const appleCredential = auth.AppleAuthProvider.credential(identityToken);

      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(appleCredential);

      // Update display name if provided by Apple (only on first sign-in)
      if (appleAuthRequestResponse.fullName?.givenName) {
        const displayName = [
          appleAuthRequestResponse.fullName.givenName,
          appleAuthRequestResponse.fullName.familyName,
        ]
          .filter(Boolean)
          .join(' ');

        if (displayName && !userCredential.user.displayName) {
          await userCredential.user.updateProfile({ displayName });
        }
      }

      const user = this.mapFirebaseUserToAppUser(userCredential.user);
      const token = await userCredential.user.getIdToken();

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
      await auth().signOut();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await auth().sendPasswordResetEmail(email);
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Re-authenticate user first
      const credential = auth.EmailAuthProvider.credential(
        currentUser.email!,
        credentials.currentPassword
      );
      await currentUser.reauthenticateWithCredential(credential);

      // Update password
      await currentUser.updatePassword(credentials.newPassword);

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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      await currentUser.sendEmailVerification();
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
    const firebaseUser = auth().currentUser;
    return firebaseUser ? this.mapFirebaseUserToAppUser(firebaseUser) : null;
  }

  /**
   * Get ID token
   */
  async getIdToken(forceRefresh?: boolean): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      return await currentUser.getIdToken(forceRefresh);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize auth state listener
   */
  initializeAuthStateListener(callback: (user: AppUser | null) => void): () => void {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
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
      await auth().applyActionCode(code);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password reset code and return email (simplified)
   */
  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      const email = await auth().verifyPasswordResetCode(code);
      return email;
    } catch (error) {
      throw error;
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
