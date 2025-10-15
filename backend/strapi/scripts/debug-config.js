#!/usr/bin/env node

/**
 * Database Configuration Debug Script
 *
 * This script runs BEFORE the Strapi build to validate:
 * 1. Environment helper is working correctly
 * 2. All required environment variables are present
 * 3. DATABASE_URL is valid and parseable
 * 4. database.js config loads without errors
 * 5. Configuration structure matches Strapi v5 requirements
 *
 * This is a TEMPORARY diagnostic tool to identify deployment issues.
 * Remove from build command once root cause is identified.
 *
 * Usage:
 *   node scripts/debug-config.js
 *
 * Exit codes:
 *   0 = Success, safe to proceed with build
 *   1 = Failure, build should abort
 */

const path = require('path');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Database Configuration Debug');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Track test results
const tests = [];
let allPassed = true;

function runTest(name, fn) {
  console.log(`\n[TEST] ${name}`);
  console.log('─'.repeat(70));

  try {
    fn();
    console.log('✓ PASS');
    tests.push({ name, passed: true });
    return true;
  } catch (error) {
    console.error('✗ FAIL');
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    tests.push({ name, passed: false, error: error.message });
    allPassed = false;
    return false;
  }
}

// Test 1: Verify Strapi env helper exists
runTest('Verify Strapi env helper is available', () => {
  try {
    const { env } = require('@strapi/utils');
    console.log('  - @strapi/utils.env found');

    // Test basic functionality
    const testValue = env('NODE_ENV', 'test');
    console.log(`  - env() function works (NODE_ENV: ${testValue})`);
  } catch (error) {
    throw new Error(`Failed to load @strapi/utils: ${error.message}`);
  }
});

// Test 2: Check all DATABASE_* environment variables
runTest('Check DATABASE_* environment variables', () => {
  const dbVars = Object.keys(process.env).filter((key) => key.startsWith('DATABASE_'));

  if (dbVars.length === 0) {
    throw new Error('No DATABASE_* environment variables found!');
  }

  console.log(`  Found ${dbVars.length} DATABASE_* variables:`);
  dbVars.forEach((varName) => {
    // Mask sensitive values
    let value = process.env[varName];
    if (varName.includes('PASSWORD') || varName.includes('URL')) {
      value = '***MASKED***';
    }
    console.log(`  - ${varName}: ${value}`);
  });

  // Check required variables
  const required = ['DATABASE_CLIENT'];
  const missing = required.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Missing required variables: ${missing.join(', ')}`);
  }
});

// Test 3: Validate DATABASE_URL if using postgres
runTest('Validate DATABASE_URL (if using postgres)', () => {
  const client = process.env.DATABASE_CLIENT || 'postgres';
  console.log(`  - Database client: ${client}`);

  if (client === 'postgres') {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      throw new Error('DATABASE_URL is required for postgres but not set');
    }

    console.log('  - DATABASE_URL is set');

    // Try to parse it
    try {
      const url = new URL(dbUrl);
      console.log(`  - Protocol: ${url.protocol}`);
      console.log(`  - Host: ${url.hostname}:${url.port || 5432}`);
      console.log(`  - Database: ${url.pathname.substring(1)}`);
      console.log(`  - Username: ${url.username || 'not specified'}`);
      console.log(`  - Password: ${url.password ? '***SET***' : 'not specified'}`);

      // Validate it looks like a postgres URL
      if (!url.protocol.startsWith('postgres')) {
        throw new Error(
          `Invalid protocol: ${url.protocol} (expected postgres:// or postgresql://)`
        );
      }

      if (!url.hostname) {
        throw new Error('No hostname in DATABASE_URL');
      }

      if (!url.pathname || url.pathname === '/') {
        throw new Error('No database name in DATABASE_URL');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        throw new Error(`DATABASE_URL is not a valid URL: ${error.message}`);
      }
      throw error;
    }
  } else {
    console.log(`  - Skipping (not using postgres)`);
  }
});

