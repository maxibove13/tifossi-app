#!/usr/bin/env node

/**
 * Database Configuration Validation Script
 *
 * This script validates the Strapi v5 database configuration before deployment.
 * It simulates Render's environment and tests multiple scenarios to catch configuration
 * errors before they cause deployment failures.
 *
 * Usage:
 *   node scripts/validate-db-config.js           # Normal mode with colors
 *   node scripts/validate-db-config.js --ci      # CI mode (minimal output)
 *   node scripts/validate-db-config.js --quiet   # Quiet mode (errors only)
 */

const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const ciMode = args.includes('--ci');
const quietMode = args.includes('--quiet');

// ANSI color codes for terminal output (disabled in CI mode)
const colors = ciMode ? {
  reset: '',
  green: '',
  red: '',
  yellow: '',
  blue: '',
  cyan: '',
  gray: '',
} : {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const symbols = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠',
};

// Logging functions that respect quiet and CI modes
function log(message) {
  if (!quietMode) {
    console.log(message);
  }
}

function logError(message) {
  console.error(message); // Always show errors
}

function logSuccess(message) {
  if (ciMode) {
    console.log(message); // In CI, just plain output
  } else if (!quietMode) {
    console.log(message); // In normal mode, show if not quiet
  }
}

// Mock environment helper that mimics Strapi's env() function
class EnvHelper {
  constructor(envVars = {}) {
    this.envVars = envVars;
  }

  // Get string value with optional default
  env(key, defaultValue) {
    return this.envVars[key] !== undefined ? this.envVars[key] : defaultValue;
  }

