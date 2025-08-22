/**
 * Simple Analytics Service for Tifossi App
 * Provides basic event logging that can be connected to Firebase Analytics later
 */

class AnalyticsService {
  private enabled = __DEV__ ? false : true; // Only log in production

  logEvent(eventName: string, params?: Record<string, any>) {
    if (!this.enabled) return;

    // For now, just console log. Later can add Firebase

    // Future: Firebase.analytics().logEvent(eventName, params);
  }

  logError(error: Error, context?: string) {
    // Future: Firebase.crashlytics().recordError(error);
  }
}

export const analyticsService = new AnalyticsService();
