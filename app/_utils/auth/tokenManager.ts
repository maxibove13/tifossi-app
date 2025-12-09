/**
 * Token Manager for Dual-Token Authentication System
 *
 * Manages Firebase ID tokens and Strapi JWT tokens in a coordinated manner.
 * Handles token storage, refresh, validation, and synchronization.
 */

import * as SecureStore from 'expo-secure-store';
import { buildUrl, endpoints } from '../../_config/endpoints';
import firebaseAuthExport from '../../_services/auth/firebaseAuth';
const firebaseAuth = firebaseAuthExport.service;

// Token storage keys
const FIREBASE_TOKEN_KEY = 'tifossi_firebase_token';
const STRAPI_TOKEN_KEY = 'tifossi_strapi_token';
const TOKEN_METADATA_KEY = 'tifossi_token_metadata';

// Token metadata interface
interface TokenMetadata {
  firebaseTokenExpiry: number;
  strapiTokenExpiry: number;
  lastSync: number;
  userId: string;
  tokenVersion: number;
}

// Token set interface
export interface TokenSet {
  firebaseToken: string | null;
  strapiToken: string | null;
  metadata: TokenMetadata | null;
}

// Token validation result
export interface TokenValidation {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

class TokenManager {
  private refreshPromise: Promise<TokenSet> | null = null;
  private isRefreshing = false;

