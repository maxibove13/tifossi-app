import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import apiManager from '../_services/api';
import { handleApiError } from '../_services/api/errorHandler';
import { User } from '../_types/auth';

// Lazy-initialize MMKV to prevent crashes on real devices
// Native modules can't be instantiated during bundle evaluation
let _storage: MMKV | null = null;
const getStorage = () => {
  if (!_storage) {
    _storage = new MMKV({ id: 'user-storage' });
  }
  return _storage;
};

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => getStorage().getString(name) ?? null,
  setItem: (name, value) => getStorage().set(name, value),
  removeItem: (name) => getStorage().delete(name),
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

interface UserState {
  // User profile data
  profile: User | null;
  preferences: UserPreferences;

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

          const currentProfile = get().profile;
          if (!currentProfile) {
            throw new Error('No user profile to update');
          }

          const updatedProfile = { ...currentProfile, ...data };

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

          const result = await apiManager.updateProfilePicture('', imageUri);

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

          await apiManager.changePassword('', credentials);

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
            notifications: { ...get().preferences.notifications, ...newPreferences.notifications },
            privacy: { ...get().preferences.privacy, ...newPreferences.privacy },
            accessibility: { ...get().preferences.accessibility, ...newPreferences.accessibility },
          };

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

      clearUserData: () => {
        set({
          profile: null,
          preferences: defaultPreferences,
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
      }),
      onRehydrateStorage: () => (state) => {
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
