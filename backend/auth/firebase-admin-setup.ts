/**
 * Firebase Admin SDK Setup and Configuration
 *
 * This module initializes and configures Firebase Admin SDK for server-side
 * authentication operations in the Tifossi backend.
 *
 * Features:
 * - Firebase Admin SDK initialization
 * - Service account authentication
 * - Custom claims management
 * - User management operations
 * - Token verification and validation
 */

// Firebase Admin SDK would be imported here when installed
// import * as admin from 'firebase-admin';
// Placeholder until firebase-admin is installed
import * as fs from 'fs';

// Type definitions for firebase-admin (placeholder until installed)
namespace admin {
  export namespace app {
    export interface App {
      auth(): admin.auth.Auth;
      firestore(): admin.firestore.Firestore;
      delete(): Promise<void>;
    }
  }
  export namespace auth {
    export interface Auth {
      verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<DecodedIdToken>;
      createUser(properties: CreateUserRequest): Promise<UserRecord>;
      updateUser(uid: string, properties: UpdateUserRequest): Promise<UserRecord>;
      deleteUser(uid: string): Promise<void>;
      getUser(uid: string): Promise<UserRecord>;
      getUserByEmail(email: string): Promise<UserRecord>;
      setCustomUserClaims(uid: string, customUserClaims: object): Promise<void>;
      createCustomToken(uid: string, customClaims?: object): Promise<string>;
      revokeRefreshTokens(uid: string): Promise<void>;
      listUsers(
        maxResults?: number,
        pageToken?: string
      ): Promise<{ users: UserRecord[]; pageToken?: string }>;
    }
    export interface DecodedIdToken {
      uid: string;
      email?: string;
      email_verified?: boolean;
      [key: string]: any;
    }
    export interface UserRecord {
      uid: string;
      email?: string;
      emailVerified?: boolean;
      displayName?: string;
      photoURL?: string;
      phoneNumber?: string;
      disabled?: boolean;
      metadata?: UserMetadata;
      customClaims?: object;
      providerData?: UserInfo[];
    }
    export interface CreateUserRequest {
      email?: string;
      emailVerified?: boolean;
      phoneNumber?: string;
      password?: string;
      displayName?: string;
      photoURL?: string;
      disabled?: boolean;
    }
    export type UpdateUserRequest = Partial<CreateUserRequest>;
    export interface UserMetadata {
      creationTime?: string;
      lastSignInTime?: string;
    }
    export interface UserInfo {
      providerId: string;
      uid?: string;
      displayName?: string;
      email?: string;
      phoneNumber?: string;
      photoURL?: string;
    }
  }
  export namespace firestore {
    export interface Firestore {
      collection(collectionPath: string): CollectionReference;
      doc(documentPath: string): DocumentReference;
      batch(): WriteBatch;
    }
    export interface CollectionReference {
      doc(documentPath?: string): DocumentReference;
      add(data: object): Promise<DocumentReference>;
      get(): Promise<QuerySnapshot>;
    }
    export interface DocumentReference {
      set(data: object, options?: SetOptions): Promise<WriteResult>;
      update(data: object): Promise<WriteResult>;
      delete(): Promise<WriteResult>;
      get(): Promise<DocumentSnapshot>;
    }
    export interface DocumentSnapshot {
      exists: boolean;
      data(): any;
      id: string;
    }
    export interface QuerySnapshot {
      docs: DocumentSnapshot[];
      size: number;
    }
    export interface WriteBatch {
      set(documentRef: DocumentReference, data: object): WriteBatch;
      update(documentRef: DocumentReference, data: object): WriteBatch;
      delete(documentRef: DocumentReference): WriteBatch;
      commit(): Promise<WriteResult[]>;
    }
    export interface WriteResult {
      writeTime: any;
    }
    export interface SetOptions {
      merge?: boolean;
    }
  }
  export interface ServiceAccount {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  }
  export interface AppOptions {
    credential?: any;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
  }
  export const initializeApp: (options?: AppOptions, name?: string) => app.App = {} as any;
  export const apps: () => app.App[] = {} as any;
  export const authFactory: () => auth.Auth = {} as any;
  export const firestoreFactory: () => firestore.Firestore = {} as any;
  export namespace credential {
    export const cert: (serviceAccount: ServiceAccount) => any = {} as any;
  }
}

// Placeholder for admin SDK (will be replaced when firebase-admin is installed)
const _adminPlaceholder = null as any;

interface FirebaseConfig {
  serviceAccountPath?: string;
  projectId?: string;
  databaseURL?: string;
  storageBucket?: string;
}

