import { ProductModel } from '../_types/model';
import { CATEGORY_IDS, MODEL_IDS } from '../_types/constants';

// Define models by category
export const productModels: ProductModel[] = [
  // Medias (Socks) models
  { id: 'classic', name: 'Classic', slug: 'classic', categoryId: 'medias' },
  { id: 'sport', name: 'Sport', slug: 'sport', categoryId: 'medias' },
  { id: 'antideslizante', name: 'Antideslizante', slug: 'antideslizante', categoryId: 'medias' },
  { id: 'fast', name: 'Fast', slug: 'fast', categoryId: 'medias' },

  // Remeras (Shirts) models
  { id: 'regular', name: 'Regular', slug: 'regular', categoryId: 'remeras' },
  { id: 'relaxed', name: 'Relaxed', slug: 'relaxed', categoryId: 'remeras' },
  { id: 'oversize', name: 'Oversize', slug: 'oversize', categoryId: 'remeras' },
  { id: 'tshirt', name: 'T-Shirt', slug: 'tshirt', categoryId: 'remeras' },

  // Mochilas (Backpacks) models
  { id: 'standard', name: 'Standard', slug: 'standard', categoryId: 'mochilas' },
  { id: 'travel', name: 'Travel', slug: 'travel', categoryId: 'mochilas' },
  { id: 'premium', name: 'Premium', slug: 'premium', categoryId: 'mochilas' },

  // Bolsos (Bags) models
  { id: 'regular_bag', name: 'Regular', slug: 'regular', categoryId: 'bolsos' },
  { id: 'sport_bag', name: 'Sport', slug: 'sport', categoryId: 'bolsos' },

  // Buzos (Sweatshirts) models
  { id: 'oversize_buzo', name: 'Oversize', slug: 'oversize', categoryId: 'buzos' },
  { id: 'campera', name: 'Campera', slug: 'campera', categoryId: 'buzos' },

  // Gorros (Caps) models
  { id: 'cap', name: 'Cap', slug: 'cap', categoryId: 'gorros' },

  // Neceser models
  { id: 'globo', name: 'Globo', slug: 'globo', categoryId: 'neceser' },
  { id: 'ball', name: 'Ball', slug: 'ball', categoryId: 'neceser' },

  // Canilleras (Shin guards) models
  { id: 'pro', name: 'Pro', slug: 'pro', categoryId: 'canilleras' },
  { id: 'lite', name: 'Lite', slug: 'lite', categoryId: 'canilleras' },
];

/**
 * Get all models for a specific category
 * @param categoryId Category identifier
 * @returns Array of ProductModel objects for the category, with "Todos" as first item
 */
export function getModelsByCategory(categoryId: string): ProductModel[] {
  if (categoryId === CATEGORY_IDS.ALL) {
    return []; // No models for 'todo' category
  }

  const categoryModels = productModels.filter((model) => model.categoryId === categoryId);

  // Add "Todos" model at the beginning
  return [{ id: MODEL_IDS.ALL, name: 'Todos', slug: 'todos', categoryId }, ...categoryModels];
}

/**
 * Get model by ID
 * @param modelId Model identifier
 * @returns ProductModel object or undefined if not found
 */
export function getModelById(modelId: string): ProductModel | undefined {
  return productModels.find((model) => model.id === modelId);
}

/**
 * Check if a model ID is valid
 * @param modelId Model identifier to check
 * @returns Boolean indicating if model exists
 */
export function isValidModel(modelId: string): boolean {
  return modelId === MODEL_IDS.ALL || productModels.some((model) => model.id === modelId);
}

const ModelsData = {
  productModels,
  getModelsByCategory,
  getModelById,
  isValidModel,
};

export default ModelsData;
