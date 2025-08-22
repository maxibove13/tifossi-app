import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import apiManager from '../_services/api';
import { handleApiError } from '../_services/api/errorHandler';
import { User } from '../_types/auth';

// Setup MMKV storage for user profile data
const storage = new MMKV({ id: 'user-storage' });
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

export type UserActionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UserOperationState {
  updateProfile: UserActionStatus;
  uploadProfilePicture: UserActionStatus;
  changePassword: UserActionStatus;
  fetchProfile: UserActionStatus;
}

export interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    promotions: boolean;
    orderUpdates: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    personalizedAds: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
  };
  language: string;
  currency: string;
}

export interface UserAddress {
  id?: string;
  type: 'shipping' | 'billing';
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
}

interface UserState {
  // User profile data
  profile: User | null;
  preferences: UserPreferences;
  addresses: UserAddress[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  actionStatus: UserOperationState;

  // Actions
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadProfilePicture: (imageUri: string) => Promise<void>;
  changePassword: (credentials: { currentPassword: string; newPassword: string }) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<UserAddress>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  clearUserData: () => void;
  clearError: () => void;
}

// Default user preferences
const defaultPreferences: UserPreferences = {
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
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      preferences: defaultPreferences,
      addresses: [],
      isLoading: false,
      error: null,
      actionStatus: {
        updateProfile: 'idle',
        uploadProfilePicture: 'idle',
        changePassword: 'idle',
        fetchProfile: 'idle',
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({
            isLoading: true,
            error: null,
            actionStatus: { ...get().actionStatus, updateProfile: 'loading' },
          });

          // In a real implementation, this would call a user profile API endpoint
          // For now, we'll simulate updating the local profile
          const currentProfile = get().profile;
          if (!currentProfile) {
            throw new Error('No user profile to update');
          }

          const updatedProfile = { ...currentProfile, ...data };

          // Local update for now - backend integration available if needed

          set({
            profile: updatedProfile,
            isLoading: false,
            actionStatus: { ...get().actionStatus, updateProfile: 'success' },
          });
        } catch (e) {
          const error = handleApiError(e, 'updateProfile');

          set({
            isLoading: false,
            error: error.message,
            actionStatus: { ...get().actionStatus, updateProfile: 'error' },
          });
          throw error;
        }
      },

      uploadProfilePicture: async (imageUri: string) => {
        try {
          set({
            isLoading: true,
            error: null,
            actionStatus: { ...get().actionStatus, uploadProfilePicture: 'loading' },
          });

          const result = await apiManager.updateProfilePicture('', imageUri); // Token handled by apiManager

          // Update local profile with new picture URL
          const currentProfile = get().profile;
          if (currentProfile) {
            set({
              profile: {
                ...currentProfile,
                profilePicture: result.profilePictureUrl,
              },
            });
          }

          set({
            isLoading: false,
            actionStatus: { ...get().actionStatus, uploadProfilePicture: 'success' },
          });
        } catch (e) {
          const error = handleApiError(e, 'uploadProfilePicture');

          set({
            isLoading: false,
            error: error.message,
            actionStatus: { ...get().actionStatus, uploadProfilePicture: 'error' },
          });
          throw error;
        }
      },

      changePassword: async (credentials: { currentPassword: string; newPassword: string }) => {
        try {
          set({
            isLoading: true,
            error: null,
            actionStatus: { ...get().actionStatus, changePassword: 'loading' },
          });

          await apiManager.changePassword('', credentials); // Token handled by apiManager

          set({
            isLoading: false,
            actionStatus: { ...get().actionStatus, changePassword: 'success' },
          });
        } catch (e) {
          const error = handleApiError(e, 'changePassword');

          set({
            isLoading: false,
            error: error.message,
            actionStatus: { ...get().actionStatus, changePassword: 'error' },
          });
          throw error;
        }
      },

      fetchUserProfile: async () => {
        try {
          set({
            isLoading: true,
            error: null,
            actionStatus: { ...get().actionStatus, fetchProfile: 'loading' },
          });

          // In a real implementation, this would fetch additional profile data
          // that's not included in the auth token validation
          // For now, we'll mark as successful without making an API call

          set({
            isLoading: false,
            actionStatus: { ...get().actionStatus, fetchProfile: 'success' },
          });
        } catch (e) {
          const error = handleApiError(e, 'fetchUserProfile');

          set({
            isLoading: false,
            error: error.message,
            actionStatus: { ...get().actionStatus, fetchProfile: 'error' },
          });
        }
      },

