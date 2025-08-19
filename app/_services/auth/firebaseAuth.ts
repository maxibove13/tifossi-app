/**
 * Firebase Authentication Service - Mock Implementation
 *
 * This is a mock implementation until Firebase is properly configured.
 * All Firebase methods will throw errors with clear messages indicating
 * that Firebase is not configured.
 */

import type { User as AppUser } from '../../_types/auth';

// Mock Firebase types
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface Auth {
  currentUser: FirebaseUser | null;
}

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
  'auth/invalid-email': 'Invalid email address format.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
  'auth/operation-not-allowed': 'This operation is not allowed.',
  'auth/invalid-credential': 'Invalid credentials provided.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/requires-recent-login': 'Please log in again to complete this action.',
  'auth/invalid-action-code': 'Invalid or expired verification code.',
  'auth/expired-action-code': 'Verification code has expired.',
  'auth/invalid-continue-uri': 'Invalid continue URL.',
  'auth/unauthorized-continue-uri': 'Unauthorized continue URL.',
};

class FirebaseAuthService {
  private isInitialized = false;
  private mockAuth: Auth = { currentUser: null };

  /**
   * Initialize Firebase Auth
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.warn('[Firebase Auth] Firebase is not configured. Using mock implementation.');
    this.isInitialized = true;
  }

  /**
   * Get Firebase Auth instance (mock)
   */
  private getAuth(): Auth {
    return this.mockAuth;
  }

  /**
   * Map Firebase user to app user format
   */
  private mapFirebaseUserToAppUser(firebaseUser: FirebaseUser): AppUser {
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
  private handleAuthError(error: any): Error {
    const errorCode = error?.code || error?.message || 'unknown-error';
    const message =
      AUTH_ERROR_MESSAGES[errorCode] || error.message || 'An unexpected error occurred.';

    console.error('[Firebase Auth] Error:', errorCode, message);
    return new Error(message);
  }

  /**
   * Email/Password Authentication
   */
  async signInWithEmail(_email: string, _password: string): Promise<AuthResult> {
    console.warn('[Firebase Auth] signInWithEmail called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured. Please use the mock API instead.',
    };
  }

  /**
   * Create account with email and password
   */
  async createUserWithEmail(
    _email: string,
    _password: string,
    _displayName?: string
  ): Promise<AuthResult> {
    console.warn('[Firebase Auth] createUserWithEmail called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured. Please use the mock API instead.',
    };
  }

  /**
   * Google OAuth Sign-In
   */
  async signInWithGoogle(): Promise<AuthResult> {
    console.warn('[Firebase Auth] signInWithGoogle called but Firebase is not configured.');
    return {
      success: false,
      error: 'Google Sign-In is not configured.',
    };
  }

  /**
   * Sign out current user
   */
  async signOutUser(): Promise<void> {
    console.log('[Firebase Auth] signOutUser called - clearing mock auth state.');
    this.mockAuth.currentUser = null;
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(_email: string): Promise<{ success: boolean; error?: string }> {
    console.warn('[Firebase Auth] sendPasswordReset called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured.',
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    _credentials: PasswordChangeCredentials
  ): Promise<{ success: boolean; error?: string }> {
    console.warn('[Firebase Auth] changePassword called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured.',
    };
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<{ success: boolean; error?: string }> {
    console.warn('[Firebase Auth] sendEmailVerification called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured.',
    };
  }

  /**
   * Get current app user
   */
  getCurrentAppUser(): AppUser | null {
    const firebaseUser = this.mockAuth.currentUser;
    return firebaseUser ? this.mapFirebaseUserToAppUser(firebaseUser) : null;
  }

  /**
   * Get ID token
   */
  async getIdToken(_forceRefresh?: boolean): Promise<string> {
    console.warn('[Firebase Auth] getIdToken called but Firebase is not configured.');
    return 'mock-firebase-token';
  }

  /**
   * Initialize auth state listener (mock)
   */
  initializeAuthStateListener(_callback: (user: AppUser | null) => void): () => void {
    console.log('[Firebase Auth] Auth state listener initialized (mock).');

    // Return a cleanup function
    return () => {
      console.log('[Firebase Auth] Auth state listener cleaned up.');
    };
  }

  /**
   * Verify email verification code
   */
  async verifyEmailCode(_code: string): Promise<{ success: boolean; error?: string }> {
    console.warn('[Firebase Auth] verifyEmailCode called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured.',
    };
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(_code: string): Promise<{ success: boolean; error?: string }> {
    console.warn('[Firebase Auth] verifyPasswordResetCode called but Firebase is not configured.');
    return {
      success: false,
      error: 'Firebase authentication is not configured.',
    };
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
export const signOutUser = () => firebaseAuth.signOutUser();
export const sendPasswordReset = (email: string) => firebaseAuth.sendPasswordReset(email);
export const changePassword = (credentials: PasswordChangeCredentials) =>
  firebaseAuth.changePassword(credentials);
export const sendEmailVerificationToCurrentUser = () => firebaseAuth.sendEmailVerification();
export const getCurrentUser = () => firebaseAuth.getCurrentAppUser();
export const getIdToken = (forceRefresh?: boolean) => firebaseAuth.getIdToken(forceRefresh);

// Add default export to fix router warnings
const utilityExport = {
  name: 'FirebaseAuth',
  version: '1.0.0',
  service: firebaseAuth,
};

export default utilityExport;
