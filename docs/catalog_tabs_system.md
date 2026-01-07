# Catalog Tab Navigation System

## Overview

The Tifossi app implements a dual-layer tab navigation system in the catalog screen, allowing users to browse products by categories, product labels, and models. This document details the implementation of this feature, including how categories (regular and label-based) and models are structured, how they interact, and how the tab navigation UI works.

## Tab Navigation Components

### 1. Primary Navigation (Categories and Labels)

The catalog screen implements a horizontal scrolling tab bar for the main product navigation options including:

- Regular product categories (Medias, Gorros, etc.)
- Product label categories (Nuevos, Destacados, etc.)
- All products category ("Todo")

This primary navigation system has the following characteristics:

- **Data Source**: `useCategories()` hook which fetches from Strapi API with local fallback. Combines:
  - Regular product categories from `productCategories`
  - Product label categories from `labelCategories` (excludes HIGHLIGHTED - home screen only)
  - The "Todo" category at the beginning
- **Default Selection**: First category ("Todo") or the category specified in URL parameters
- **Behavior**: Selecting a category or label filters products and updates the available models
- **Loading State**: Shows loading indicator while categories are being fetched via `isLoadingCategories`
- **UI Implementation**: Custom `TabBar` component with automatic scrolling to center the active tab

### 2. Secondary Navigation (Models)

Below the primary tabs is another horizontal scrolling tab bar for models specific to the selected regular category:

- **Data Source**: `useProductModels()` hook which fetches from Strapi API with local fallback via `getModelsByCategory()`
- **Default Selection**: "Todos" (all) model or the model specified in URL parameters
- **Behavior**: Only displayed when:
  - The selected category is a regular product category (not a label-based category)
  - The selected category has multiple available models
- **UI Implementation**: Same `TabBar` component but with different styling
- **Hidden for**: Label-based categories and the "Todo" category

## Data Structure

### Categories (`app/_data/categories.ts`)

The app now has multiple category types:

```typescript
// Regular product categories
export const productCategories: Category[] = [
  { id: 'accesorios', name: 'Accesorios', slug: 'accesorios' },
  { id: 'buzos', name: 'Buzos', slug: 'buzos' },
  { id: 'bolsos', name: 'Bolsos', slug: 'bolsos' },
  // More regular categories...
];

// Special categories based on product labels
export const labelCategories: Category[] = [
  { id: 'new', name: 'Nuevos', slug: 'nuevos', isLabel: true, labelType: ProductLabel.NEW },
  {
    id: 'featured',
    name: 'Destacados',
    slug: 'destacados',
    isLabel: true,
    labelType: ProductLabel.FEATURED,
  },
  {
    id: 'opportunity',
    name: 'Oportunidades',
    slug: 'oportunidades',
    isLabel: true,
    labelType: ProductLabel.OPPORTUNITY,
  },
  // More label categories...
];

// Combined categories for the primary navigation
export const mainCategories: Category[] = [
  { id: 'todo', name: 'Todo', slug: 'todo' },
  ...labelCategories,
  ...productCategories,
];
```

### Models (`app/_data/models.ts`)

Models represent specific product variants within a category:

```typescript
export const productModels: ProductModel[] = [
  // Medias (Socks) models
  { id: 'classic', name: 'Classic', slug: 'classic', categoryId: 'medias' },
  { id: 'sport', name: 'Sport', slug: 'sport', categoryId: 'medias' },
  { id: 'antideslizante', name: 'Antideslizante', slug: 'antideslizante', categoryId: 'medias' },
  // More models...
];
```

### Model Interface (`app/_types/model.ts`)

The ProductModel interface defines the structure for model data:

```typescript
export interface ProductModel {
  id: string; // Unique identifier
  name: string; // Display name
  slug: string; // URL-friendly version of name
  categoryId: string; // Associated category
}
```

### Category Interface (`app/_types/category.ts`)

The Category interface has been extended to support label-based categories:

```typescript
export interface Category {
  id: string; // Unique identifier
  name: string; // Display name
  slug: string; // URL-friendly version of name
  displayOrder?: number; // Optional sorting
  isLabel?: boolean; // Whether this category is based on product labels
  labelType?: ProductLabel; // The associated product label (if isLabel is true)
}
```

### Product Model Structure

Each product in the app belongs to a specific model, with the model ID attached directly to the product:

