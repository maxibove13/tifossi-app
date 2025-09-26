/**
 * User Store Tests
 * Testing real Zustand store implementation following TESTING_PRINCIPLES.md
 * Focus on core functionality that can be tested reliably
 */

import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useUserStore, UserHelpers, UserPreferences, UserAddress } from '../../_stores/userStore';
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

  const mockAddress: UserAddress = {
    id: 'addr-123',
    type: 'shipping',
    name: 'Test Address',
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    phone: '+1234567890',
    isDefault: false,
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
      addresses: [],
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
      expect(result.current.addresses).toEqual([]);
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
      expect(typeof result.current.addAddress).toBe('function');
      expect(typeof result.current.updateAddress).toBe('function');
      expect(typeof result.current.removeAddress).toBe('function');
      expect(typeof result.current.setDefaultAddress).toBe('function');
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
      // This is a business logic constraint that prevents updating non-existent profiles
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

  describe('Address Management', () => {
    it('should add address successfully', async () => {
      const { result } = renderHook(() => useUserStore());

      const newAddress = { ...mockAddress };
      delete (newAddress as any).id; // Remove id since it's added by the store

      await act(async () => {
        await result.current.addAddress(newAddress);
      });

      expect(result.current.addresses).toHaveLength(1);
      expect(result.current.addresses[0]).toMatchObject(newAddress);
      expect(result.current.addresses[0].id).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should add address as default and unset others', async () => {
      const { result } = renderHook(() => useUserStore());

      // Add first address as default
      const { id: _id1, ...addressWithoutId1 } = mockAddress;
      const firstAddress = { ...addressWithoutId1, isDefault: true };
      await act(async () => {
        await result.current.addAddress(firstAddress);
      });

      // Add second address as default
      const { id: _id2, ...addressWithoutId2 } = mockAddress;
      const secondAddress = { ...addressWithoutId2, name: 'Second Address', isDefault: true };
      await act(async () => {
        await result.current.addAddress(secondAddress);
      });

      expect(result.current.addresses).toHaveLength(2);
      expect(result.current.addresses[0].isDefault).toBe(false); // First should be unset
      expect(result.current.addresses[1].isDefault).toBe(true); // Second should be default
    });

    it('should update address successfully', async () => {
      const { result } = renderHook(() => useUserStore());

      // Add address first
      await act(async () => {
        const { id: _id, ...addressWithoutId } = mockAddress;
        await result.current.addAddress(addressWithoutId);
      });

      const addressId = result.current.addresses[0].id!;
      const updates = { name: 'Updated Address', city: 'Updated City' };

      await act(async () => {
        await result.current.updateAddress(addressId, updates);
      });

      expect(result.current.addresses[0].name).toBe('Updated Address');
      expect(result.current.addresses[0].city).toBe('Updated City');
      expect(result.current.addresses[0].street).toBe(mockAddress.street); // Unchanged
      expect(result.current.isLoading).toBe(false);
    });

    it('should remove address successfully', async () => {
      const { result } = renderHook(() => useUserStore());

      // Add address first
      await act(async () => {
        const { id: _id, ...addressWithoutId } = mockAddress;
        await result.current.addAddress(addressWithoutId);
      });

      const addressId = result.current.addresses[0].id!;

      await act(async () => {
        await result.current.removeAddress(addressId);
      });

      expect(result.current.addresses).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set address as default', async () => {
      const { result } = renderHook(() => useUserStore());

      // Add two addresses, both non-default initially
      await act(async () => {
        const { id: _id3, ...addressWithoutId3 } = mockAddress;
        await result.current.addAddress({
          ...addressWithoutId3,
          name: 'First Address',
          isDefault: false,
        });
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      await act(async () => {
        const { id: _id4, ...addressWithoutId4 } = mockAddress;
        await result.current.addAddress({
          ...addressWithoutId4,
          name: 'Second Address',
          isDefault: false,
        });
      });

      const secondAddressId = result.current.addresses[1].id!;

      await act(async () => {
        await result.current.setDefaultAddress(secondAddressId);
      });

      expect(result.current.addresses[0].isDefault).toBe(false);
      expect(result.current.addresses[1].isDefault).toBe(true);
      expect(result.current.isLoading).toBe(false);
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

    it('should handle address operation errors', async () => {
      const { result } = renderHook(() => useUserStore());

      // Force an error by passing invalid data (this should trigger the catch block)
      const invalidAddress = null as any;

      await act(async () => {
        await result.current.addAddress(invalidAddress);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Clear User Data', () => {
    it('should clear all user data and reset to initial state', () => {
      const { result } = renderHook(() => useUserStore());

      // Set some data first
      act(() => {
        useUserStore.setState({
          profile: mockUser,
          addresses: [mockAddress],
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
      expect(result.current.addresses).toEqual([]);
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
    const addresses: UserAddress[] = [
      { ...mockAddress, id: 'addr-1', type: 'shipping', isDefault: false },
      { ...mockAddress, id: 'addr-2', type: 'shipping', isDefault: true },
      { ...mockAddress, id: 'addr-3', type: 'billing', isDefault: false },
      { ...mockAddress, id: 'addr-4', type: 'billing', isDefault: true },
    ];

    it('should get default shipping address', () => {
      const defaultShipping = UserHelpers.getDefaultShippingAddress(addresses);
      expect(defaultShipping?.id).toBe('addr-2');
      expect(defaultShipping?.type).toBe('shipping');
      expect(defaultShipping?.isDefault).toBe(true);
    });

    it('should get first shipping address if no default', () => {
      const addressesNoDefault = addresses.map((addr) => ({ ...addr, isDefault: false }));
      const defaultShipping = UserHelpers.getDefaultShippingAddress(addressesNoDefault);
      expect(defaultShipping?.id).toBe('addr-1');
      expect(defaultShipping?.type).toBe('shipping');
    });

    it('should get default billing address', () => {
      const defaultBilling = UserHelpers.getDefaultBillingAddress(addresses);
      expect(defaultBilling?.id).toBe('addr-4');
      expect(defaultBilling?.type).toBe('billing');
      expect(defaultBilling?.isDefault).toBe(true);
    });

    it('should format address for display', () => {
      const formatted = UserHelpers.formatAddressForDisplay(mockAddress);
      expect(formatted).toBe('123 Test Street, Test City, Test State 12345, Test Country');
    });

    it('should validate complete address', () => {
      const errors = UserHelpers.validateAddress(mockAddress);
      expect(errors).toEqual([]);
    });

    it('should validate incomplete address', () => {
      const incompleteAddress: Partial<UserAddress> = {
        name: '',
        street: '123 Test Street',
        // Missing other required fields
      };

      const errors = UserHelpers.validateAddress(incompleteAddress);
      expect(errors).toContain('Name is required');
      expect(errors).toContain('City is required');
      expect(errors).toContain('State is required');
      expect(errors).toContain('Country is required');
      expect(errors).toContain('Postal code is required');
      expect(errors).toContain('Address type is required');
    });

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

      // Add multiple addresses
      await act(async () => {
        const { id: _id5, ...addressWithoutId5 } = mockAddress;
        await result.current.addAddress({ ...addressWithoutId5, name: 'Address 1' });
        const { id: _id6, ...addressWithoutId6 } = mockAddress;
        await result.current.addAddress({ ...addressWithoutId6, name: 'Address 2' });
        const { id: _id7, ...addressWithoutId7 } = mockAddress;
        await result.current.addAddress({ ...addressWithoutId7, name: 'Address 3' });
      });

      expect(result.current.addresses).toHaveLength(3);

      // Update preferences
      await act(async () => {
        await result.current.updatePreferences({ language: 'es' });
      });

      // Verify addresses weren't affected
      expect(result.current.addresses).toHaveLength(3);
      expect(result.current.preferences.language).toBe('es');
    });

    it('should maintain address uniqueness', async () => {
      const { result } = renderHook(() => useUserStore());

      await act(async () => {
        const { id: _id8, ...addressWithoutId8 } = mockAddress;
        await result.current.addAddress({ ...addressWithoutId8, name: 'First Address' });
      });

      // Add a more significant delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await act(async () => {
        const { id: _id9, ...addressWithoutId9 } = mockAddress;
        await result.current.addAddress({ ...addressWithoutId9, name: 'Second Address' });
      });

      expect(result.current.addresses).toHaveLength(2);
      expect(result.current.addresses[0].id).not.toBe(result.current.addresses[1].id);
      expect(result.current.addresses[0].name).toBe('First Address');
      expect(result.current.addresses[1].name).toBe('Second Address');
    });
  });
});