  /**
   * Exchange Firebase ID token for Strapi JWT token
   */
  async exchangeFirebaseTokenForStrapi(firebaseToken: string): Promise<string> {
    try {
      const response = await fetch(buildUrl('/api/auth/firebase-exchange'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          firebaseToken,
          tokenVersion: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Token exchange failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Token exchange failed`);
      }

      const data = await response.json();

      if (!data.jwt) {
        throw new Error('No JWT token received from Strapi');
      }

      return data.jwt;
    } catch (error: any) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Store token set securely
   */
  async storeTokens(firebaseToken: string, strapiToken: string, userId: string): Promise<void> {
    try {
      // Create token metadata
      const metadata: TokenMetadata = {
        firebaseTokenExpiry: Date.now() + 60 * 60 * 1000, // 1 hour from now
        strapiTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        lastSync: Date.now(),
        userId,
        tokenVersion: 1,
      };

      // Store tokens and metadata
      await Promise.all([
        SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, firebaseToken),
        SecureStore.setItemAsync(STRAPI_TOKEN_KEY, strapiToken),
        SecureStore.setItemAsync(TOKEN_METADATA_KEY, JSON.stringify(metadata)),
      ]);
    } catch {
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve stored tokens
   */
  async getTokens(): Promise<TokenSet> {
    try {
      const [firebaseToken, strapiToken, metadataJson] = await Promise.all([
        SecureStore.getItemAsync(FIREBASE_TOKEN_KEY),
        SecureStore.getItemAsync(STRAPI_TOKEN_KEY),
        SecureStore.getItemAsync(TOKEN_METADATA_KEY),
      ]);

      let metadata: TokenMetadata | null = null;
      if (metadataJson) {
        try {
          metadata = JSON.parse(metadataJson);
        } catch {}
      }

      return {
        firebaseToken,
        strapiToken,
        metadata,
      };
    } catch {
      return {
        firebaseToken: null,
        strapiToken: null,
        metadata: null,
      };
    }
  }

  /**
   * Validate current tokens
   */
  async validateTokens(): Promise<TokenValidation> {
    try {
      const tokens = await this.getTokens();

      if (!tokens.firebaseToken || !tokens.strapiToken || !tokens.metadata) {
        return {
          isValid: false,
          needsRefresh: true,
          error: 'Missing tokens or metadata',
        };
      }

      const now = Date.now();
      const { firebaseTokenExpiry, strapiTokenExpiry } = tokens.metadata;

      // Check if Firebase token is expired or close to expiring (within 5 minutes)
      const firebaseExpiringSoon = firebaseTokenExpiry - now < 5 * 60 * 1000;

      // Check if Strapi token is expired
      const strapiExpired = now >= strapiTokenExpiry;

      if (strapiExpired) {
        return {
          isValid: false,
          needsRefresh: true,
          error: 'Strapi token expired',
        };
      }

      if (firebaseExpiringSoon) {
        return {
          isValid: true,
          needsRefresh: true,
          error: 'Firebase token expiring soon',
        };
      }

      // Validate Firebase token with backend
      const isValidWithBackend = await this.validateWithBackend(tokens.strapiToken);

      return {
        isValid: isValidWithBackend,
        needsRefresh: !isValidWithBackend,
        error: isValidWithBackend ? undefined : 'Backend validation failed',
      };
    } catch (error: any) {
      return {
        isValid: false,
        needsRefresh: true,
        error: error.message,
      };
    }
  }

  /**
   * Validate Strapi token with backend
   */
  private async validateWithBackend(strapiToken: string): Promise<boolean> {
    try {
      const response = await fetch(buildUrl(endpoints.auth.validateToken), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${strapiToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(): Promise<TokenSet> {
    // Prevent concurrent refresh operations
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<TokenSet> {
    try {
      // Get fresh Firebase token
      const firebaseToken = await firebaseAuth.getIdToken(true);

      if (!firebaseToken) {
        throw new Error('Failed to get Firebase ID token');
      }

      // Exchange for new Strapi token
      const strapiToken = await this.exchangeFirebaseTokenForStrapi(firebaseToken);

      // Get current user ID
      const currentUser = firebaseAuth.getCurrentAppUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Store new tokens
      await this.storeTokens(firebaseToken, strapiToken, currentUser.id);

      // Return updated token set
      const tokens = await this.getTokens();

      return tokens;
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get valid tokens (with automatic refresh if needed)
   */
  async getValidTokens(): Promise<TokenSet> {
    const validation = await this.validateTokens();

    if (!validation.isValid || validation.needsRefresh) {
      return await this.refreshTokens();
    }

    return await this.getTokens();
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(FIREBASE_TOKEN_KEY),
        SecureStore.deleteItemAsync(STRAPI_TOKEN_KEY),
        SecureStore.deleteItemAsync(TOKEN_METADATA_KEY),
      ]);
    } catch {
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Sync tokens after login
   */
  async syncAfterLogin(firebaseToken: string, userId: string): Promise<TokenSet> {
    try {
      // Exchange Firebase token for Strapi token
      const strapiToken = await this.exchangeFirebaseTokenForStrapi(firebaseToken);

      // Store tokens
      await this.storeTokens(firebaseToken, strapiToken, userId);

      // Return token set
      return await this.getTokens();
    } catch (error: any) {
      throw new Error(`Post-login sync failed: ${error.message}`);
    }
  }

  /**
   * Get token for API requests (prefers Strapi token)
   */
  async getApiToken(): Promise<string | null> {
    try {
      const tokens = await this.getValidTokens();
      return tokens.strapiToken || tokens.firebaseToken;
    } catch {
      return null;
    }
  }

  /**
   * Get Firebase token specifically
   */
  async getFirebaseToken(): Promise<string | null> {
    try {
      const tokens = await this.getValidTokens();
      return tokens.firebaseToken;
    } catch {
      return null;
    }
  }

  /**
   * Get Strapi token specifically
   */
  async getStrapiToken(): Promise<string | null> {
    try {
      const tokens = await this.getValidTokens();
      return tokens.strapiToken;
    } catch {
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    hasFirebaseToken: boolean;
    hasStrapiToken: boolean;
    tokensValid: boolean;
    lastSync?: number;
  }> {
    try {
      const tokens = await this.getTokens();
      const validation = await this.validateTokens();

      return {
        status: validation.isValid ? 'healthy' : 'degraded',
        hasFirebaseToken: !!tokens.firebaseToken,
        hasStrapiToken: !!tokens.strapiToken,
        tokensValid: validation.isValid,
        lastSync: tokens.metadata?.lastSync,
      };
    } catch {
      return {
        status: 'error',
        hasFirebaseToken: false,
        hasStrapiToken: false,
        tokensValid: false,
      };
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export convenience methods
export const getValidTokens = () => tokenManager.getValidTokens();
export const getApiToken = () => tokenManager.getApiToken();
export const getFirebaseToken = () => tokenManager.getFirebaseToken();
export const getStrapiToken = () => tokenManager.getStrapiToken();
export const clearTokens = () => tokenManager.clearTokens();
export const syncAfterLogin = (firebaseToken: string, userId: string) =>
  tokenManager.syncAfterLogin(firebaseToken, userId);

// Add default export to fix router warnings
const utilityExport = {
  name: 'TokenManager',
  version: '1.0.0',
  service: tokenManager,
};

export default utilityExport;