  // Get integer value
  int(key, defaultValue) {
    const value = this.envVars[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Get boolean value
  bool(key, defaultValue) {
    const value = this.envVars[key];
    if (value === undefined) return defaultValue;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1' || value === 1;
  }

  // Get array value
  array(key, defaultValue = []) {
    const value = this.envVars[key];
    if (value === undefined) return defaultValue;
    if (Array.isArray(value)) return value;
    return value.split(',').map(v => v.trim());
  }
}

// Mask sensitive values in output
function maskSensitive(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(maskSensitive);
  }

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitive(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

// Validate config structure matches Strapi v5 expectations
function validateConfigStructure(config, testName) {
  const errors = [];
  const warnings = [];

  // Check top-level structure
  if (!config || typeof config !== 'object') {
    errors.push('Config is not an object');
    return { errors, warnings };
  }

  if (!config.connection) {
    errors.push('Missing "connection" property at top level');
    return { errors, warnings };
  }

  const { connection } = config;

  // Check client property
  if (!connection.client) {
    errors.push('Missing "client" property in connection config');
  } else if (typeof connection.client !== 'string') {
    errors.push(`"client" must be a string, got ${typeof connection.client}`);
  }

  // Check connection property (nested)
  if (!connection.connection) {
    errors.push('Missing nested "connection" property');
  } else {
    const conn = connection.connection;

    // For Postgres, check required properties
    if (connection.client === 'postgres') {
      // Either connectionString OR individual params must be present
      const hasConnectionString = !!conn.connectionString;
      const hasIndividualParams = !!(conn.host && conn.port && conn.database && conn.user);

      if (!hasConnectionString && !hasIndividualParams) {
        errors.push('Postgres connection requires either connectionString OR (host, port, database, user)');
      }

      // Check SSL configuration
      if (conn.ssl !== undefined) {
        if (typeof conn.ssl === 'boolean') {
          if (conn.ssl) {
            warnings.push('SSL is set to boolean true, should be an object with rejectUnauthorized property');
          }
        } else if (typeof conn.ssl === 'object') {
          if (conn.ssl.rejectUnauthorized === undefined) {
            warnings.push('SSL object missing rejectUnauthorized property');
          }
        }
      }
    }
  }

  // Check pool configuration
  if (!connection.pool) {
    warnings.push('Missing "pool" configuration - connection pooling may not be optimized');
  } else {
    if (connection.pool.min === undefined) {
      warnings.push('Pool missing "min" property');
    }
    if (connection.pool.max === undefined) {
      warnings.push('Pool missing "max" property');
    }
  }

  // Check acquireConnectionTimeout
  if (!connection.acquireConnectionTimeout) {
    warnings.push('Missing "acquireConnectionTimeout" - may cause connection issues');
  }

  return { errors, warnings };
}

// Run a single test scenario
function runTest(testName, envVars, shouldPass = true) {
  log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`);
  log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

  try {
    // Create env helper with test environment variables
    const envHelper = new EnvHelper(envVars);

    // Create a mock env function that mimics Strapi's interface
    const env = (key, defaultValue) => envHelper.env(key, defaultValue);
    env.int = (key, defaultValue) => envHelper.int(key, defaultValue);
    env.bool = (key, defaultValue) => envHelper.bool(key, defaultValue);
    env.array = (key, defaultValue) => envHelper.array(key, defaultValue);

    // Load the database config
    const configPath = path.join(__dirname, '..', 'config', 'database.js');
    delete require.cache[require.resolve(configPath)];
    const databaseConfig = require(configPath);

    // Execute config function
    const config = databaseConfig({ env });

    // Log the generated config (masked) - skip in CI/quiet mode
    if (!ciMode && !quietMode) {
      log(`${colors.blue}Generated config:${colors.reset}`);
      log(JSON.stringify(maskSensitive(config), null, 2));
    }

    // Validate structure
    const { errors, warnings } = validateConfigStructure(config, testName);

    // Display warnings
    if (warnings.length > 0 && !quietMode) {
      warnings.forEach(warning => {
        log(`${colors.yellow}${symbols.warning} Warning: ${warning}${colors.reset}`);
      });
    }

    // Display errors
    if (errors.length > 0) {
      errors.forEach(error => {
        logError(`${colors.red}${symbols.error} Error: ${error}${colors.reset}`);
      });

      if (shouldPass) {
        logError(`${colors.red}${symbols.error} FAIL: ${testName}${colors.reset}`);
        return false;
      } else {
        logSuccess(`${colors.green}${symbols.success} PASS: ${testName} (failed as expected)${colors.reset}`);
        return true;
      }
    }

    // No errors - test passed
    if (shouldPass) {
      logSuccess(`${colors.green}${symbols.success} PASS: ${testName}${colors.reset}`);
      return true;
    } else {
      logError(`${colors.red}${symbols.error} FAIL: ${testName} (expected to fail but passed)${colors.reset}`);
      return false;
    }

  } catch (error) {
    logError(`${colors.red}${symbols.error} Exception in ${testName}: ${error.message}${colors.reset}`);
    if (!quietMode) {
      logError(`${colors.gray}${error.stack}${colors.reset}`);
    }

    if (shouldPass) {
      logError(`${colors.red}${symbols.error} FAIL: ${testName}${colors.reset}`);
      return false;
    } else {
      logSuccess(`${colors.green}${symbols.success} PASS: ${testName} (failed as expected)${colors.reset}`);
      return true;
    }
  }
}

// Main test suite
function runAllTests() {
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}Strapi v5 Database Configuration Validator${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);

  const results = [];

  // Test 1: Full DATABASE_URL (Render production scenario)
  results.push(runTest(
    'Render Production: DATABASE_URL with SSL',
    {
      DATABASE_CLIENT: 'postgres',
      DATABASE_URL: 'postgresql://user:password@postgres.render.com:5432/dbname',
      DATABASE_SSL: 'true',
      DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
      DATABASE_POOL_MIN: '2',
      DATABASE_POOL_MAX: '10',
      DATABASE_CONNECTION_TIMEOUT: '60000',
    },
    true
  ));

  // Test 2: Individual database parameters
  results.push(runTest(
    'Individual Parameters: host/port/database/user/password',
    {
      DATABASE_CLIENT: 'postgres',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'strapi',
      DATABASE_USERNAME: 'strapi',
      DATABASE_PASSWORD: 'strapi',
      DATABASE_SSL: 'false',
      DATABASE_POOL_MIN: '2',
      DATABASE_POOL_MAX: '10',
    },
    true
  ));

  // Test 3: SSL enabled with object configuration
  results.push(runTest(
    'SSL Configuration: enabled with rejectUnauthorized=false',
    {
      DATABASE_CLIENT: 'postgres',
      DATABASE_URL: 'postgresql://user:password@db.example.com:5432/mydb',
      DATABASE_SSL: 'true',
      DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
    },
    true
  ));

  // Test 4: SSL disabled
  results.push(runTest(
    'SSL Configuration: disabled',
    {
      DATABASE_CLIENT: 'postgres',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'strapi',
      DATABASE_USERNAME: 'strapi',
      DATABASE_PASSWORD: 'strapi',
      DATABASE_SSL: 'false',
    },
    true
  ));

  // Test 5: Default values fallback (should now fail with strict validation)
  results.push(runTest(
    'Default Values: minimal configuration (should fail)',
    {
      DATABASE_CLIENT: 'postgres',
    },
    false  // Changed to false - strict validation requires connection details
  ));

  // Test 6: SQLite configuration (alternative)
  results.push(runTest(
    'SQLite Configuration: local development',
    {
      DATABASE_CLIENT: 'sqlite',
      DATABASE_FILENAME: '.tmp/test.db',
    },
    true
  ));

  // Test 7: Missing client (should now fail with strict validation)
  results.push(runTest(
    'Missing DATABASE_CLIENT and connection details (should fail)',
    {},
    false  // Changed to false - strict validation requires connection details
  ));

  // Test 8: Invalid SSL boolean (edge case)
  results.push(runTest(
    'SSL as true boolean: should work but warn',
    {
      DATABASE_CLIENT: 'postgres',
      DATABASE_URL: 'postgresql://user:password@db.example.com:5432/mydb',
      DATABASE_SSL: 'true',
    },
    true
  ));

  // Print summary
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  const total = results.length;

  if (ciMode) {
    // CI mode: Minimal output
    if (failed === 0) {
      console.log(`Database config validation: ${passed}/${total} tests passed`);
    } else {
      console.error(`Database config validation: ${failed}/${total} tests failed`);
    }
  } else {
    // Normal mode: Full summary
    log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    log(`${colors.cyan}Test Summary${colors.reset}`);
    log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);

    log(`\nTotal tests: ${total}`);
    log(`${colors.green}${symbols.success} Passed: ${passed}${colors.reset}`);
    log(`${colors.red}${symbols.error} Failed: ${failed}${colors.reset}`);

    if (failed === 0) {
      log(`\n${colors.green}${symbols.success} All tests passed! Configuration is valid.${colors.reset}`);
    } else {
      log(`\n${colors.red}${symbols.error} Some tests failed. Please review the errors above.${colors.reset}`);
    }
  }

  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run the test suite
if (require.main === module) {
  runAllTests();
}

module.exports = { EnvHelper, validateConfigStructure, runTest };
