/**
 * Public path detection and URL validation for httpClient
 *
 * Public endpoints should NOT receive auth tokens because:
 * 1. They work without authentication
 * 2. They may reject invalid/expired tokens with 401, breaking requests
 *
 * IMPORTANT: httpClient's baseURL already includes '/api'. Callers MUST use
 * bare paths (e.g., '/products', '/auth/local'). Using '/api/...' paths or
 * absolute URLs will throw an error to prevent silent failures.
 */

// Public endpoints that should NOT receive auth tokens
const PUBLIC_PATHS = [
  '/products',
  '/product-models',
  '/categories',
  '/store-locations',
  '/app-settings',
  '/auth/local', // Covers both /auth/local (login) and /auth/local/register
];

/**
 * Validates that a URL conforms to httpClient's expected format (bare paths only).
 * Throws if the URL would cause silent failures like /api/api/... or token leakage.
 */
export function validateHttpClientPath(url: string | undefined): void {
  if (!url) return;

  // Detect absolute URLs first - httpClient should use relative paths with baseURL
  if (/^https?:\/\//i.test(url)) {
    throw new Error(
      `httpClient received absolute URL "${url}". Use bare path (e.g., '/products') instead. ` +
        `For full URLs, use fetch() directly.`
    );
  }

  // Require leading slash to avoid accidental relative paths that skip public-path logic
  if (!url.startsWith('/')) {
    throw new Error(
      `httpClient path "${url}" must start with "/". Use "/${url}" if that is the intended path.`
    );
  }

  // Detect /api/... prefix - would cause /api/api/... 404
  if (url.startsWith('/api/') || url === '/api') {
    if (url === '/api') {
      throw new Error(
        'httpClient path "/api" is invalid because baseURL already includes /api. Remove the /api prefix and include the resource path (e.g., "/products").'
      );
    }

    throw new Error(
      `httpClient path "${url}" starts with /api/ but baseURL already includes /api. ` +
        `Use bare path "${url.slice(4)}" instead.`
    );
  }
}

/**
 * Checks if a request URL is a public endpoint that shouldn't receive auth tokens.
 * Only accepts validated bare paths.
 */
export function isPublicPath(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_PATHS.some((path) => url.startsWith(path));
}
