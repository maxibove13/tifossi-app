// Import all types first
import { Product, ProductSize, isProduct, mapProductToCardData } from './product';
import {
  CardVariant,
  CardSize,
  CardDimensions,
  CardSizeByVariant,
  getCardDimensions,
  isValidSize,
  isValidCardSize
} from './product-card';

// Re-export all types from a central location for easier imports
export * from './product-status';
export * from './navigation';
export * from './ui';

// Selectively re-export to avoid naming conflicts
export { 
  Product, 
  ProductSize, 
  isProduct, 
  mapProductToCardData,
  CardVariant,
  CardSize,
  CardDimensions,
  CardSizeByVariant,
  getCardDimensions,
  isValidSize,
  isValidCardSize
};

// Add default export to fix router warnings
const typesExport = {
  name: 'TifossiTypes',
  version: '1.0.0'
};

export default typesExport;