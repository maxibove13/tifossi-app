import { ProductLabel } from './product-status';

export interface Category {
  id: string; // e.g., "cat_01"
  name: string; // e.g., "Medias"
  slug: string; // e.g., "medias" (for URLs/keys)
  displayOrder?: number; // Optional: for sorting in the UI
  isLabel?: boolean; // Whether this is a special category based on product label
  labelType?: ProductLabel; // The product label this category is based on
}

const utilityExport = {
  name: 'CategoryType',
  version: '1.0.0',
};

export default utilityExport;