```typescript
export interface Product {
  id: string;
  title: string;
  price: number;
  categoryId: string;
  modelId: string; // Model identifier for grouping similar products
  // Other product properties...
}
```

## Tab Implementation

The catalog screen uses a generic `TabBar` component that handles:

1. Automatic scrolling to center the active tab
2. Visual feedback for the selected tab (text style and underline)
3. Touch handling and ripple effects
4. Layout measurement for smooth scrolling

```typescript
const TabBar = <T extends { id: string; name: string }>({
  items,
  activeItemId,
  onSelectItem,
  style,
  itemStyle,
  activeItemStyle,
  activeUnderlineStyle,
}: TabBarProps<T>) => {
  // Implementation details...
};
```

The component uses generics to work with both Category and ProductModel types, which both implement the necessary `id` and `name` properties.

## Title Display Logic

The catalog screen dynamically updates its title based on the current selection:

1. **Default Title**: "Tienda" when no specific category or model is selected
2. **Label Category Title**: When a label-based category is selected, showing the label name (e.g., "Nuevos", "Destacados")
3. **Regular Category Title**: When a regular category is selected with the default "Todos" model
4. **Combined Title**: When both a regular category and a specific model are selected (e.g., "Medias - Sport")
5. **Special Section Titles**: Maps from section names to specific display titles using `SECTION_TO_TITLE_MAP`

```typescript
// Define mapping between section names and their corresponding titles
const SECTION_TO_TITLE_MAP: Record<string, string> = {
  Tienda: 'Productos Recomendados',
  Destacados: 'Productos Destacados',
  Tendencias: 'Tendencias',
  'Lanzamientos & Oportunidades': 'Lanzamientos & Oportunidades',
};
```

## Navigation Flow

1. **Initial Load**:
   - Load with default category "Todo" or from URL parameters
   - Secondary tabs are hidden for "Todo" category or label-based categories
   - Display appropriate models for regular product categories
   - Fetch and display matching products

2. **Category/Label Selection**:
   - User selects a regular category or label category from primary tabs
   - For regular product categories:
     - Available models update based on the category
     - Model selection resets to "Todos" (unless specified in URL)
     - Secondary tabs appear if multiple models are available
   - For label-based categories:
     - No secondary tabs are shown
     - Products are filtered by the corresponding product label
   - Products update based on selection
   - URL parameters update to reflect the selection

3. **Model Selection**:
   - User selects a model within the current category
   - Products update to match the category and model combination
   - URL parameters update to include the selected model

4. **Filter Application**:
   - Products can be further filtered using the filter overlay
   - Available filters are calculated based on the current product set
   - Filters are reset when changing categories or models

## Implementation Details

### State Management

The catalog screen uses several state variables:

```typescript
const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
const [activeModelId, setActiveModelId] = useState(initialModelId);
const [availableModels, setAvailableModels] = useState<ProductModel[]>([]);
const [categoryModelProducts, setCategoryModelProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [appliedFilters, setAppliedFilters] = useState<ProductFilters>({});
```

### URL Parameter Handling

The screen maintains URL parameters to support deep linking and browser navigation:

```typescript
const params = useLocalSearchParams<{ category?: string; title?: string; model?: string }>();
```

When categories or models change, URL parameters are updated:

```typescript
router.setParams(Object.fromEntries(newParams));
```

### Product Filtering

Products are filtered in a multi-step process:

1. First by category or label:
   - For regular categories: filter by category ID
   - For label categories: filter by product label
   - For "Todo" category: include all products

2. Then by model (for regular categories only)

3. Finally by applied filters using the `useProductFilters` hook

```typescript
// Function to get products by category or by label
export const getProductsByCategory = (categoryId: string): Product[] => {
  // Return all products for the "todo" category
  if (categoryId === 'todo') {
    return products;
  }

  // Handle special categories based on product labels
  switch (categoryId) {
    case 'new':
      return products.filter((product) => product.label === ProductLabel.NEW);
    case 'featured':
      return products.filter((product) => product.label === ProductLabel.FEATURED);
    // Other label categories...
    // Regular product categories
    default:
      return products.filter((product) => product.categoryId === categoryId);
  }
};

// Get products by category and model
const products = ProductData.getProductsByCategoryAndModel(activeCategoryId, activeModelId);

// Apply additional filters
const productsToDisplay = useProductFilters(categoryModelProducts, appliedFilters);
```

