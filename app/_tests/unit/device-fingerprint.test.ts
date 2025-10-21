/**
 * Device Fingerprint Service Tests
 * Tests device ID generation for MercadoPago fraud prevention
 */

import { deviceFingerprintService } from '../../_services/device/fingerprint';

// Mock expo-application
jest.mock('expo-application', () => ({
  __esModule: true,
  nativeApplicationVersion: '1.0.0',
  getAndroidId: jest.fn().mockResolvedValue('test-android-id-123'),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: jest.fn().mockResolvedValue('test-stored-device-id'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '17.0',
  select: jest.fn((obj) => obj.ios),
}));

describe('DeviceFingerprintService', () => {
  beforeEach(() => {
    // Clear cache before each test
    deviceFingerprintService.clearCache();
  });

  describe('getDeviceFingerprint', () => {
    it('should generate device fingerprint with all required fields', async () => {
      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();

      expect(fingerprint).toHaveProperty('deviceId');
      expect(fingerprint).toHaveProperty('platform');
      expect(fingerprint).toHaveProperty('osVersion');
      expect(fingerprint).toHaveProperty('appVersion');
      expect(fingerprint).toHaveProperty('timestamp');

      expect(typeof fingerprint.deviceId).toBe('string');
      expect(fingerprint.deviceId.length).toBeGreaterThan(0);
      expect(fingerprint.platform).toBe('ios');
      expect(fingerprint.appVersion).toBe('1.0.0');
    });

    it('should use stored device ID from secure store on iOS', async () => {
      // Mock SecureStore to return a stored ID
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync.mockResolvedValueOnce('test-stored-device-id');

      // Clear cache to force fresh ID generation
      deviceFingerprintService.clearCache();

      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();

      expect(fingerprint.deviceId).toBe('test-stored-device-id');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('tifossi_device_id');
    });

    it('should cache fingerprint for session', async () => {
      const fingerprint1 = await deviceFingerprintService.getDeviceFingerprint();
      const fingerprint2 = await deviceFingerprintService.getDeviceFingerprint();

      expect(fingerprint1).toEqual(fingerprint2);
      expect(fingerprint1.timestamp).toBe(fingerprint2.timestamp);
    });

    it('should include valid timestamp in ISO format', async () => {
      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();

      const timestamp = new Date(fingerprint.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(fingerprint.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getDeviceId', () => {
    it('should return only device ID string', async () => {
      // Mock SecureStore to return a stored ID
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync.mockResolvedValueOnce('test-stored-device-id');

      // Clear cache to force fresh ID generation
      deviceFingerprintService.clearCache();

      const deviceId = await deviceFingerprintService.getDeviceId();

      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBeGreaterThan(0);
      expect(deviceId).toBe('test-stored-device-id');
    });
  });

  describe('clearCache', () => {
    it('should clear cached fingerprint', async () => {
      // Mock SecureStore to return a stored ID consistently
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync.mockResolvedValue('consistent-device-id');

      // Clear cache first
      deviceFingerprintService.clearCache();

      const fingerprint1 = await deviceFingerprintService.getDeviceFingerprint();

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      deviceFingerprintService.clearCache();
      const fingerprint2 = await deviceFingerprintService.getDeviceFingerprint();

      // Device ID should be same (from SecureStore)
      expect(fingerprint1.deviceId).toBe(fingerprint2.deviceId);

      // But timestamps should be different
      expect(fingerprint1.timestamp).not.toBe(fingerprint2.timestamp);
    });
  });

  describe('fallback behavior', () => {
    it('should generate fallback ID when secure store fails', async () => {
      // Clear cache first
      deviceFingerprintService.clearCache();

      // Mock SecureStore to fail
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync.mockRejectedValueOnce(new Error('SecureStore error'));

      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();

      expect(fingerprint.deviceId).toBeTruthy();
      expect(fingerprint.deviceId).toContain('ios'); // Should include platform

      // Restore mock
      SecureStore.getItemAsync.mockResolvedValue('test-stored-device-id');
    });

    it('should handle errors gracefully', async () => {
      // Clear cache first
      deviceFingerprintService.clearCache();

      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();

      // Should return valid fingerprint (not throw)
      expect(fingerprint).toBeTruthy();
      expect(fingerprint.deviceId).toBeTruthy();
      expect(typeof fingerprint.platform).toBe('string');
    });
  });

  describe('device ID format', () => {
    it('should generate alphanumeric device ID', async () => {
      // Clear cache and ensure we have a clean state
      deviceFingerprintService.clearCache();

      const deviceId = await deviceFingerprintService.getDeviceId();

      // Should only contain allowed characters (alphanumeric and hyphens)
      expect(deviceId).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    it('should be consistent across multiple calls in same session', async () => {
      // Clear cache first to ensure fresh start
      deviceFingerprintService.clearCache();

      const id1 = await deviceFingerprintService.getDeviceId();
      const id2 = await deviceFingerprintService.getDeviceId();
      const id3 = await deviceFingerprintService.getDeviceId();

      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });
  });
});
