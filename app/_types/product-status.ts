/**
 * ProductStatus represents the backend/internal status values
 * These values are used in URLs and as category IDs for label-based categories
 */
export enum ProductStatus {
  NEW = 'new',
  FEATURED = 'featured',
  OPPORTUNITY = 'opportunity',
  RECOMMENDED = 'recommended',
  POPULAR = 'popular',
  APP_EXCLUSIVE = 'app_exclusive',
  HIGHLIGHTED = 'highlighted',
}

/**
 * ProductLabel represents the user-facing labels in Spanish
 * These values are displayed in the UI
 */
export enum ProductLabel {
  NEW = 'Nuevo',
  FEATURED = 'Destacado',
  OPPORTUNITY = 'Oportunidad',
  RECOMMENDED = 'Recomendado',
  POPULAR = 'Popular',
  APP_EXCLUSIVE = 'Exclusivo in-app',
  HIGHLIGHTED = 'Destacado Home',
}

/**
 * Type guard to check if a string is a valid ProductStatus
 */
export type ProductStatusType = keyof typeof ProductStatus;
export type ProductLabelType = keyof typeof ProductLabel;

export const STATUS_TO_LABEL: Record<ProductStatus, ProductLabel> = {
  [ProductStatus.NEW]: ProductLabel.NEW,
  [ProductStatus.FEATURED]: ProductLabel.FEATURED,
  [ProductStatus.OPPORTUNITY]: ProductLabel.OPPORTUNITY,
  [ProductStatus.RECOMMENDED]: ProductLabel.RECOMMENDED,
  [ProductStatus.POPULAR]: ProductLabel.POPULAR,
  [ProductStatus.APP_EXCLUSIVE]: ProductLabel.APP_EXCLUSIVE,
  [ProductStatus.HIGHLIGHTED]: ProductLabel.HIGHLIGHTED,
};

export const LABEL_TO_STATUS: Record<ProductLabel, ProductStatus> = {
  [ProductLabel.NEW]: ProductStatus.NEW,
  [ProductLabel.FEATURED]: ProductStatus.FEATURED,
  [ProductLabel.OPPORTUNITY]: ProductStatus.OPPORTUNITY,
  [ProductLabel.RECOMMENDED]: ProductStatus.RECOMMENDED,
  [ProductLabel.POPULAR]: ProductStatus.POPULAR,
  [ProductLabel.APP_EXCLUSIVE]: ProductStatus.APP_EXCLUSIVE,
  [ProductLabel.HIGHLIGHTED]: ProductStatus.HIGHLIGHTED,
};

export function getStatusFromLabel(label: ProductLabel): ProductStatus {
  return LABEL_TO_STATUS[label];
}

export function getLabelFromStatus(status: ProductStatus): ProductLabel {
  return STATUS_TO_LABEL[status];
}

/**
 * Check if a value is a valid ProductStatus
 * @param status Value to check
 * @returns Type guard indicating if status is a valid ProductStatus
 */
export function isValidStatus(status: unknown): status is ProductStatus {
  return (
    typeof status === 'string' && Object.values(ProductStatus).includes(status as ProductStatus)
  );
}

/**
 * Check if a value is a valid ProductLabel
 * @param label Value to check
 * @returns Type guard indicating if label is a valid ProductLabel
 */
export function isValidLabel(label: unknown): label is ProductLabel {
  return typeof label === 'string' && Object.values(ProductLabel).includes(label as ProductLabel);
}

/**
 * Check if a category ID represents a label-based category
 * @param categoryId The category ID to check
 * @returns Boolean indicating if category is a label-based category
 */
export function isLabelCategory(categoryId: string): boolean {
  return isValidStatus(categoryId);
}

/**
 * Priority order for product statuses when determining which label to display
 * Higher index = higher priority
 */
export const STATUS_PRIORITY: ProductStatus[] = [
  ProductStatus.POPULAR,
  ProductStatus.RECOMMENDED,
  ProductStatus.FEATURED,
  ProductStatus.OPPORTUNITY,
  ProductStatus.NEW,
  ProductStatus.APP_EXCLUSIVE,
  ProductStatus.HIGHLIGHTED, // Highest priority
];

/**
 * Get the primary label to display from an array of product statuses
 * Returns the highest priority status based on STATUS_PRIORITY
 * @param statuses Array of product statuses
 * @returns The ProductLabel to display, or undefined if no statuses
 */
export function getPrimaryLabelFromStatuses(statuses: ProductStatus[]): ProductLabel | undefined {
  if (!statuses.length) return undefined;

  // Find the highest priority status in the array
  const highestPriorityStatus = statuses.reduce((highest, current) => {
    const highestIndex = STATUS_PRIORITY.indexOf(highest);
    const currentIndex = STATUS_PRIORITY.indexOf(current);
    return currentIndex > highestIndex ? current : highest;
  }, statuses[0]);

  return STATUS_TO_LABEL[highestPriorityStatus];
}

/**
 * Check if a product has a specific status
 * @param statuses Array of product statuses
 * @param status Status to check for
 * @returns Boolean indicating if the product has the specified status
 */
export function hasStatus(statuses: ProductStatus[], status: ProductStatus): boolean {
  return statuses.includes(status);
}

// Add default export to fix router warnings
const productStatusModule = {
  name: 'ProductStatusTypes',
  version: '1.0.0',
  statuses: ProductStatus,
  labels: ProductLabel,
  isLabelCategory,
  isValidStatus,
  isValidLabel,
  getStatusFromLabel,
  getLabelFromStatus,
  getPrimaryLabelFromStatuses,
  hasStatus,
};

export default productStatusModule;