### Model Display Condition

The secondary tabs (models) are only shown when necessary:

```typescript
{availableModels.length > 1 && (
  <TabBar<ProductModel>
    items={availableModels}
    activeItemId={activeModelId}
    onSelectItem={handleModelChange}
    style={styles.modelsTabBar}
    itemStyle={styles.modelItem}
    activeItemStyle={styles.activeModelItem}
    activeUnderlineStyle={styles.activeModelUnderline}
  />
)}
```

The availability of models is controlled by the category change effect:

```typescript
useEffect(() => {
  // Check if the selected category is a regular product category or a label-based category
  const selectedCategory = mainCategories.find((cat) => cat.id === activeCategoryId);
  const isLabelCategory = selectedCategory?.isLabel || activeCategoryId === 'todo';

  // Don't show secondary tabs for "Todo" or label-based categories
  if (isLabelCategory) {
    setAvailableModels([]);
  } else {
    // Get models for the selected category (from useProductModels hook)
    const modelsForCategory = getModelsByCategory(activeCategoryId);
    setAvailableModels(modelsForCategory);
  }
}, [activeCategoryId, params.model, mainCategories, getModelsByCategory]);
```

This ensures that:

1. Secondary tabs are hidden when there's only one model available (no choice needed)
2. Secondary tabs are hidden when the "Todo" category is selected
3. Secondary tabs are hidden when a label-based category is selected

### Model Functions

The system provides several utility functions for working with models:

```typescript
// Get models for a specific category (always includes an "all" option)
export function getModelsByCategory(categoryId: string): ProductModel[] {
  if (categoryId === 'todo') {
    return []; // No models for 'todo' category
  }

  const categoryModels = productModels.filter((model) => model.categoryId === categoryId);

  // Add "Todos" model at the beginning
  return [{ id: 'all', name: 'Todos', slug: 'todos', categoryId }, ...categoryModels];
}

// Get products by category and model
export const getProductsByCategoryAndModel = (categoryId: string, modelId: string): Product[] => {
  let categoryProducts = getProductsByCategory(categoryId);

  if (modelId === 'all') {
    return categoryProducts;
  }

  return categoryProducts.filter((product) => product.modelId === modelId);
};
```

## Integration with Other Systems

- **Navigation System**: Uses Expo Router for parameter handling and navigation
- **Header Component**: Integrates with the store header for filter access
- **Product Cards**: Displays filtered products in a grid layout
- **Filtering System**: Uses `useProductFilters` hook for additional filtering
- **Loading States**: Shows skeleton loaders during data fetching
- **Product Status Labels**: Preserves product status labeling through the model system
- **Preloading Service**: Integrates with the app's preloading system to pre-compute category-model relationships

## Data Loading & Precomputation

For performance reasons, the app precomputes category-model relationships during app startup:

```typescript
// Pre-compute category-model map for all categories
const categoryModelMap: Record<string, ProductModel[]> = {};

// For each category with products, get available models
const categories = ProductData.products.reduce((acc, product) => {
  if (!acc.includes(product.categoryId)) {
    acc.push(product.categoryId);
  }
  return acc;
}, [] as string[]);

// Add 'todo' category
if (!categories.includes('todo')) {
  categories.push('todo');
}

// For each category, get available models
categories.forEach((categoryId) => {
  categoryModelMap[categoryId] = ModelsData.getModelsByCategory(categoryId);
});
```

## API Integration

The catalog system fetches categories and models from the Strapi API with automatic fallback to local data.

### useCategories Hook

```typescript
const { mainCategories, labelCategories, productCategories, isLoadingCategories } = useCategories();
```

- Fetches categories from `strapiApi.fetchCategories()`
- Falls back to local `CategoryData` if API fails
- Caches results to avoid repeated API calls
- Excludes HIGHLIGHTED label from `labelCategories` (used only on home screen)

### useProductModels Hook

```typescript
const { productModels, getModelsByCategory, isLoadingModels } = useProductModels();
```

- Fetches models from `strapiApi.fetchProductModels()`
- Falls back to local `ModelsData` if API fails
- Provides `getModelsByCategory(categoryId)` for filtered model lists
- Caches results to avoid repeated API calls
