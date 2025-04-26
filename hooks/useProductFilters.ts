import { useMemo } from 'react';
import { Product } from '../app/_types/product';
import { ProductFilters } from '../app/_components/store/product/overlay/OverlayProductFilters';

export function useProductFilters(products: Product[], appliedFilters: ProductFilters): Product[] {
  const filteredProducts = useMemo(() => {
    let results = [...products];

    // 1. Filter by Size(s)
    if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
      results = results.filter((product) => {
        // Product must have at least one of the selected sizes available
        if (!product.sizes) return false; // Product doesn't have sizes defined
        return product.sizes.some(
          (sizeInfo) => appliedFilters.sizes!.includes(sizeInfo.value) && sizeInfo.available
        );
      });
    }

    // 2. Filter by Color(s)
    if (appliedFilters.colorHexes && appliedFilters.colorHexes.length > 0) {
      results = results.filter((product) => {
        // Product must have at least one of the selected colors
        if (!product.colors) return false;
        return product.colors.some((colorInfo) =>
          appliedFilters.colorHexes!.includes(colorInfo.hex || '')
        );
      });
    }

    // 3. Filter by Price Range
    if (appliedFilters.priceRange) {
      const { min, max } = appliedFilters.priceRange;
      results = results.filter((product) => {
        const price = product.discountedPrice ?? product.price;
        return price >= min && price <= max;
      });
    }

    return results;
  }, [products, appliedFilters]);

  return filteredProducts;
}
