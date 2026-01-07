import { Category } from '../_types/category';
import { ProductLabel, ProductStatus, ProductStatusType } from '../_types/product-status';
import { CATEGORY_IDS } from '../_types/constants';

/**
 * Map of label pluralization suffixes for Spanish display names
 */
const LABEL_PLURALIZATION: Record<ProductLabel, string> = {
  [ProductLabel.NEW]: 's', // Nuevos
  [ProductLabel.FEATURED]: 's', // Destacados
  [ProductLabel.OPPORTUNITY]: 'es', // Oportunidades
  [ProductLabel.POPULAR]: 'es', // Populares
  [ProductLabel.RECOMMENDED]: 's', // Recomendados
  [ProductLabel.APP_EXCLUSIVE]: 's', // Exclusivos in-app
  [ProductLabel.HIGHLIGHTED]: 's', // Destacados Home
};

/**
 * Generates plural display name for a label
 */
function getPluralizedLabel(label: ProductLabel): string {
  const suffix = LABEL_PLURALIZATION[label] || '';
  return label + suffix;
}

/**
 * Generate label categories directly from ProductStatus
 * This ensures we use ProductStatus as the single source of truth
 * Note: HIGHLIGHTED is excluded from tabs (it's for home screen featured cards only)
 */
export const labelCategories: Category[] = Object.entries(ProductStatus)
  .filter(([_, status]) => status !== ProductStatus.HIGHLIGHTED)
  .map(([_, status]) => {
    const statusKey = status as ProductStatus;
    const label = ProductLabel[statusKey.toUpperCase() as ProductStatusType];

    // Create a pluralized or modified version of the label name for tab display
    const displayName = getPluralizedLabel(label);

    return {
      id: statusKey,
      name: displayName,
      slug: statusKey.toLowerCase(),
      isLabel: true,
      labelType: label,
    };
  });

// Regular product categories
// NOTE: These are hardcoded categories. When categories are fetched from API in the future,
// ensure to filter by isActive field to only show active categories to users.
export const productCategories: Category[] = [
  { id: 'accesorios', name: 'Accesorios', slug: 'accesorios' },
  { id: 'buzos', name: 'Buzos', slug: 'buzos' },
  { id: 'bolsos', name: 'Bolsos', slug: 'bolsos' },
  { id: 'canilleras', name: 'Canilleras', slug: 'canilleras' },
  { id: 'chanclas', name: 'Chanclas', slug: 'chanclas' },
  { id: 'gorros', name: 'Gorros', slug: 'gorros' },
  { id: 'medias', name: 'Medias', slug: 'medias' },
  { id: 'mochilas', name: 'Mochilas', slug: 'mochilas' },
  { id: 'neceser', name: 'Neceser', slug: 'neceser' },
  { id: 'pantalones', name: 'Pantalones', slug: 'pantalones' },
  { id: 'remeras', name: 'Remeras', slug: 'remeras' },
];

/**
 * The "All" category that shows all products
 */
export const allCategory: Category = {
  id: CATEGORY_IDS.ALL,
  name: 'Todo',
  slug: 'todo',
};

/**
 * Special "Descuentos" category - filters by discountedPrice, not by status
 */
export const discountedCategory: Category = {
  id: CATEGORY_IDS.DISCOUNTED,
  name: 'Descuentos',
  slug: 'discounted',
  isLabel: true, // Treated as label category for UI purposes
};

/**
 * Combined categories with "Todo" at the beginning, then discounted, then label categories, then product categories
 */
export const mainCategories: Category[] = [
  allCategory,
  discountedCategory,
  ...labelCategories,
  ...productCategories,
];

const CategoryData = {
  mainCategories,
  labelCategories,
  productCategories,
  allCategory,
};

export default CategoryData;