interface ServiceAccount {
  type: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

interface UserMetadata {
  creationTime?: string;
  lastSignInTime?: string;
  lastRefreshTime?: string;
}

interface ProviderData {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  providerId: string;
}

interface SanitizedUserRecord {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string | null;
  disabled: boolean;
  metadata: UserMetadata;
  customClaims?: { [key: string]: any };
  providerData: ProviderData[];
}

interface UserListResult {
  users: SanitizedUserRecord[];
  pageToken?: string;
  totalUsers: number;
}

interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  emailVerified?: boolean;
}

interface HealthCheckResult {
  status: 'healthy' | 'error';
  message?: string;
  initialized?: boolean;
  projectId?: string;
  timestamp: string;
}

class FirebaseAdminService {
  private app: admin.app.App | null = null;
  private auth: admin.auth.Auth | null = null;
  private db: admin.firestore.Firestore | null = null;
  private initialized: boolean = false;

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize(config: FirebaseConfig = {}): Promise<admin.app.App> {
    try {
      if (this.initialized && this.app) {
        console.log('Firebase Admin SDK already initialized');
        return this.app;
      }

      // Load service account credentials
      const serviceAccount = this.loadServiceAccount(config.serviceAccountPath);

      // Initialize Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
        databaseURL: config.databaseURL || process.env.FIREBASE_DATABASE_URL,
        storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
      });

      this.auth = this.app?.auth();
      this.db = this.app?.firestore();

      this.initialized = true;
      console.log('Firebase Admin SDK initialized successfully');

      // Set up error handling
      this.setupErrorHandling();

      return this.app;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error(`Firebase initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Load service account credentials from file or environment
   */
  private loadServiceAccount(serviceAccountPath?: string): ServiceAccount {
    try {
      // Try to load from file first
      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const serviceAccountKey = fs.readFileSync(serviceAccountPath, 'utf8');
        return JSON.parse(serviceAccountKey);
      }

      // Fall back to environment variables
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      }

      // Construct from individual environment variables
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        return {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        };
      }

      throw new Error('Firebase service account credentials not found');
    } catch (error) {
      console.error('Failed to load service account:', error);
      throw error;
    }
  }

  /**
   * Set up error handling for Firebase operations
   */
  private setupErrorHandling(): void {
    process.on('unhandledRejection', (reason: any, _promise) => {
      if (reason && reason.code && reason.code.startsWith('auth/')) {
        console.error('Firebase Auth error:', reason);
      }
    });

    process.on('uncaughtException', (error: any) => {
      if (error.code && error.code.startsWith('auth/')) {
        console.error('Uncaught Firebase Auth error:', error);
      }
    });
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(
    idToken: string,
    checkRevoked: boolean = true
  ): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const decodedToken = await this.auth.verifyIdToken(idToken, checkRevoked);

      // Additional security validations
      this.validateTokenClaims(decodedToken);

      return decodedToken;
    } catch (error: any) {
      console.error('Token verification failed:', error);

      // Map Firebase errors to application errors
      if (error.code === 'auth/id-token-expired') {
        throw new Error('Token has expired');
      } else if (error.code === 'auth/id-token-revoked') {
        throw new Error('Token has been revoked');
      } else if (error.code === 'auth/invalid-id-token') {
        throw new Error('Invalid token format');
      } else {
        throw new Error(`Token verification failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Validate token claims for security
   */
  private validateTokenClaims(decodedToken: admin.auth.DecodedIdToken): void {
    const now = Math.floor(Date.now() / 1000);

    // Check token age
    if (decodedToken.iat && now - decodedToken.iat > 3600) {
      console.warn('Token is older than 1 hour:', decodedToken.iat);
    }

    // Check issuer
    const expectedIssuer = `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`;
    if (decodedToken.iss !== expectedIssuer) {
      throw new Error('Invalid token issuer');
    }

    // Check audience
    if (decodedToken.aud !== process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Invalid token audience');
    }

    // Check subject
    if (!decodedToken.sub || decodedToken.sub.length === 0) {
      throw new Error('Invalid token subject');
    }
  }

  /**
   * Get user by Firebase UID
   */
  async getUser(uid: string): Promise<SanitizedUserRecord> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.getUser(uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      console.error('Failed to get user:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to retrieve user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<SanitizedUserRecord> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.getUserByEmail(email);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      console.error('Failed to get user by email:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to retrieve user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserData): Promise<SanitizedUserRecord> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: userData.emailVerified || false,
        disabled: false,
      });

