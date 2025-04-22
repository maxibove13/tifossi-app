import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import mockApi from '../_services/api/mockApi';
import { User } from '../_services/api/mockApi';
import { useCartStore } from './cartStore';
import { useFavoritesStore } from './favoritesStore';

const AUTH_TOKEN_KEY = 'tifossi_auth_token';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Tracks if initial token load attempted
  error: string | null;

  initializeAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initializeAuth: async () => {
    if (get().isInitialized) return; // Prevent multiple initializations

    set({ isLoading: true });
    try {
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (storedToken) {
        // Validate token with mock API
        const user = await mockApi.validateToken(storedToken);
        set({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });

        // Trigger post-login sync for other stores
        await useCartStore.getState().syncWithServer();
        await useFavoritesStore.getState().syncWithServer();
      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); // Clear invalid token
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Session invalid. Please login.',
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await mockApi.login(credentials);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Trigger post-login sync for other stores
      await useCartStore.getState().syncWithServer();
      await useFavoritesStore.getState().syncWithServer();
    } catch (error: any) {
      console.error('Login failed:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed. Please try again.',
      });
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await mockApi.register(userData);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Sync cart and favorites after registration
      await useCartStore.getState().syncWithServer();
      await useFavoritesStore.getState().syncWithServer();
    } catch (error: any) {
      console.error('Registration failed:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Registration failed. Please try again.',
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    const currentToken = get().token;
    try {
      await mockApi.logout(currentToken);
    } catch (e) {
      console.error('Mock logout API call failed (continuing local logout):', e);
    } finally {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));

const utilityExport = {
  name: 'AuthStore',
  version: '1.0.0',
};

export default utilityExport;
