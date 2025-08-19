import { currentEnvironment, config } from '../_config/environment';

/**
 * React hook for feature flags
 */
import { useState, useEffect } from 'react';

/**
 * Feature Flag Types
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: ('development' | 'staging' | 'production')[];
  requiredVersion?: string;
  rolloutPercentage?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  enableRemoteFlags: boolean;
  remoteConfigUrl?: string;
  cacheTimeout: number;
  fallbackToLocal: boolean;
}

/**
 * Feature Flags Configuration
 */
const featureFlags: Record<string, FeatureFlag> = {
  // Authentication Features
  socialLogin: {
    key: 'socialLogin',
    name: 'Social Login',
    description: 'Enable Google, Facebook, and Apple login options',
    enabled: true,
    environments: ['development', 'staging', 'production'],
    requiredVersion: '1.0.0',
  },

  biometricAuth: {
    key: 'biometricAuth',
    name: 'Biometric Authentication',
    description: 'Enable fingerprint and face ID authentication',
    enabled: false,
    environments: ['development', 'staging'],
    requiredVersion: '1.1.0',
  },

  emailVerification: {
    key: 'emailVerification',
    name: 'Email Verification',
    description: 'Require email verification for new accounts',
    enabled: true,
    environments: ['staging', 'production'],
  },

  // E-commerce Features
  cart: {
    key: 'cart',
    name: 'Shopping Cart',
    description: 'Enable shopping cart functionality',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  wishlist: {
    key: 'wishlist',
    name: 'Wishlist/Favorites',
    description: 'Enable product wishlist and favorites',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  guestCheckout: {
    key: 'guestCheckout',
    name: 'Guest Checkout',
    description: 'Allow users to checkout without creating an account',
    enabled: false,
    environments: ['development', 'staging'],
    requiredVersion: '1.2.0',
  },

  savedPaymentMethods: {
    key: 'savedPaymentMethods',
    name: 'Saved Payment Methods',
    description: 'Allow users to save payment methods for future purchases',
    enabled: false,
    environments: ['development'],
    requiredVersion: '1.3.0',
  },

  // Search and Discovery
  advancedSearch: {
    key: 'advancedSearch',
    name: 'Advanced Search',
    description: 'Enable advanced search filters and sorting options',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  searchSuggestions: {
    key: 'searchSuggestions',
    name: 'Search Suggestions',
    description: 'Show search suggestions and autocomplete',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  productRecommendations: {
    key: 'productRecommendations',
    name: 'Product Recommendations',
    description: 'Show AI-powered product recommendations',
    enabled: false,
    environments: ['development', 'staging'],
    requiredVersion: '1.4.0',
    rolloutPercentage: 25,
  },

  // Payment Features
  mercadoPagoPayments: {
    key: 'mercadoPagoPayments',
    name: 'MercadoPago Payments',
    description: 'Enable MercadoPago payment processing',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  applePay: {
    key: 'applePay',
    name: 'Apple Pay',
    description: 'Enable Apple Pay payment option',
    enabled: false,
    environments: ['development', 'staging'],
    requiredVersion: '1.2.0',
  },

  googlePay: {
    key: 'googlePay',
    name: 'Google Pay',
    description: 'Enable Google Pay payment option',
    enabled: false,
    environments: ['development', 'staging'],
    requiredVersion: '1.2.0',
  },

  installmentPayments: {
    key: 'installmentPayments',
    name: 'Installment Payments',
    description: 'Enable installment payment options',
    enabled: true,
    environments: ['staging', 'production'],
  },

  // UI/UX Features
  darkMode: {
    key: 'darkMode',
    name: 'Dark Mode',
    description: 'Enable dark theme option',
    enabled: false,
    environments: ['development'],
    requiredVersion: '1.1.0',
  },

  animations: {
    key: 'animations',
    name: 'Enhanced Animations',
    description: 'Enable enhanced UI animations and transitions',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  hapticFeedback: {
    key: 'hapticFeedback',
    name: 'Haptic Feedback',
    description: 'Enable haptic feedback for interactions',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  pullToRefresh: {
    key: 'pullToRefresh',
    name: 'Pull to Refresh',
    description: 'Enable pull-to-refresh functionality',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  // Analytics and Tracking
  analytics: {
    key: 'analytics',
    name: 'Analytics Tracking',
    description: 'Enable analytics and usage tracking',
    enabled: config.enableAnalytics,
    environments: ['staging', 'production'],
  },

  crashReporting: {
    key: 'crashReporting',
    name: 'Crash Reporting',
    description: 'Enable crash reporting and error tracking',
    enabled: config.enableErrorReporting,
    environments: ['staging', 'production'],
  },

  performanceMonitoring: {
    key: 'performanceMonitoring',
    name: 'Performance Monitoring',
    description: 'Enable performance monitoring and metrics',
    enabled: false,
    environments: ['development', 'staging'],
    rolloutPercentage: 10,
  },

  // Notification Features
  pushNotifications: {
    key: 'pushNotifications',
    name: 'Push Notifications',
    description: 'Enable push notifications',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  inAppNotifications: {
    key: 'inAppNotifications',
    name: 'In-App Notifications',
    description: 'Enable in-app notification system',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  emailNotifications: {
    key: 'emailNotifications',
    name: 'Email Notifications',
    description: 'Enable email notifications for orders and updates',
    enabled: true,
    environments: ['staging', 'production'],
  },

  // Social Features
  productReviews: {
    key: 'productReviews',
    name: 'Product Reviews',
    description: 'Enable product reviews and ratings',
    enabled: false,
    environments: ['development', 'staging'],
    requiredVersion: '1.3.0',
  },

  socialSharing: {
    key: 'socialSharing',
    name: 'Social Sharing',
    description: 'Enable sharing products on social media',
    enabled: true,
    environments: ['development', 'staging', 'production'],
  },

  // Admin and Debug Features
  debugMode: {
    key: 'debugMode',
    name: 'Debug Mode',
    description: 'Enable debug tools and information',
    enabled: config.debug,
    environments: ['development'],
  },

  adminPanel: {
    key: 'adminPanel',
    name: 'Admin Panel Access',
    description: 'Enable admin panel access within the app',
    enabled: false,
    environments: ['development'],
  },

  apiMocking: {
    key: 'apiMocking',
    name: 'API Mocking',
    description: 'Use mock API responses instead of real API calls',
    enabled: config.useMockApi,
    environments: ['development'],
  },

  // Experimental Features
  newProductDisplay: {
    key: 'newProductDisplay',
    name: 'New Product Display',
    description: 'Test new product card design and layout',
    enabled: false,
    environments: ['development'],
    rolloutPercentage: 50,
  },

  enhancedFilters: {
    key: 'enhancedFilters',
    name: 'Enhanced Filters',
    description: 'New filtering system with advanced options',
    enabled: false,
    environments: ['development', 'staging'],
    rolloutPercentage: 30,
  },
};

/**
 * Feature Flag Manager
 */
class FeatureFlagManager {
  private flags: Record<string, FeatureFlag>;
  private remoteFlags: Record<string, FeatureFlag> = {};
  private lastFetchTime = 0;

  constructor(initialFlags: Record<string, FeatureFlag>) {
    this.flags = { ...initialFlags };
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string, userId?: string): boolean {
    const flag = this.getFlag(flagKey);
    if (!flag) {
      console.warn(`[FeatureFlags] Flag '${flagKey}' not found`);
      return false;
    }

    // Check if environment supports this flag
    if (!flag.environments.includes(currentEnvironment)) {
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check version requirements
    if (flag.requiredVersion && !this.meetsVersionRequirement(flag.requiredVersion)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      return this.isInRollout(flagKey, flag.rolloutPercentage, userId);
    }

    // Check dependencies
    if (flag.dependencies) {
      for (const dependency of flag.dependencies) {
        if (!this.isEnabled(dependency, userId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get flag configuration
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.remoteFlags[flagKey] || this.flags[flagKey];
  }

  /**
   * Get all flags for current environment
   */
  getAllFlags(): Record<string, FeatureFlag> {
    const environmentFlags: Record<string, FeatureFlag> = {};

    Object.entries({ ...this.flags, ...this.remoteFlags }).forEach(([key, flag]) => {
      if (flag.environments.includes(currentEnvironment)) {
        environmentFlags[key] = flag;
      }
    });

    return environmentFlags;
  }

  /**
   * Get enabled flags only
   */
  getEnabledFlags(userId?: string): string[] {
    return Object.keys(this.getAllFlags()).filter((key) => this.isEnabled(key, userId));
  }

  /**
   * Check version requirement
   */
  private meetsVersionRequirement(requiredVersion: string): boolean {
    const currentVersion = config.version;
    // Simple version comparison (you might want to use a more robust library)
    return currentVersion >= requiredVersion;
  }

  /**
   * Check if user is in rollout percentage
   */
  private isInRollout(flagKey: string, percentage: number, userId?: string): boolean {
    // Use a consistent hash-based approach for rollout
    const hashInput = `${flagKey}:${userId || 'anonymous'}:${config.version}`;
    const hash = this.simpleHash(hashInput);
    const userPercentile = hash % 100;
    return userPercentile < percentage;
  }

  /**
   * Simple hash function for rollout consistency
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Override flag for testing
   */
  override(flagKey: string, enabled: boolean): void {
    if (config.debug) {
      if (this.flags[flagKey]) {
        this.flags[flagKey] = { ...this.flags[flagKey], enabled };
        console.log(`[FeatureFlags] Override '${flagKey}' = ${enabled}`);
      }
    }
  }

  /**
   * Reset all overrides
   */
  resetOverrides(): void {
    if (config.debug) {
      this.flags = { ...featureFlags };
      console.log('[FeatureFlags] All overrides reset');
    }
  }

  /**
   * Fetch remote flags (for future use)
   */
  async fetchRemoteFlags(): Promise<void> {
    if (!config.enableFeatureFlags) {
      return;
    }

    const now = Date.now();
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes

    if (now - this.lastFetchTime < cacheTimeout) {
      return; // Use cached flags
    }

    try {
      // Implementation would fetch from remote config service
      // For now, this is a placeholder
      console.log('[FeatureFlags] Remote flags fetching not implemented yet');
      this.lastFetchTime = now;
    } catch (error) {
      console.error('[FeatureFlags] Failed to fetch remote flags:', error);
    }
  }

  /**
   * Get flag status for debugging
   */
  getDebugInfo(): Record<string, any> {
    if (!config.debug) {
      return {};
    }

    return {
      environment: currentEnvironment,
      totalFlags: Object.keys(this.flags).length,
      enabledFlags: this.getEnabledFlags().length,
      remoteFlags: Object.keys(this.remoteFlags).length,
      lastFetch: this.lastFetchTime,
      flags: this.getAllFlags(),
    };
  }
}

/**
 * Global feature flag manager instance
 */
export const featureFlagManager = new FeatureFlagManager(featureFlags);

/**
 * Convenience function to check if a feature is enabled
 */
export const isFeatureEnabled = (flagKey: string, userId?: string): boolean => {
  return featureFlagManager.isEnabled(flagKey, userId);
};

export const useFeatureFlag = (flagKey: string, userId?: string) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [flag, setFlag] = useState<FeatureFlag | undefined>(undefined);

  useEffect(() => {
    const flagData = featureFlagManager.getFlag(flagKey);
    const enabled = featureFlagManager.isEnabled(flagKey, userId);

    setFlag(flagData);
    setIsEnabled(enabled);
  }, [flagKey, userId]);

  return { isEnabled, flag };
};

/**
 * React hook for multiple feature flags
 */
export const useFeatureFlags = (flagKeys: string[], userId?: string) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const flagStates: Record<string, boolean> = {};
    flagKeys.forEach((key) => {
      flagStates[key] = featureFlagManager.isEnabled(key, userId);
    });
    setFlags(flagStates);
  }, [flagKeys, userId]);

  return flags;
};

/**
 * Feature flag constants for easy access
 */
export const FEATURE_FLAGS = {
  // Authentication
  SOCIAL_LOGIN: 'socialLogin',
  BIOMETRIC_AUTH: 'biometricAuth',
  EMAIL_VERIFICATION: 'emailVerification',

  // E-commerce
  CART: 'cart',
  WISHLIST: 'wishlist',
  GUEST_CHECKOUT: 'guestCheckout',
  SAVED_PAYMENT_METHODS: 'savedPaymentMethods',

  // Search
  ADVANCED_SEARCH: 'advancedSearch',
  SEARCH_SUGGESTIONS: 'searchSuggestions',
  PRODUCT_RECOMMENDATIONS: 'productRecommendations',

  // Payments
  MERCADO_PAGO: 'mercadoPagoPayments',
  APPLE_PAY: 'applePay',
  GOOGLE_PAY: 'googlePay',
  INSTALLMENT_PAYMENTS: 'installmentPayments',

  // UI/UX
  DARK_MODE: 'darkMode',
  ANIMATIONS: 'animations',
  HAPTIC_FEEDBACK: 'hapticFeedback',
  PULL_TO_REFRESH: 'pullToRefresh',

  // Analytics
  ANALYTICS: 'analytics',
  CRASH_REPORTING: 'crashReporting',
  PERFORMANCE_MONITORING: 'performanceMonitoring',

  // Notifications
  PUSH_NOTIFICATIONS: 'pushNotifications',
  IN_APP_NOTIFICATIONS: 'inAppNotifications',
  EMAIL_NOTIFICATIONS: 'emailNotifications',

  // Social
  PRODUCT_REVIEWS: 'productReviews',
  SOCIAL_SHARING: 'socialSharing',

  // Debug
  DEBUG_MODE: 'debugMode',
  ADMIN_PANEL: 'adminPanel',
  API_MOCKING: 'apiMocking',

  // Experimental
  NEW_PRODUCT_DISPLAY: 'newProductDisplay',
  ENHANCED_FILTERS: 'enhancedFilters',
} as const;

// Default export for easy access
const featureFlagsExport = {
  manager: featureFlagManager,
  isEnabled: isFeatureEnabled,
  useFeatureFlag,
  useFeatureFlags,
  FEATURE_FLAGS,
};

export default featureFlagsExport;