      console.log('User created successfully:', userRecord.uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      console.error('Failed to create user:', error);

      if (error.code === 'auth/email-already-exists') {
        throw new Error('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }

      throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Update user record
   */
  async updateUser(
    uid: string,
    updates: admin.auth.UpdateUserRequest
  ): Promise<SanitizedUserRecord> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.updateUser(uid, updates);
      console.log('User updated successfully:', uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      console.error('Failed to update user:', error);
      throw new Error(`Failed to update user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      await this.auth.deleteUser(uid);
      console.log('User deleted successfully:', uid);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Set custom claims for user
   */
  async setCustomClaims(uid: string, customClaims: { [key: string]: any }): Promise<void> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      await this.auth.setCustomUserClaims(uid, customClaims);
      console.log('Custom claims set successfully:', uid);
    } catch (error: any) {
      console.error('Failed to set custom claims:', error);
      throw new Error(`Failed to set custom claims: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Revoke refresh tokens for user
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      await this.auth.revokeRefreshTokens(uid);
      console.log('Refresh tokens revoked successfully:', uid);
    } catch (error: any) {
      console.error('Failed to revoke refresh tokens:', error);
      throw new Error(`Failed to revoke tokens: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate custom token for user
   */
  async createCustomToken(
    uid: string,
    additionalClaims: { [key: string]: any } = {}
  ): Promise<string> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const customToken = await this.auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error: any) {
      console.error('Failed to create custom token:', error);
      throw new Error(`Failed to create custom token: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * List users with pagination
   */
  async listUsers(maxResults: number = 1000, pageToken?: string): Promise<UserListResult> {
    try {
      if (!this.initialized || !this.auth) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const listUsersResult = await this.auth.listUsers(maxResults, pageToken);

      return {
        users: listUsersResult.users.map((user) => this.sanitizeUserRecord(user)),
        pageToken: listUsersResult.pageToken,
        totalUsers: listUsersResult.users.length,
      };
    } catch (error: any) {
      console.error('Failed to list users:', error);
      throw new Error(`Failed to list users: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Sanitize user record for safe transmission
   */
  private sanitizeUserRecord(userRecord: admin.auth.UserRecord): SanitizedUserRecord {
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified || false,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled || false,
      metadata: {
        creationTime: userRecord.metadata?.creationTime,
        lastSignInTime: userRecord.metadata?.lastSignInTime,
        lastRefreshTime: (userRecord.metadata as any)?.lastRefreshTime,
      },
      customClaims: userRecord.customClaims || {},
      providerData: (userRecord.providerData || []).map((provider: admin.auth.UserInfo) => ({
        uid: provider.uid || '',
        displayName: provider.displayName,
        email: provider.email,
        photoURL: provider.photoURL,
        providerId: provider.providerId,
      })),
    };
  }

  /**
   * Health check for Firebase Admin SDK
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      if (!this.initialized || !this.auth) {
        return {
          status: 'error',
          message: 'Firebase Admin SDK not initialized',
          timestamp: new Date().toISOString(),
        };
      }

      // Try to verify a dummy token to check connectivity
      const testUID = 'health-check-test';
      const _customToken = await this.auth.createCustomToken(testUID);

      return {
        status: 'healthy',
        initialized: this.initialized,
        projectId: process.env.FIREBASE_PROJECT_ID,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Gracefully shutdown Firebase Admin SDK
   */
  async shutdown(): Promise<void> {
    try {
      if (this.app) {
        await this.app.delete();
        this.initialized = false;
        console.log('Firebase Admin SDK shutdown successfully');
      }
    } catch (error) {
      console.error('Error during Firebase Admin SDK shutdown:', error);
    }
  }
}

// Export singleton instance
export const firebaseAdmin = new FirebaseAdminService();

// Export class for testing
export { FirebaseAdminService };

// Convenience methods for backward compatibility
export const initialize = (config?: FirebaseConfig) => firebaseAdmin.initialize(config);
export const verifyIdToken = (token: string, checkRevoked?: boolean) =>
  firebaseAdmin.verifyIdToken(token, checkRevoked);
export const getUser = (uid: string) => firebaseAdmin.getUser(uid);
export const getUserByEmail = (email: string) => firebaseAdmin.getUserByEmail(email);
export const createUser = (userData: CreateUserData) => firebaseAdmin.createUser(userData);
export const updateUser = (uid: string, updates: admin.auth.UpdateUserRequest) =>
  firebaseAdmin.updateUser(uid, updates);
export const deleteUser = (uid: string) => firebaseAdmin.deleteUser(uid);
export const setCustomClaims = (uid: string, claims: { [key: string]: any }) =>
  firebaseAdmin.setCustomClaims(uid, claims);
export const revokeRefreshTokens = (uid: string) => firebaseAdmin.revokeRefreshTokens(uid);
export const createCustomToken = (uid: string, claims?: { [key: string]: any }) =>
  firebaseAdmin.createCustomToken(uid, claims);
export const listUsers = (maxResults?: number, pageToken?: string) =>
  firebaseAdmin.listUsers(maxResults, pageToken);
export const healthCheck = () => firebaseAdmin.healthCheck();
export const shutdown = () => firebaseAdmin.shutdown();
