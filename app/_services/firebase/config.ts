/**
 * Firebase Configuration - Mock Implementation
 *
 * This is a mock implementation until Firebase is properly configured.
 * All Firebase services will return mock instances.
 */

// Mock Firebase types
type FirebaseApp = object;
type Auth = object;
type Firestore = object;

// Firebase configuration constants
const FIREBASE_CONFIG = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-auth-domain',
  projectId: 'mock-project-id',
  storageBucket: 'mock-storage-bucket',
  messagingSenderId: 'mock-sender-id',
  appId: 'mock-app-id',
};

const GOOGLE_SIGNIN_CONFIG = {
  webClientId: 'mock-web-client-id',
  iosClientId: 'mock-ios-client-id',
  scopes: ['profile', 'email'],
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
};

class FirebaseConfigService {
  private isInitialized = false;
  private mockApp: FirebaseApp = {};
  private mockAuth: Auth = {};
  private mockFirestore: Firestore = {};

  /**
   * Initialize Firebase
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Firebase] Already initialized');
      return;
    }

    try {
      console.warn('[Firebase] Using mock Firebase implementation - Firebase not configured');
      this.isInitialized = true;
      console.log('[Firebase] Mock initialization completed');
    } catch (error) {
      console.error('[Firebase] Mock initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get Firebase app instance (mock)
   */
  getApp(): FirebaseApp {
    if (!this.isInitialized) {
      console.warn('[Firebase] Firebase not initialized, returning mock app');
    }
    return this.mockApp;
  }

  /**
   * Get Firebase Auth instance (mock)
   */
  getAuth(): Auth {
    if (!this.isInitialized) {
      console.warn('[Firebase] Firebase not initialized, returning mock auth');
    }
    return this.mockAuth;
  }

  /**
   * Get Firestore instance (mock)
   */
  getFirestore(): Firestore {
    if (!this.isInitialized) {
      console.warn('[Firebase] Firebase not initialized, returning mock firestore');
    }
    return this.mockFirestore;
  }

  /**
   * Check if Firebase is initialized
   */
  isFirebaseInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Firebase configuration
   */
  getFirebaseConfig() {
    return FIREBASE_CONFIG;
  }

  /**
   * Get Google Sign-In configuration
   */
  getGoogleSignInConfig() {
    return GOOGLE_SIGNIN_CONFIG;
  }

  /**
   * Reset Firebase (for testing)
   */
  reset(): void {
    console.log('[Firebase] Resetting mock Firebase configuration');
    this.isInitialized = false;
    this.mockApp = {};
    this.mockAuth = {};
    this.mockFirestore = {};
  }
}

// Create singleton instance
const firebaseConfig = new FirebaseConfigService();

// Export convenience methods
export const initializeFirebase = () => firebaseConfig.initialize();
export const getFirebaseAuth = () => firebaseConfig.getAuth();
export const getFirebaseFirestore = () => firebaseConfig.getFirestore();
export const getFirebaseApp = () => firebaseConfig.getApp();

// Add default export to fix router warnings
const utilityExport = {
  name: 'FirebaseConfig',
  version: '1.0.0',
  service: firebaseConfig,
};

export default utilityExport;