// Test 4: Load database configuration
runTest('Load database.js configuration', () => {
  const configPath = path.join(__dirname, '..', 'config', 'database.js');
  console.log(`  - Config path: ${configPath}`);

  // Clear require cache to ensure fresh load
  delete require.cache[require.resolve(configPath)];

  let databaseConfig;
  try {
    databaseConfig = require(configPath);
    console.log('  - database.js loaded successfully');
  } catch (error) {
    throw new Error(`Failed to require database.js: ${error.message}`);
  }

  if (typeof databaseConfig !== 'function') {
    throw new Error(`database.js should export a function, got: ${typeof databaseConfig}`);
  }

  console.log('  - database.js exports a function');
});

// Test 5: Execute database configuration
runTest('Execute database configuration', () => {
  const configPath = path.join(__dirname, '..', 'config', 'database.js');
  delete require.cache[require.resolve(configPath)];

  const databaseConfig = require(configPath);

  // Create mock env helper
  const { env } = require('@strapi/utils');

  console.log('  - Executing config function...');
  console.log('');

  let config;
  try {
    config = databaseConfig({ env });
    console.log('');
    console.log('  - Config function executed successfully');
  } catch (error) {
    throw new Error(`Config execution failed: ${error.message}`);
  }

  if (!config) {
    throw new Error('Config function returned null/undefined');
  }

  console.log('  - Config returned a value');
});

// Test 6: Validate configuration structure
runTest('Validate configuration structure', () => {
  const configPath = path.join(__dirname, '..', 'config', 'database.js');
  delete require.cache[require.resolve(configPath)];

  const databaseConfig = require(configPath);
  const { env } = require('@strapi/utils');

  // Suppress console.log from config
  const originalLog = console.log;
  console.log = () => {};

  let config;
  try {
    config = databaseConfig({ env });
  } finally {
    console.log = originalLog;
  }

  // Validate structure
  if (!config || typeof config !== 'object') {
    throw new Error(`Config is not an object: ${typeof config}`);
  }

  if (!config.connection) {
    throw new Error('Missing top-level "connection" property');
  }

  if (!config.connection.client) {
    throw new Error('Missing "connection.client" property');
  }

  if (!config.connection.connection) {
    throw new Error('Missing nested "connection.connection" property');
  }

  console.log('  Structure validation:');
  console.log(`  - config.connection.client: "${config.connection.client}"`);
  console.log(`  - config.connection.connection: ${typeof config.connection.connection}`);
  console.log(`  - config.connection.pool: ${config.connection.pool ? 'present' : 'absent'}`);
  console.log(
    `  - config.connection.acquireConnectionTimeout: ${config.connection.acquireConnectionTimeout || 'not set'}`
  );

  // Validate client-specific requirements
  if (config.connection.client === 'postgres') {
    const conn = config.connection.connection;

    if (!conn.connectionString && !conn.host) {
      throw new Error('Postgres config missing both connectionString and host');
    }

    console.log('  Postgres-specific checks:');
    console.log(`  - connectionString: ${conn.connectionString ? 'present' : 'absent'}`);
    console.log(`  - host: ${conn.host || 'not set'}`);
    console.log(`  - port: ${conn.port || 'not set'}`);
    console.log(`  - database: ${conn.database || 'not set'}`);
    console.log(`  - ssl: ${conn.ssl ? 'enabled' : 'disabled'}`);
  }

  console.log('  ✓ All structure checks passed');
});

// Print summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

tests.forEach((test) => {
  const status = test.passed ? '✓' : '✗';
  console.log(`${status} ${test.name}`);
  if (!test.passed && test.error) {
    console.log(`  Error: ${test.error}`);
  }
});

console.log('');
console.log(`Total: ${tests.length} tests`);
console.log(`Passed: ${tests.filter((t) => t.passed).length}`);
console.log(`Failed: ${tests.filter((t) => !t.passed).length}`);
console.log('');

if (allPassed) {
  console.log('✓ All tests passed - configuration is valid');
  console.log('  Safe to proceed with build');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  process.exit(0);
} else {
  console.log('✗ Some tests failed - configuration is invalid');
  console.log('  DO NOT proceed with build');
  console.log('');
  console.log('  Troubleshooting:');
  console.log('  1. Check that all required environment variables are set');
  console.log('  2. Verify DATABASE_URL format is correct');
  console.log('  3. Review error messages above for specific issues');
  console.log('  4. Check Render Dashboard → Environment Variables');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  process.exit(1);
}
