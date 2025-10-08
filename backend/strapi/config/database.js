/**
 * Strapi v5 Database Configuration
 *
 * This configuration provides:
 * - Environment validation with clear error messages
 * - Detailed logging for debugging deployment issues
 * - Production-first PostgreSQL configuration
 * - Optional local development fallback to SQLite
 *
 * Environment Variables Required (Production):
 * - DATABASE_CLIENT (default: postgres)
 * - DATABASE_URL (PostgreSQL connection string from Render)
 * - DATABASE_SSL (default: false, set to true for Render)
 * - DATABASE_SSL_REJECT_UNAUTHORIZED (default: false for Render)
 */

module.exports = ({ env }) => {
  // Log configuration loading
  console.log('[Database Config] Starting configuration...');

  // Step 1: Get and validate DATABASE_CLIENT
  const client = env('DATABASE_CLIENT', 'postgres');
  console.log(`[Database Config] Client: ${client}`);

  // Step 2: Validate required environment variables
  // For postgres: DATABASE_URL OR (host + port + database + user) must be present
  // For sqlite: DATABASE_FILENAME must be present
  let missing = [];

  if (client === 'postgres') {
    const hasUrl = !!env('DATABASE_URL');
    const hasIndividualParams = !!(
      env('DATABASE_HOST') &&
      env('DATABASE_PORT') &&
      env('DATABASE_NAME') &&
      env('DATABASE_USERNAME')
    );

    if (!hasUrl && !hasIndividualParams) {
      missing.push('DATABASE_URL OR (DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USERNAME)');
    }
  } else if (client === 'sqlite') {
    if (!env('DATABASE_FILENAME')) {
      missing.push('DATABASE_FILENAME');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DATABASE CONFIGURATION ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Missing required environment variables: ${missing.join(', ')}

Current environment:
  - DATABASE_CLIENT: ${client}
  - NODE_ENV: ${env('NODE_ENV', 'development')}

For ${client === 'postgres' ? 'PostgreSQL (Production)' : 'SQLite (Development)'}:
  ${missing.map(v => `✗ ${v}: NOT SET`).join('\n  ')}

Troubleshooting steps:
  1. Check Render Dashboard → Service → Environment Variables
  2. Verify DATABASE_URL is set (auto-generated from Postgres service)
  3. Ensure render.yaml has correct 'fromDatabase' configuration
  4. Check that PostgreSQL service is running and linked
  5. Review Render logs for any service connection issues

Documentation:
  - Strapi v5 Database: https://docs.strapi.io/dev-docs/configurations/database
  - Render Postgres: https://render.com/docs/databases

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    console.error(errorMsg);
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }

  // Step 3: Log environment variables (masked for security)
  const maskConnectionString = (url) => {
    if (!url) return 'NOT SET';
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`;
    } catch {
      return 'INVALID FORMAT';
    }
  };

  console.log('[Database Config] Environment variables:');
  console.log(`  - DATABASE_CLIENT: ${client}`);

  if (client === 'postgres') {
    console.log(`  - DATABASE_URL: ${maskConnectionString(env('DATABASE_URL'))}`);
    console.log(`  - DATABASE_SSL: ${env.bool('DATABASE_SSL', false)}`);
    console.log(`  - DATABASE_SSL_REJECT_UNAUTHORIZED: ${env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false)}`);
    console.log(`  - DATABASE_POOL_MIN: ${env.int('DATABASE_POOL_MIN', 2)}`);
    console.log(`  - DATABASE_POOL_MAX: ${env.int('DATABASE_POOL_MAX', 10)}`);
    console.log(`  - DATABASE_CONNECTION_TIMEOUT: ${env.int('DATABASE_CONNECTION_TIMEOUT', 60000)}ms`);
  } else if (client === 'sqlite') {
    console.log(`  - DATABASE_FILENAME: ${env('DATABASE_FILENAME', '.tmp/data.db')}`);
  }

  // Step 4: Build configuration based on client
  let config;

  if (client === 'postgres') {
    // PostgreSQL configuration (Production & Development)
    const sslEnabled = env.bool('DATABASE_SSL', false);

    config = {
      connection: {
        client: 'postgres',
        connection: {
          connectionString: env('DATABASE_URL'),
          host: env('DATABASE_HOST', 'localhost'),
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'strapi'),
          user: env('DATABASE_USERNAME', 'strapi'),
          password: env('DATABASE_PASSWORD', 'strapi'),
          ssl: sslEnabled && {
            rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
          },
          schema: env('DATABASE_SCHEMA', 'public'),
        },
        pool: {
          min: env.int('DATABASE_POOL_MIN', 2),
          max: env.int('DATABASE_POOL_MAX', 10),
        },
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };

    console.log('[Database Config] PostgreSQL configuration built successfully');
  } else if (client === 'sqlite') {
    // SQLite configuration (Local Development Only)
    config = {
      connection: {
        client: 'sqlite',
        connection: {
          filename: env('DATABASE_FILENAME', '.tmp/data.db'),
        },
        useNullAsDefault: true,
      },
    };

    console.log('[Database Config] SQLite configuration built successfully');
  } else {
    // Unsupported client
    const errorMsg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ UNSUPPORTED DATABASE CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Unsupported DATABASE_CLIENT: ${client}

Supported clients:
  - postgres (recommended for production)
  - sqlite (local development only)

Current: ${client}

Please update your DATABASE_CLIENT environment variable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    console.error(errorMsg);
    throw new Error(`Unsupported database client: ${client}. Supported: postgres, sqlite`);
  }

  // Step 5: Validate final configuration structure
  console.log('[Database Config] Validating configuration structure...');

  if (!config || typeof config !== 'object') {
    throw new Error('Configuration is not an object');
  }

  if (!config.connection) {
    throw new Error('Missing "connection" property in configuration');
  }

  if (!config.connection.client) {
    throw new Error('Missing "client" property in connection configuration');
  }

  if (!config.connection.connection) {
    throw new Error('Missing nested "connection" property in configuration');
  }

  // Log final structure (without sensitive data)
  console.log('[Database Config] Final configuration structure:');
  console.log(`  - config.connection.client: ${config.connection.client}`);
  console.log(`  - config.connection.connection: ${typeof config.connection.connection}`);
  console.log(`  - config.connection.pool: ${config.connection.pool ? 'configured' : 'not set'}`);
  console.log(`  - config.connection.acquireConnectionTimeout: ${config.connection.acquireConnectionTimeout || 'not set'}`);

  console.log('[Database Config] Configuration loaded successfully ✓');

  return config;
};
