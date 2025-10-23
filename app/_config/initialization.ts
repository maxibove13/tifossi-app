/**
 * App Initialization and Configuration Validation
 *
 * This module ensures all required configuration is present
 * and validates it early to fail fast if misconfigured.
 */

import { initializeEndpoints } from './endpoints';
import {
  validateEnvironment,
  getEnvironmentInfo,
  currentEnvironment,
  safeLog,
  safeError,
  safeWarn,
} from './environment';
import { networkService } from '../_services/network/NetworkService';

/**
 * Critical configuration that must be present
 */
interface RequiredConfig {
  apiUrl: boolean;
  firebase: boolean;
  environment: boolean;
}

/**
 * Check if all required environment variables are present
 */
const checkRequiredEnvVars = (): RequiredConfig => {
  const config: RequiredConfig = {
    apiUrl: !!(process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BACKEND_URL),
    firebase: !!(
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
    ),
    environment: !!currentEnvironment,
  };

  // In development, Firebase is optional for local testing
  if (currentEnvironment === 'development') {
    config.firebase = true; // Don't require Firebase in dev
  }

  return config;
};

/**
 * Initialize the application configuration
 * This should be called as early as possible in the app lifecycle
 */
export const initializeApp = (): void => {
  safeLog('🚀 Initializing Tifossi App...');

  // Get environment info
  const envInfo = getEnvironmentInfo();
  safeLog('📱 Environment:', envInfo);

  // Validate environment configuration
  if (!validateEnvironment()) {
    throw new Error('INVALID_ENVIRONMENT: Environment validation failed');
  }

  // Check required environment variables
  const requiredConfig = checkRequiredEnvVars();
  const missingConfigs: string[] = [];

  if (!requiredConfig.apiUrl) {
    missingConfigs.push('API URL (EXPO_PUBLIC_API_BASE_URL)');
  }
  if (!requiredConfig.firebase) {
    missingConfigs.push('Firebase configuration');
  }
  if (!requiredConfig.environment) {
    missingConfigs.push('Environment configuration');
  }

  // Fail fast if critical config is missing
  if (missingConfigs.length > 0) {
    const errorMsg = `
🚨 MISSING CRITICAL CONFIGURATION

The following required configuration is missing:
${missingConfigs.map((c) => `  - ${c}`).join('\n')}

Please ensure all required environment variables are set in your .env file.
See .env.example for the complete list.

Current environment: ${currentEnvironment}
`;
    safeError(errorMsg);

    // In production/staging, throw error to prevent app from starting
    if (currentEnvironment !== 'development') {
      throw new Error(`MISSING_CONFIG: ${missingConfigs.join(', ')}`);
    }
  }

  // Initialize and validate API endpoints
  try {
    initializeEndpoints();
  } catch (error) {
    safeError('❌ Failed to initialize API endpoints:', error);

    // In production/staging, re-throw to prevent app from starting
    if (currentEnvironment !== 'development') {
      throw error;
    }
  }

  // Initialize network monitoring
  try {
    networkService.initialize();
    safeLog('✅ Network monitoring initialized');
  } catch (error) {
    safeError('❌ Failed to initialize network monitoring:', error);
    // Non-critical, don't throw
  }

  safeLog('✅ App initialization complete');
};

/**
 * Get configuration status for debugging
 */
export const getConfigStatus = () => {
  const config = checkRequiredEnvVars();
  const envInfo = getEnvironmentInfo();

  return {
    environment: envInfo,
    configStatus: {
      apiUrl: config.apiUrl ? '✅ Configured' : '❌ Missing',
      firebase: config.firebase ? '✅ Configured' : '❌ Missing',
      environment: config.environment ? '✅ Configured' : '❌ Missing',
    },
    apiEndpoint:
      process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'NOT_SET',
  };
};

/**
 * Display configuration warning in development
 */
export const showConfigWarning = (): void => {
  if (currentEnvironment === 'development') {
    const status = getConfigStatus();

    if (!status.configStatus.apiUrl) {
      safeWarn(`
⚠️  DEVELOPMENT WARNING: API URL not configured

   The app is using default localhost:1337
   To connect to a different backend, set EXPO_PUBLIC_API_BASE_URL in .env

   Example:
   EXPO_PUBLIC_API_BASE_URL=https://staging-api.tifossi.app
`);
    }
  }
};

// Export for use in app entry point
export default {
  initialize: initializeApp,
  getStatus: getConfigStatus,
  showWarning: showConfigWarning,
};
