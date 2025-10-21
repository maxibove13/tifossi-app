import { existsSync, readFileSync } from 'node:fs';
import {
  App,
  AppOptions,
  ServiceAccount,
  cert,
  deleteApp,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  Auth,
  CreateRequest,
  DecodedIdToken,
  UpdateRequest,
  UserInfo,
  UserRecord,
  getAuth,
} from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

interface FirebaseConfig {
  serviceAccountPath?: string;
  projectId?: string;
  databaseURL?: string;
  storageBucket?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  emailVerified?: boolean;
}

interface UserMetadataSummary {
  creationTime?: string;
  lastSignInTime?: string;
  lastRefreshTime?: string | null;
}

interface ProviderDataSummary {
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
  metadata: UserMetadataSummary;
  customClaims?: Record<string, unknown>;
  providerData: ProviderDataSummary[];
}

interface UserListResult {
  users: SanitizedUserRecord[];
  pageToken?: string;
  totalUsers: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'error';
  message?: string;
  initialized?: boolean;
  projectId?: string;
  timestamp: string;
}

class FirebaseAdminService {
  private app: App | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private initialized = false;
  private errorHandlersAttached = false;

  async initialize(config: FirebaseConfig = {}): Promise<App> {
    if (this.initialized && this.app) {
      return this.app;
    }

    if (getApps().length > 0) {
      this.app = getApp();
    } else {
      const serviceAccount = this.loadServiceAccount(config.serviceAccountPath);
      const options: AppOptions = {
        credential: cert(serviceAccount),
        projectId: config.projectId ?? process.env.FIREBASE_PROJECT_ID,
        databaseURL: config.databaseURL ?? process.env.FIREBASE_DATABASE_URL,
        storageBucket: config.storageBucket ?? process.env.FIREBASE_STORAGE_BUCKET,
      };

      this.app = initializeApp(options);
      strapi?.log?.info?.('Firebase Admin SDK initialized successfully');
    }

    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.initialized = true;
    this.setupErrorHandling();

    return this.app;
  }

  async verifyIdToken(idToken: string, checkRevoked = true): Promise<DecodedIdToken> {
    const auth = await this.requireAuth();

    try {
      const decodedToken = await auth.verifyIdToken(idToken, checkRevoked);
      this.validateTokenClaims(decodedToken);
      return decodedToken;
    } catch (error: any) {
      const message = error?.message ?? 'Unknown error';
      strapi?.log?.error?.('Token verification failed:', error);

      switch (error?.code) {
        case 'auth/id-token-expired':
          throw new Error('Token has expired');
        case 'auth/id-token-revoked':
          throw new Error('Token has been revoked');
        case 'auth/invalid-id-token':
          throw new Error('Invalid token format');
        default:
          throw new Error(`Token verification failed: ${message}`);
      }
    }
  }

