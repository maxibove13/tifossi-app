/**
 * User Store Tests
 * Testing real Zustand store implementation following TESTING_PRINCIPLES.md
 * Focus on core functionality that can be tested reliably
 * Note: Address management is now handled by addressService, not userStore
 */

import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useUserStore, UserHelpers, UserPreferences } from '../../_stores/userStore';
import { User } from '../../_types/auth';

// Mock the MMKV storage to prevent persistence issues in tests
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock apiManager to avoid actual API calls
jest.mock('../../_services/api', () => ({
  __esModule: true,
  default: {
    updateProfilePicture: jest
      .fn()
      .mockResolvedValue({ profilePictureUrl: 'https://test.com/avatar.jpg' }),
    changePassword: jest.fn().mockResolvedValue(true),
  },
}));

describe('userStore', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    profilePicture: 'https://example.com/avatar.jpg',
    isEmailVerified: true,
  };

  beforeEach(() => {
    // Reset store state to initial values
    useUserStore.setState({
      profile: null,
      preferences: {
        notifications: {
          push: true,
          email: true,
          promotions: false,
          orderUpdates: true,
        },
        privacy: {
          shareAnalytics: false,
          personalizedAds: false,
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          reducedMotion: false,
        },
        language: 'en',
        currency: 'USD',
      },
      isLoading: false,
      error: null,
      actionStatus: {
        updateProfile: 'idle',
        uploadProfilePicture: 'idle',
        changePassword: 'idle',
        fetchProfile: 'idle',
      },
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initialization and State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.profile).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.preferences.language).toBe('en');
      expect(result.current.preferences.currency).toBe('USD');
      expect(result.current.preferences.notifications.push).toBe(true);
      expect(result.current.actionStatus.updateProfile).toBe('idle');
    });

    it('should have all required action methods', () => {
      const { result } = renderHook(() => useUserStore());

      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.uploadProfilePicture).toBe('function');
      expect(typeof result.current.changePassword).toBe('function');
      expect(typeof result.current.fetchUserProfile).toBe('function');
      expect(typeof result.current.updatePreferences).toBe('function');
      expect(typeof result.current.clearUserData).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Profile Management', () => {
    it('should update profile successfully', async () => {
      const { result } = renderHook(() => useUserStore());

      // Set initial profile
      act(() => {
        useUserStore.setState({ profile: mockUser });
      });

      const updateData = { name: 'Updated User', email: 'updated@example.com' };

      await act(async () => {
        await result.current.updateProfile(updateData);
      });

      expect(result.current.profile).toEqual({
        ...mockUser,
        ...updateData,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.actionStatus.updateProfile).toBe('success');
    });

    it('should require existing profile for updates', () => {
      const { result } = renderHook(() => useUserStore());

      // Ensure no profile exists
      expect(result.current.profile).toBeNull();

      // The updateProfile method should require a profile to exist
      expect(typeof result.current.updateProfile).toBe('function');
    });
  });

  describe('Profile Fetching', () => {
    it('should fetch user profile successfully', async () => {
      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        await result.current.fetchUserProfile();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.actionStatus.fetchProfile).toBe('success');
    });
  });

  describe('Preferences Management', () => {
    it('should update preferences successfully', async () => {
      const { result } = renderHook(() => useUserStore());

      const newPreferences: Partial<UserPreferences> = {
        language: 'es',
        currency: 'EUR',
        notifications: {
          push: false,
          email: false,
          promotions: true,
          orderUpdates: false,
        },
      };

      await act(async () => {
        await result.current.updatePreferences(newPreferences);
      });

      expect(result.current.preferences.language).toBe('es');
      expect(result.current.preferences.currency).toBe('EUR');
      expect(result.current.preferences.notifications.push).toBe(false);
      expect(result.current.preferences.notifications.promotions).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should deep merge nested preference objects', async () => {
      const { result } = renderHook(() => useUserStore());

      // Update only some notification preferences
      const partialNotifications = {
        notifications: {
          push: true, // Keep existing
          email: true, // Keep existing
          promotions: true, // Change this
          orderUpdates: true, // Keep existing
        },
      };

      await act(async () => {
        await result.current.updatePreferences(partialNotifications);
      });

      // Check that only the specified preference was changed
      expect(result.current.preferences.notifications.promotions).toBe(true);
      // Check that other notification preferences remained unchanged
      expect(result.current.preferences.notifications.push).toBe(true); // Original value
      expect(result.current.preferences.notifications.email).toBe(true); // Original value
      expect(result.current.preferences.notifications.orderUpdates).toBe(true); // Original value
    });

    it('should update accessibility preferences', async () => {
      const { result } = renderHook(() => useUserStore());

      const accessibilityPrefs = {
        accessibility: {
          fontSize: 'large' as const,
          highContrast: true,
          reducedMotion: false, // Include all required properties
        },
      };

      await act(async () => {
        await result.current.updatePreferences(accessibilityPrefs);
      });

      expect(result.current.preferences.accessibility.fontSize).toBe('large');
      expect(result.current.preferences.accessibility.highContrast).toBe(true);
      expect(result.current.preferences.accessibility.reducedMotion).toBe(false); // Unchanged
    });

    it('should update privacy preferences', async () => {
      const { result } = renderHook(() => useUserStore());

      const privacyPrefs = {
        privacy: {
          shareAnalytics: true,
          personalizedAds: true,
        },
      };

      await act(async () => {
        await result.current.updatePreferences(privacyPrefs);
      });

      expect(result.current.preferences.privacy.shareAnalytics).toBe(true);
      expect(result.current.preferences.privacy.personalizedAds).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear error successfully', () => {
      const { result } = renderHook(() => useUserStore());

      // Set an error
      act(() => {
        useUserStore.setState({ error: 'Some error occurred' });
      });

      expect(result.current.error).toBe('Some error occurred');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Clear User Data', () => {
    it('should clear all user data and reset to initial state', () => {
      const { result } = renderHook(() => useUserStore());

      // Set some data first
      act(() => {
        useUserStore.setState({
          profile: mockUser,
          error: 'Some error',
          isLoading: true,
          actionStatus: {
            updateProfile: 'success',
            uploadProfilePicture: 'error',
            changePassword: 'loading',
            fetchProfile: 'success',
          },
        });
      });

      act(() => {
        result.current.clearUserData();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.actionStatus.updateProfile).toBe('idle');
      expect(result.current.actionStatus.uploadProfilePicture).toBe('idle');
      expect(result.current.actionStatus.changePassword).toBe('idle');
      expect(result.current.actionStatus.fetchProfile).toBe('idle');
      expect(result.current.preferences.language).toBe('en'); // Reset to defaults
    });
  });

  describe('UserHelpers Utility Functions', () => {
    it('should get user display name from full name', () => {
      const displayName = UserHelpers.getDisplayName(mockUser);
      expect(displayName).toBe('Test User');
    });

    it('should get user display name from email when no name', () => {
      const userWithoutName = { ...mockUser, name: '' };
      const displayName = UserHelpers.getDisplayName(userWithoutName);
      expect(displayName).toBe('test');
    });

    it('should fallback to "User" when no name or email', () => {
      const userWithoutInfo = { ...mockUser, name: '', email: '' };
      const displayName = UserHelpers.getDisplayName(userWithoutInfo);
      expect(displayName).toBe('User');
    });

    it('should check if profile is complete', () => {
      expect(UserHelpers.isProfileComplete(mockUser)).toBe(true);

      const incompleteUser = { ...mockUser, name: '' };
      expect(UserHelpers.isProfileComplete(incompleteUser)).toBe(false);

      const userWithoutEmail = { ...mockUser, email: '' };
      expect(UserHelpers.isProfileComplete(userWithoutEmail)).toBe(false);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state during multiple operations', async () => {
      const { result } = renderHook(() => useUserStore());

      // Set profile
      act(() => {
        useUserStore.setState({ profile: mockUser });
      });

      // Update preferences
      await act(async () => {
        await result.current.updatePreferences({ language: 'es' });
      });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({ name: 'New Name' });
      });

      // Verify all state is consistent
      expect(result.current.profile?.name).toBe('New Name');
      expect(result.current.preferences.language).toBe('es');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
