/**
 * Product model representation
 * Models are used to group similar products within a category
 */
export interface ProductModel {
  id: string; // Unique identifier
  name: string; // Display name
  slug: string; // URL-friendly version of name
  categoryId: string; // Associated category
}

/**
 * Validates if an object is a valid ProductModel
 * @param obj Object to validate
 * @returns True if obj is a valid ProductModel
 */
export function isProductModel(obj: any): obj is ProductModel {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.slug === 'string' &&
    typeof obj.categoryId === 'string'
  );
}

/**
 * Valid types for model relationships
 */
export type ModelsByCategory = Record<string, ProductModel[]>;

// Add default export to fix router warnings
const utilityExport = {
  name: 'ProductModelType',
  version: '1.0.0',
};

export default utilityExport;
