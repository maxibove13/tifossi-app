import { Tag } from '../_types/tag';

export const tags: Tag[] = [
  // General Tags
  { id: 'new_arrival', name: 'Nuevo', slug: 'nuevo' },
  { id: 'featured', name: 'Destacado', slug: 'destacado' },
  { id: 'popular', name: 'Popular', slug: 'popular' },
  { id: 'customizable', name: 'Personalizable', slug: 'personalizable' },
  { id: 'opportunity', name: 'Oportunidad', slug: 'oportunidad' },
  { id: 'app_exclusive', name: 'Exclusivo App', slug: 'exclusivo-app' },
  { id: 'recommended', name: 'Recomendado', slug: 'recomendado' },

  // Specific Attribute Tags
  { id: 'fast_dry', name: 'Secado Rápido', slug: 'secado-rapido' },
  { id: 'non_slip', name: 'Antideslizante', slug: 'antideslizante' },
  { id: 'cotton', name: 'Algodón', slug: 'algodon' },
  { id: 'oversize', name: 'Oversize', slug: 'oversize' },
  { id: 'premium', name: 'Premium', slug: 'premium' },
  { id: 'sport', name: 'Deportivo', slug: 'deportivo' },
  { id: 'urban', name: 'Urbano', slug: 'urbano' },
  { id: 'travel', name: 'Viaje', slug: 'viaje' },
  { id: 'lightweight', name: 'Ligero', slug: 'ligero' },
  { id: 'thermal', name: 'Térmico', slug: 'termico' },
  { id: 'water_resistant', name: 'Resistente al Agua', slug: 'resistente-agua' },
  { id: 'high_performance', name: 'Alto Rendimiento', slug: 'alto-rendimiento' },
  { id: 'relaxed_fit', name: 'Corte Relajado', slug: 'corte-relajado' },
  { id: 'regular_fit', name: 'Corte Regular', slug: 'corte-regular' },
  { id: 'organic_cotton', name: 'Algodón Orgánico', slug: 'algodon-organico' },
];

// Pre-computed category-tag relationships map
// This eliminates the need to scan all products at runtime
export const CATEGORY_TAGS_MAP: Record<string, string[]> = {
  todo: [
    'new_arrival',
    'featured',
    'popular',
    'customizable',
    'opportunity',
    'recommended',
    'premium',
    'sport',
  ],
  medias: [
    'new_arrival',
    'featured',
    'sport',
    'fast_dry',
    'non_slip',
    'high_performance',
    'recommended',
  ],
  mochilas: [
    'app_exclusive',
    'premium',
    'urban',
    'travel',
    'water_resistant',
    'opportunity',
    'popular',
  ],
  remeras: [
    'featured',
    'oversize',
    'urban',
    'popular',
    'regular_fit',
    'relaxed_fit',
    'organic_cotton',
    'cotton',
  ],
  buzos: ['customizable', 'oversize', 'urban', 'popular', 'thermal', 'sport'],
  bolsos: ['featured', 'urban', 'popular', 'travel'],
  canilleras: ['customizable', 'sport', 'premium', 'high_performance'],
  gorros: ['urban', 'popular'],
  neceser: ['new_arrival', 'customizable', 'travel', 'water_resistant'],
  pantalones: ['urban', 'sport'],
  chanclas: ['non_slip', 'sport', 'water_resistant'],
  accesorios: ['new_arrival', 'customizable', 'premium'],
};

// Helper function to get tag names by IDs
export const getTagNamesByIds = (tagIds: string[]): string[] => {
  return tagIds
    .map((id) => tags.find((tag) => tag.id === id)?.name)
    .filter((name): name is string => !!name);
};

// Helper function to get all tags
export const getAllTags = (): Tag[] => {
  // Add a default "Todos" tag
  return [{ id: 'all', name: 'Todos', slug: 'todos' }, ...tags];
};

// Helper function to get tags for a category using the pre-computed map
export const getTagsForCategory = (categoryId: string): Tag[] => {
  // Get the tag IDs for this category (or default to empty array)
  const tagIds = CATEGORY_TAGS_MAP[categoryId] || [];

  // Convert tag IDs to complete tag objects
  const categoryTags = tagIds
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => tag !== undefined);

  // Always add "all" tag at the beginning
  return [{ id: 'all', name: 'Todos', slug: 'todos' }, ...categoryTags];
};

const TagData = {
  tags,
  CATEGORY_TAGS_MAP,
  getTagNamesByIds,
  getAllTags,
  getTagsForCategory,
};

export default TagData;
