/**
 * Public Path Detection and URL Validation Tests
 * Validates that:
 * 1. Public endpoints are correctly identified for auth token skipping
 * 2. Invalid URL formats (like /api/... or absolute URLs) throw errors
 *
 * NOTE: httpClient callers must use BARE paths (e.g., '/products', '/auth/local')
 * because httpClient's baseURL already includes '/api'.
 */

import { isPublicPath, validateHttpClientPath } from '../../_services/api/publicPaths';

describe('isPublicPath', () => {
  describe('public endpoints (should match)', () => {
    it('should match /products', () => {
      expect(isPublicPath('/products')).toBe(true);
    });

    it('should match /products/123', () => {
      expect(isPublicPath('/products/123')).toBe(true);
    });

    it('should match /categories', () => {
      expect(isPublicPath('/categories')).toBe(true);
    });

    it('should match /store-locations', () => {
      expect(isPublicPath('/store-locations')).toBe(true);
    });

    it('should match /app-settings', () => {
      expect(isPublicPath('/app-settings')).toBe(true);
    });

    it('should match /auth/local (login)', () => {
      expect(isPublicPath('/auth/local')).toBe(true);
    });

    it('should match /auth/local/register', () => {
      expect(isPublicPath('/auth/local/register')).toBe(true);
    });
  });

  describe('protected endpoints (should NOT match)', () => {
    it('should NOT match /users/me', () => {
      expect(isPublicPath('/users/me')).toBe(false);
    });

    it('should NOT match /orders', () => {
      expect(isPublicPath('/orders')).toBe(false);
    });

    it('should NOT match /cart/sync', () => {
      expect(isPublicPath('/cart/sync')).toBe(false);
    });

    it('should NOT match /auth/logout (requires token)', () => {
      expect(isPublicPath('/auth/logout')).toBe(false);
    });

    it('should NOT match /auth/change-password', () => {
      expect(isPublicPath('/auth/change-password')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for undefined', () => {
      expect(isPublicPath(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPublicPath('')).toBe(false);
    });

    it('should NOT match partial path names (e.g., /product without s)', () => {
      expect(isPublicPath('/product')).toBe(false);
    });

    it('should NOT match paths that happen to contain public keywords', () => {
      expect(isPublicPath('/admin/products')).toBe(false);
    });
  });
});

describe('validateHttpClientPath', () => {
  describe('valid paths (should not throw)', () => {
    it('should accept bare paths', () => {
      expect(() => validateHttpClientPath('/products')).not.toThrow();
      expect(() => validateHttpClientPath('/auth/local')).not.toThrow();
      expect(() => validateHttpClientPath('/users/me')).not.toThrow();
    });

    it('should accept undefined', () => {
      expect(() => validateHttpClientPath(undefined)).not.toThrow();
    });
  });

  describe('/api/... prefix (should throw)', () => {
    it('should throw for /api/products', () => {
      expect(() => validateHttpClientPath('/api/products')).toThrow(
        /starts with \/api\// // baseURL already has /api
      );
    });

    it('should throw for /api/auth/local', () => {
      expect(() => validateHttpClientPath('/api/auth/local')).toThrow(/starts with \/api\//);
    });

    it('should throw for /api/auth/local/register', () => {
      expect(() => validateHttpClientPath('/api/auth/local/register')).toThrow(
        /starts with \/api\//
      );
    });

    it('should throw for bare /api', () => {
      expect(() => validateHttpClientPath('/api')).toThrow(/path "\/api" is invalid/);
    });

    it('should suggest the correct bare path in error message', () => {
      expect(() => validateHttpClientPath('/api/auth/local')).toThrow(
        /Use bare path "\/auth\/local"/
      );
    });
  });

  describe('missing leading slash (should throw)', () => {
    it('should throw for products', () => {
      expect(() => validateHttpClientPath('products')).toThrow(/must start with "\/"/);
    });

    it('should throw for auth/local', () => {
      expect(() => validateHttpClientPath('auth/local')).toThrow(/must start with "\/"/);
    });
  });

  describe('absolute URLs (should throw)', () => {
    it('should throw for http:// URLs', () => {
      expect(() => validateHttpClientPath('http://localhost:1337/api/products')).toThrow(
        /received absolute URL/
      );
    });

    it('should throw for https:// URLs', () => {
      expect(() => validateHttpClientPath('https://api.example.com/products')).toThrow(
        /received absolute URL/
      );
    });

    it('should suggest using fetch() directly', () => {
      expect(() => validateHttpClientPath('https://example.com/api')).toThrow(
        /use fetch\(\) directly/i
      );
    });
  });
});
