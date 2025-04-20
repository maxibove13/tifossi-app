export interface Category {
  id: string; // e.g., "cat_01"
  name: string; // e.g., "Medias"
  slug: string; // e.g., "medias" (for URLs/keys)
  displayOrder?: number; // Optional: for sorting in the UI
}