      updatePreferences: async (newPreferences: Partial<UserPreferences>) => {
        try {
          set({ isLoading: true, error: null });

          const updatedPreferences = {
            ...get().preferences,
            ...newPreferences,
            // Deep merge for nested objects
            notifications: { ...get().preferences.notifications, ...newPreferences.notifications },
            privacy: { ...get().preferences.privacy, ...newPreferences.privacy },
            accessibility: { ...get().preferences.accessibility, ...newPreferences.accessibility },
          };

          // Local storage with automatic persistence

          set({
            preferences: updatedPreferences,
            isLoading: false,
          });
        } catch (e) {
          const error = handleApiError(e, 'updatePreferences');

          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      addAddress: async (address: Omit<UserAddress, 'id'>) => {
        try {
          set({ isLoading: true, error: null });

          const newAddress: UserAddress = {
            ...address,
            id: `addr_${Date.now()}`, // Temporary ID generation
          };

          // If this is set as default, unset others
          let updatedAddresses = get().addresses;
          if (address.isDefault) {
            updatedAddresses = updatedAddresses.map((addr) => ({
              ...addr,
              isDefault: false,
            }));
          }

          updatedAddresses.push(newAddress);

          // Local storage with automatic persistence

          set({
            addresses: updatedAddresses,
            isLoading: false,
          });
        } catch (e) {
          const error = handleApiError(e, 'addAddress');

          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      updateAddress: async (id: string, addressUpdate: Partial<UserAddress>) => {
        try {
          set({ isLoading: true, error: null });

          let updatedAddresses = get().addresses.map((addr) =>
            addr.id === id ? { ...addr, ...addressUpdate } : addr
          );

          // If this address is being set as default, unset others
          if (addressUpdate.isDefault) {
            updatedAddresses = updatedAddresses.map((addr) => ({
              ...addr,
              isDefault: addr.id === id,
            }));
          }

          // Local storage with automatic persistence

          set({
            addresses: updatedAddresses,
            isLoading: false,
          });
        } catch (e) {
          const error = handleApiError(e, 'updateAddress');

          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      removeAddress: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const updatedAddresses = get().addresses.filter((addr) => addr.id !== id);

          // Local storage with automatic persistence

          set({
            addresses: updatedAddresses,
            isLoading: false,
          });
        } catch (e) {
          const error = handleApiError(e, 'removeAddress');

          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      setDefaultAddress: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const updatedAddresses = get().addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          }));

          // Local storage with automatic persistence

          set({
            addresses: updatedAddresses,
            isLoading: false,
          });
        } catch (e) {
          const error = handleApiError(e, 'setDefaultAddress');

          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      clearUserData: () => {
        set({
          profile: null,
          preferences: defaultPreferences,
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
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'tifossi-user-store',
      storage: mmkvStorage,
      partialize: (state) => ({
        profile: state.profile,
        preferences: state.preferences,
        addresses: state.addresses,
        // Don't persist loading states or errors
      }),
      onRehydrateStorage: () => (state) => {
        // Reset transient state after hydration
        if (state) {
          state.isLoading = false;
          state.error = null;
          state.actionStatus = {
            updateProfile: 'idle',
            uploadProfilePicture: 'idle',
            changePassword: 'idle',
            fetchProfile: 'idle',
          };
        }
      },
    }
  )
);

// Helper functions for user data management
export const UserHelpers = {
  /**
   * Get default shipping address
   */
  getDefaultShippingAddress: (addresses: UserAddress[]): UserAddress | undefined => {
    return (
      addresses.find((addr) => addr.type === 'shipping' && addr.isDefault) ||
      addresses.find((addr) => addr.type === 'shipping')
    );
  },

  /**
   * Get default billing address
   */
  getDefaultBillingAddress: (addresses: UserAddress[]): UserAddress | undefined => {
    return (
      addresses.find((addr) => addr.type === 'billing' && addr.isDefault) ||
      addresses.find((addr) => addr.type === 'billing')
    );
  },

  /**
   * Format address for display
   */
  formatAddressForDisplay: (address: UserAddress): string => {
    return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  },

  /**
   * Validate address completeness
   */
  validateAddress: (address: Partial<UserAddress>): string[] => {
    const errors: string[] = [];

    if (!address.name?.trim()) errors.push('Name is required');
    if (!address.street?.trim()) errors.push('Street address is required');
    if (!address.city?.trim()) errors.push('City is required');
    if (!address.state?.trim()) errors.push('State is required');
    if (!address.country?.trim()) errors.push('Country is required');
    if (!address.postalCode?.trim()) errors.push('Postal code is required');
    if (!address.type) errors.push('Address type is required');

    return errors;
  },

  /**
   * Get user display name
   */
  getDisplayName: (user: User): string => {
    return user.name || user.email?.split('@')[0] || 'User';
  },

  /**
   * Check if profile is complete
   */
  isProfileComplete: (user: User): boolean => {
    return !!(user.name && user.email);
  },
};

const utilityExport = {
  name: 'UserStore',
  version: '1.0.0',
};

export default utilityExport;
