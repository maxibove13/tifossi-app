/**
 * Device Fingerprint Service for MercadoPago Fraud Prevention
 * Generates unique device identifiers for payment security
 */

import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface DeviceFingerprint {
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  timestamp: string;
}

class DeviceFingerprintService {
  private cachedFingerprint: DeviceFingerprint | null = null;

  /**
   * Generate device fingerprint for MercadoPago fraud prevention
   * This creates a unique identifier for the device to improve approval rates
   */
  async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    // Return cached fingerprint if available (doesn't change during app session)
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    try {
      const fingerprint: DeviceFingerprint = {
        // Use expo-application to generate a consistent device ID
        deviceId: await this.generateDeviceId(),
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        timestamp: new Date().toISOString(),
      };

      // Cache for session
      this.cachedFingerprint = fingerprint;

      return fingerprint;
    } catch (error) {
      console.error('[DeviceFingerprint] Error generating fingerprint:', error);

      // Fallback fingerprint
      const fallbackFingerprint: DeviceFingerprint = {
        deviceId: await this.generateFallbackDeviceId(),
        platform: Platform.OS,
        osVersion: 'unknown',
        appVersion: '1.0.0',
        timestamp: new Date().toISOString(),
      };

      this.cachedFingerprint = fallbackFingerprint;
      return fallbackFingerprint;
    }
  }

  /**
   * Generate device ID using expo-application and expo-secure-store
   * This creates a persistent identifier for the device
   *
   * On Android: Uses Application.androidId (unique per device + app combination)
   * On iOS: Generates and stores a UUID in SecureStore (persists across app restarts)
   * On Web: Uses session-based fallback (SecureStore unavailable)
   */
  private async generateDeviceId(): Promise<string> {
    try {
      // Android: Use androidId from expo-application
      if (Platform.OS === 'android') {
        const androidId = await Application.getAndroidId();
        if (androidId) {
          return androidId;
        }
      }

      // Web: SecureStore is unavailable, use fallback
      if (Platform.OS === 'web') {
        return this.generateFallbackDeviceId();
      }

      // iOS: Use stored UUID or generate a new one
      const DEVICE_ID_KEY = 'tifossi_device_id';

      // Try to get existing device ID from secure store
      const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (existingId) {
        return existingId;
      }

      // Generate new UUID for iOS
      const newDeviceId = this.generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);

      return newDeviceId;
    } catch (error) {
      console.error('[DeviceFingerprint] Error generating device ID:', error);
      // Fall back to session-based ID
      return this.generateFallbackDeviceId();
    }
  }

  /**
   * Generate fallback device ID when primary methods fail
   * This creates a session-based ID (not persisted across app restarts)
   */
  private async generateFallbackDeviceId(): Promise<string> {
    try {
      // Generate a session-based ID using timestamp and random values
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      return `${Platform.OS}-${timestamp}-${random}`;
    } catch {
      // Ultimate fallback if even Platform.OS fails
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      return `unknown-${timestamp}-${random}`;
    }
  }

  /**
   * Generate a UUID v4 for device identification
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get device ID only (for simple use cases)
   */
  async getDeviceId(): Promise<string> {
    const fingerprint = await this.getDeviceFingerprint();
    return fingerprint.deviceId;
  }

  /**
   * Clear cached fingerprint (useful for testing)
   */
  clearCache(): void {
    this.cachedFingerprint = null;
  }
}

// Export singleton instance
export const deviceFingerprintService = new DeviceFingerprintService();
export default deviceFingerprintService;
