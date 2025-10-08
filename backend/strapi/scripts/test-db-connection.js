#!/usr/bin/env node

/**
 * Database Connection Test Script
 *
 * This script attempts to establish a real connection to the PostgreSQL database
 * to verify that:
 * 1. The database is accessible
 * 2. The connection string is valid
 * 3. SSL configuration is correct
 * 4. Authentication credentials are valid
 *
 * This is a TEMPORARY diagnostic tool to identify deployment issues.
 * Remove from start command once root cause is identified.
 *
 * Usage:
 *   node scripts/test-db-connection.js
 *
 * Exit codes:
 *   0 = Success, database is accessible
 *   1 = Failure, database connection failed
 */

const { Client } = require('pg');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔌 Database Connection Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Get database configuration from environment
const client = process.env.DATABASE_CLIENT || 'postgres';

console.log('Environment:');
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  - DATABASE_CLIENT: ${client}`);
console.log('');

// Only test if using PostgreSQL
if (client !== 'postgres') {
  console.log(`Skipping connection test (DATABASE_CLIENT is "${client}", not "postgres")`);
  console.log('✓ No action needed');
  console.log('');
  process.exit(0);
}

// Validate DATABASE_URL is present
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('✗ ERROR: DATABASE_URL is not set');
  console.error('');
  console.error('The DATABASE_URL environment variable is required for PostgreSQL.');
  console.error('');
  console.error('Troubleshooting:');
  console.error('  1. Check Render Dashboard → Service → Environment Variables');
  console.error('  2. Verify PostgreSQL service is created and running');
  console.error('  3. Ensure render.yaml has "fromDatabase" configuration');
  console.error('  4. Check that the database name matches in render.yaml');
  console.error('');
  process.exit(1);
}

console.log('DATABASE_URL:');

// Parse and display connection details (without password)
try {
  const url = new URL(dbUrl);
  console.log(`  - Protocol: ${url.protocol}`);
  console.log(`  - Host: ${url.hostname}`);
  console.log(`  - Port: ${url.port || 5432}`);
  console.log(`  - Database: ${url.pathname.substring(1)}`);
  console.log(`  - Username: ${url.username || 'not specified'}`);
  console.log(`  - Password: ${url.password ? '***SET***' : 'not specified'}`);
  console.log('');
} catch (error) {
  console.error('✗ ERROR: Invalid DATABASE_URL format');
  console.error(`  ${error.message}`);
  console.error('');
  console.error('DATABASE_URL should be in format:');
  console.error('  postgresql://username:password@hostname:port/database');
  console.error('');
  process.exit(1);
}

// Build connection configuration
const sslEnabled = process.env.DATABASE_SSL === 'true';
const sslRejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

console.log('SSL Configuration:');
console.log(`  - DATABASE_SSL: ${process.env.DATABASE_SSL || 'not set (defaulting to false)'}`);
console.log(`  - DATABASE_SSL_REJECT_UNAUTHORIZED: ${process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'not set (defaulting to true)'}`);
console.log(`  - Effective SSL: ${sslEnabled ? 'enabled' : 'disabled'}`);
if (sslEnabled) {
  console.log(`  - Reject Unauthorized: ${sslRejectUnauthorized}`);
}
console.log('');

// Create PostgreSQL client
const pgClient = new Client({
  connectionString: dbUrl,
  ssl: sslEnabled ? {
    rejectUnauthorized: sslRejectUnauthorized,
  } : false,
  connectionTimeoutMillis: 10000, // 10 second timeout
});

console.log('Attempting to connect to database...');
console.log('');

// Attempt connection
(async () => {
  try {
    // Connect
    await pgClient.connect();
    console.log('✓ Connection established successfully');
    console.log('');

    // Test a simple query
    console.log('Running test query: SELECT version()');
    const result = await pgClient.query('SELECT version()');

    if (result.rows && result.rows.length > 0) {
      const version = result.rows[0].version;
      console.log('✓ Query executed successfully');
      console.log('');
      console.log('PostgreSQL version:');
      console.log(`  ${version.split(',')[0]}`);
      console.log('');
    }

    // Test schema access
    console.log('Testing schema access...');
    const schemaResult = await pgClient.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = $1
    `, ['public']);

    if (schemaResult.rows && schemaResult.rows.length > 0) {
      console.log('✓ Schema access verified (public schema exists)');
      console.log('');
    } else {
      console.log('⚠ Warning: public schema not found');
      console.log('  This may be normal for a fresh database');
      console.log('');
    }

    // Check if Strapi tables exist (optional)
    console.log('Checking for existing Strapi tables...');
    const tablesResult = await pgClient.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'strapi_%'
    `);

    const strapiTableCount = parseInt(tablesResult.rows[0].count, 10);
    if (strapiTableCount > 0) {
      console.log(`✓ Found ${strapiTableCount} Strapi tables (existing database)`);
    } else {
      console.log('  No Strapi tables found (fresh database - this is normal for first deploy)');
    }
    console.log('');

    // Close connection
    await pgClient.end();
    console.log('✓ Connection closed gracefully');
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Database connection test PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Database is accessible and ready for Strapi');
    console.log('');
    process.exit(0);

  } catch (error) {
    console.error('✗ Database connection FAILED');
    console.error('');
    console.error('Error details:');
    console.error(`  Type: ${error.constructor.name}`);
    console.error(`  Message: ${error.message}`);

    if (error.code) {
      console.error(`  Code: ${error.code}`);
    }

    console.error('');

    // Provide specific troubleshooting based on error
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('Troubleshooting (DNS/Hostname):');
      console.error('  - Hostname cannot be resolved');
      console.error('  - Check DATABASE_URL hostname is correct');
      console.error('  - Verify PostgreSQL service is running in Render');
      console.error('  - Check network connectivity');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('Troubleshooting (Connection Refused):');
      console.error('  - PostgreSQL server is not accepting connections');
      console.error('  - Check PostgreSQL service is running');
      console.error('  - Verify port number is correct (usually 5432)');
      console.error('  - Check firewall rules');
    } else if (error.message.includes('password authentication failed')) {
      console.error('Troubleshooting (Authentication):');
      console.error('  - Username or password is incorrect');
      console.error('  - Verify DATABASE_URL has correct credentials');
      console.error('  - Check PostgreSQL user exists and has correct password');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('Troubleshooting (Database):');
      console.error('  - Database specified in DATABASE_URL does not exist');
      console.error('  - Verify database name is correct');
      console.error('  - Check PostgreSQL service has created the database');
    } else if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.error('Troubleshooting (SSL):');
      console.error('  - SSL configuration mismatch');
      console.error('  - Try setting DATABASE_SSL=true');
      console.error('  - Try setting DATABASE_SSL_REJECT_UNAUTHORIZED=false');
      console.error('  - Check if PostgreSQL requires SSL');
    } else if (error.message.includes('timeout')) {
      console.error('Troubleshooting (Timeout):');
      console.error('  - Connection attempt timed out');
      console.error('  - Check network connectivity');
      console.error('  - Verify PostgreSQL service is running');
      console.error('  - Check for firewall/security group issues');
    } else {
      console.error('Troubleshooting (General):');
      console.error('  - Check Render Dashboard for PostgreSQL service status');
      console.error('  - Verify all environment variables are set correctly');
      console.error('  - Review PostgreSQL logs in Render Dashboard');
      console.error('  - Check Render service is in same region as database');
    }

    console.error('');

    // Print full stack trace for debugging
    if (error.stack) {
      console.error('Full stack trace:');
      console.error(error.stack);
      console.error('');
    }

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('✗ Database connection test FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');

    try {
      await pgClient.end();
    } catch (closeError) {
      // Ignore errors when closing failed connection
    }

    process.exit(1);
  }
})();
