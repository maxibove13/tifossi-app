import { useCallback } from 'react';
import { useFavoritesStore } from '../app/_stores/favoritesStore';

/**
 * Custom hook to manage the favorite status of a product.
 * Encapsulates the interaction with the useFavoritesStore.
 *
 * @param productId The ID of the product.
 * @returns An object containing:
 *  - isFavorite: boolean - Whether the product is currently favorited.
 *  - toggle: function - A memoized function to toggle the favorite status for the product.
 */
export function useFavoriteStatus(productId: string | undefined) {
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
  const toggle = useCallback(() => {
    if (productId) {
      toggleFavorite(productId);
    }
  }, [productId, toggleFavorite]);

  return {
    isFavorite,
    toggle,
  };
}
