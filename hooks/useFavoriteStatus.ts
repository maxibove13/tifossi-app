import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../app/_stores/favoritesStore';
import { useAuthStore } from '../app/_stores/authStore';

/**
 * Custom hook to manage the favorite status of a product.
 * Encapsulates the interaction with the useFavoritesStore.
 * Requires authentication - redirects to login if user is not logged in.
 *
 * @param productId The ID of the product.
 * @returns An object containing:
 *  - isFavorite: boolean - Whether the product is currently favorited.
 *  - toggle: function - A memoized function to toggle the favorite status for the product.
 */
export function useFavoriteStatus(productId: string | undefined) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Get the raw state access functions from the store
  const isFavoriteSelector = useCallback(
    (state: ReturnType<(typeof useFavoritesStore)['getState']>) =>
      productId ? state.isFavorite(productId) : false,
    [productId]
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // Use the selector hook
  const isFavorite = useFavoritesStore(isFavoriteSelector);

  // Create a memoized toggle function specific to this productId
  // Redirects to login if user is not authenticated
  const toggle = useCallback(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    if (productId) {
      toggleFavorite(productId);
    }
  }, [productId, toggleFavorite, isLoggedIn, router]);

  return {
    isFavorite,
    toggle,
  };
}