  async getUser(uid: string): Promise<SanitizedUserRecord> {
    const auth = await this.requireAuth();

    try {
      const userRecord = await auth.getUser(uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to get user:', error);
      if (error?.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to retrieve user: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async getUserByEmail(email: string): Promise<SanitizedUserRecord> {
    const auth = await this.requireAuth();

    try {
      const userRecord = await auth.getUserByEmail(email);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to get user by email:', error);
      if (error?.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to retrieve user: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async createUser(userData: CreateUserData): Promise<SanitizedUserRecord> {
    const auth = await this.requireAuth();
    const payload: CreateRequest = {
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: userData.emailVerified ?? false,
      disabled: false,
    };

    try {
      const userRecord = await auth.createUser(payload);
      strapi?.log?.info?.('User created successfully:', userRecord.uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to create user:', error);

      switch (error?.code) {
        case 'auth/email-already-exists':
          throw new Error('Email already in use');
        case 'auth/invalid-email':
          throw new Error('Invalid email address');
        case 'auth/invalid-password':
        case 'auth/weak-password':
          throw new Error('Password is too weak');
        default:
          throw new Error(`Failed to create user: ${error?.message ?? 'Unknown error'}`);
      }
    }
  }

  async updateUser(uid: string, updates: UpdateRequest): Promise<SanitizedUserRecord> {
    const auth = await this.requireAuth();

    try {
      const userRecord = await auth.updateUser(uid, updates);
      strapi?.log?.info?.('User updated successfully:', uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to update user:', error);
      throw new Error(`Failed to update user: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    const auth = await this.requireAuth();

    try {
      await auth.deleteUser(uid);
      strapi?.log?.info?.('User deleted successfully:', uid);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async setCustomClaims(uid: string, customClaims: Record<string, unknown>): Promise<void> {
    const auth = await this.requireAuth();

    try {
      await auth.setCustomUserClaims(uid, customClaims);
      strapi?.log?.info?.('Custom claims set successfully:', uid);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to set custom claims:', error);
      throw new Error(`Failed to set custom claims: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    const auth = await this.requireAuth();

    try {
      await auth.revokeRefreshTokens(uid);
      strapi?.log?.info?.('Refresh tokens revoked successfully:', uid);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to revoke refresh tokens:', error);
      throw new Error(`Failed to revoke tokens: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async createCustomToken(uid: string, claims?: Record<string, unknown>): Promise<string> {
    const auth = await this.requireAuth();

    try {
      return await auth.createCustomToken(uid, claims);
    } catch (error: any) {
      strapi?.log?.error?.('Failed to create custom token:', error);
      throw new Error(`Failed to create custom token: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async listUsers(maxResults = 1000, pageToken?: string): Promise<UserListResult> {
    const auth = await this.requireAuth();

    try {
      const listUsersResult = await auth.listUsers(maxResults, pageToken);
      return {
        users: listUsersResult.users.map((user: UserRecord) => this.sanitizeUserRecord(user)),
        pageToken: listUsersResult.pageToken ?? undefined,
        totalUsers: listUsersResult.users.length,
      };
    } catch (error: any) {
      strapi?.log?.error?.('Failed to list users:', error);
      throw new Error(`Failed to list users: ${error?.message ?? 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.initialized) {
      return {
        status: 'error',
        initialized: false,
        message: 'Firebase Admin SDK not initialized',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const auth = await this.requireAuth();
      await auth.listUsers(1);

      return {
        status: 'healthy',
        initialized: true,
        projectId: this.app?.options.projectId,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        initialized: true,
        message: error?.message ?? 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async shutdown(): Promise<void> {
    if (!this.app) {
      return;
    }

    try {
      await deleteApp(this.app);
      this.app = null;
      this.auth = null;
      this.db = null;
      this.initialized = false;
      strapi?.log?.info?.('Firebase Admin SDK shutdown successfully');
    } catch (error) {
      strapi?.log?.error?.('Error during Firebase Admin SDK shutdown:', error);
    }
  }

  private loadServiceAccount(serviceAccountPath?: string): ServiceAccount {
    if (serviceAccountPath && existsSync(serviceAccountPath)) {
      const raw = readFileSync(serviceAccountPath, 'utf8');
      return JSON.parse(raw);
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
    }

    throw new Error('Firebase service account credentials not found');
  }

  private setupErrorHandling(): void {
    if (this.errorHandlersAttached) {
      return;
    }

    this.errorHandlersAttached = true;

    process.on('unhandledRejection', (reason: any) => {
      if (reason?.code && typeof reason.code === 'string' && reason.code.startsWith('auth/')) {
        strapi?.log?.error?.('Firebase Auth unhandled rejection:', reason);
      }
    });

    process.on('uncaughtException', (error: any) => {
      if (error?.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
        strapi?.log?.error?.('Uncaught Firebase Auth error:', error);
      }
    });
  }

  private validateTokenClaims(decodedToken: DecodedIdToken): void {
    const now = Math.floor(Date.now() / 1000);

    if (decodedToken.iat && now - decodedToken.iat > 3600) {
      strapi?.log?.warn?.('Token is older than 1 hour:', decodedToken.iat);
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      return;
    }

    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (decodedToken.iss !== expectedIssuer) {
      throw new Error('Invalid token issuer');
    }

    if (decodedToken.aud !== projectId) {
      throw new Error('Invalid token audience');
    }

    if (!decodedToken.sub) {
      throw new Error('Invalid token subject');
    }
  }

  private sanitizeUserRecord(userRecord: UserRecord): SanitizedUserRecord {
    return {
      uid: userRecord.uid,
      email: userRecord.email ?? undefined,
      emailVerified: userRecord.emailVerified ?? false,
      displayName: userRecord.displayName ?? undefined,
      photoURL: userRecord.photoURL ?? undefined,
      phoneNumber: userRecord.phoneNumber ?? null,
      disabled: userRecord.disabled ?? false,
      metadata: {
        creationTime: userRecord.metadata?.creationTime,
        lastSignInTime: userRecord.metadata?.lastSignInTime,
        lastRefreshTime: (userRecord.metadata as any)?.lastRefreshTime ?? null,
      },
      customClaims: userRecord.customClaims ?? undefined,
      providerData: (userRecord.providerData ?? []).map((provider: UserInfo) => ({
        uid: provider.uid ?? '',
        displayName: provider.displayName ?? null,
        email: provider.email ?? null,
        photoURL: provider.photoURL ?? null,
        providerId: provider.providerId,
      })),
    };
  }

  private async requireAuth(): Promise<Auth> {
    if (!this.initialized || !this.app) {
      await this.initialize();
    }

    if (!this.auth) {
      this.auth = getAuth(this.app!);
    }

    return this.auth;
  }
}

export const firebaseAdmin = new FirebaseAdminService();
export { FirebaseAdminService };

export const initialize = (config?: FirebaseConfig) => firebaseAdmin.initialize(config);
export const verifyIdToken = (token: string, checkRevoked?: boolean) =>
  firebaseAdmin.verifyIdToken(token, checkRevoked);
export const getUser = (uid: string) => firebaseAdmin.getUser(uid);
export const getUserByEmail = (email: string) => firebaseAdmin.getUserByEmail(email);
export const createUser = (userData: CreateUserData) => firebaseAdmin.createUser(userData);
export const updateUser = (uid: string, updates: UpdateRequest) =>
  firebaseAdmin.updateUser(uid, updates);
export const deleteUser = (uid: string) => firebaseAdmin.deleteUser(uid);
export const setCustomClaims = (uid: string, claims: Record<string, unknown>) =>
  firebaseAdmin.setCustomClaims(uid, claims);
export const revokeRefreshTokens = (uid: string) => firebaseAdmin.revokeRefreshTokens(uid);
export const createCustomToken = (uid: string, claims?: Record<string, unknown>) =>
  firebaseAdmin.createCustomToken(uid, claims);
export const listUsers = (maxResults?: number, pageToken?: string) =>
  firebaseAdmin.listUsers(maxResults, pageToken);
export const healthCheck = () => firebaseAdmin.healthCheck();
export const shutdown = () => firebaseAdmin.shutdown();
