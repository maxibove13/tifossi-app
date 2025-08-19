import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Environment Types
 */
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  debug: boolean;
  apiTimeout: number;
  mockDelay: number;
  useMockApi: boolean;
  enableConsoleLogging: boolean;
  enableErrorReporting: boolean;
  enableAnalytics: boolean;
  enableFeatureFlags: boolean;
  version: string;
  buildNumber: string;
  bundleId: string;
}

/**
 * Environment Detection
 */
const detectEnvironment = (): Environment => {
  // Check if we're in Expo Go development
  if (__DEV__ && Constants.appOwnership === 'expo') {
    return 'development';
  }

  // Check for explicit environment variable
  const explicitEnv = process.env.EXPO_PUBLIC_ENVIRONMENT as Environment;
  if (explicitEnv && ['development', 'staging', 'production'].includes(explicitEnv)) {
    return explicitEnv;
  }

  // Check release channel for EAS builds
  const releaseChannel = Constants.expoConfig?.runtimeVersion;

  if (releaseChannel && typeof releaseChannel === 'string') {
    if (releaseChannel.includes('staging')) return 'staging';
    if (releaseChannel.includes('production') || releaseChannel === 'default') return 'production';
  }

  // Check if we're in development mode
  if (__DEV__) {
    return 'development';
  }

  // Default to production for safety
  return 'production';
};

/**
 * Environment Configurations
 */
const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    displayName: 'Development',
    debug: true,
    apiTimeout: 10000,
    mockDelay: 500,
    useMockApi: true,
    enableConsoleLogging: true,
    enableErrorReporting: false,
    enableAnalytics: false,
    enableFeatureFlags: true,
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber:
      Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode?.toString() ||
      '1',
    bundleId:
      Constants.expoConfig?.ios?.bundleIdentifier ||
      Constants.expoConfig?.android?.package ||
      'com.anonymous.tifossi',
  },
  staging: {
    name: 'staging',
    displayName: 'Staging',
    debug: true,
    apiTimeout: 15000,
    mockDelay: 200,
    useMockApi: false,
    enableConsoleLogging: true,
    enableErrorReporting: true,
    enableAnalytics: false,
    enableFeatureFlags: true,
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber:
      Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode?.toString() ||
      '1',
    bundleId:
      Constants.expoConfig?.ios?.bundleIdentifier ||
      Constants.expoConfig?.android?.package ||
      'com.tifossi.staging',
  },
  production: {
    name: 'production',
    displayName: 'Production',
    debug: false,
    apiTimeout: 20000,
    mockDelay: 0,
    useMockApi: false,
    enableConsoleLogging: false,
    enableErrorReporting: true,
    enableAnalytics: true,
    enableFeatureFlags: false,
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber:
      Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode?.toString() ||
      '1',
    bundleId:
      Constants.expoConfig?.ios?.bundleIdentifier ||
      Constants.expoConfig?.android?.package ||
      'com.tifossi.app',
  },
};

/**
 * Current Environment
 */
export const currentEnvironment = detectEnvironment();
export const config = environmentConfigs[currentEnvironment];

/**
 * Environment Utilities
 */
export const isDevelopment = currentEnvironment === 'development';
export const isStaging = currentEnvironment === 'staging';
export const isProduction = currentEnvironment === 'production';
export const isDebugMode = config.debug;

/**
 * Platform Utilities
 */
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

/**
 * Environment Info for Debug/Testing
 */
export const getEnvironmentInfo = () => ({
  environment: currentEnvironment,
  platform: Platform.OS,
  version: config.version,
  buildNumber: config.buildNumber,
  bundleId: config.bundleId,
  debug: config.debug,
  appOwnership: Constants.appOwnership,
  releaseChannel: Constants.expoConfig?.runtimeVersion,
  expoVersion: Constants.expoConfig?.sdkVersion,
});

/**
 * Environment Validation
 */
export const validateEnvironment = (): boolean => {
  try {
    // Check if all required config properties are present
    const requiredProps: (keyof EnvironmentConfig)[] = [
      'name',
      'displayName',
      'debug',
      'apiTimeout',
      'mockDelay',
      'useMockApi',
      'enableConsoleLogging',
      'enableErrorReporting',
      'enableAnalytics',
      'enableFeatureFlags',
      'version',
      'buildNumber',
      'bundleId',
    ];

    for (const prop of requiredProps) {
      if (config[prop] === undefined || config[prop] === null) {
        console.error(`[Environment] Missing required config property: ${prop}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[Environment] Validation failed:', error);
    return false;
  }
};

/**
 * Environment Banner Info (for development builds)
 */
export const getEnvironmentBanner = () => {
  if (isProduction) return null;

  return {
    text: `${config.displayName} Environment`,
    backgroundColor: isDevelopment ? '#4A90E2' : '#F5A623',
    textColor: '#FFFFFF',
    fontSize: 12,
    show: isDevelopment || isStaging,
  };
};

/**
 * Safe Console Logging
 */
export const safeLog = (...args: any[]) => {
  if (config.enableConsoleLogging) {
    console.log(`[${config.displayName}]`, ...args);
  }
};

export const safeWarn = (...args: any[]) => {
  if (config.enableConsoleLogging) {
    console.warn(`[${config.displayName}]`, ...args);
  }
};

export const safeError = (...args: any[]) => {
  if (config.enableConsoleLogging) {
    console.error(`[${config.displayName}]`, ...args);
  }
};

// Default export for easy access
const environmentExport = {
  current: currentEnvironment,
  config,
  isDevelopment,
  isStaging,
  isProduction,
  isDebugMode,
  isIOS,
  isAndroid,
  isWeb,
  getEnvironmentInfo,
  validateEnvironment,
  getEnvironmentBanner,
  safeLog,
  safeWarn,
  safeError,
};

export default environmentExport;
