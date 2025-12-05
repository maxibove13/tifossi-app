#!/usr/bin/env node

/**
 * Import seed data to Render Strapi instance via REST API
 * This script reads JSON files from the seed directory and imports them to the production database
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';
const API_TOKEN = process.env.STRAPI_API_TOKEN; // Admin API token from Render dashboard

if (!API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable is required');
  console.error('Get it from: Strapi Admin → Settings → API Tokens');
  process.exit(1);
}

// Helper to make API requests
async function strapiRequest(endpoint, method = 'GET', data = null) {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
  };

  if (data) {
    options.body = JSON.stringify({ data });
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      console.error(`API Error (${response.status}):`, JSON.stringify(result, null, 2));
      throw new Error(`API request failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Read seed file
function readSeedFile(filename) {
  const filepath = path.join(__dirname, '..', 'seed', filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Import product statuses
async function importProductStatuses() {
  console.log('\n📋 Importing product statuses...');
  const statuses = readSeedFile('product-statuses.json');

  for (const status of statuses) {
    try {
      // Check if exists
      const existing = await strapiRequest(`/product-statuses?filters[name][$eq]=${status.name}`);

      if (existing.data && existing.data.length > 0) {
        console.log(`  → Status already exists: ${status.name}`);
      } else {
        await strapiRequest('/product-statuses', 'POST', {
          ...status,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created status: ${status.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create status ${status.name}:`, error.message);
    }
  }
}

// Import categories
async function importCategories() {
  console.log('\n📂 Importing categories...');
  const categories = readSeedFile('categories.json');

  for (const category of categories) {
    try {
      const existing = await strapiRequest(`/categories?filters[slug][$eq]=${category.slug}`);

      if (existing.data && existing.data.length > 0) {
        console.log(`  → Category already exists: ${category.name}`);
      } else {
        // Only include valid schema fields (exclude isLabel, labelType)
        await strapiRequest('/categories', 'POST', {
          name: category.name,
          slug: category.slug,
          displayOrder: category.displayOrder,
          description: category.description,
          isActive: category.isActive,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created category: ${category.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create category ${category.name}:`, error.message);
    }
  }
}

// Import product models
async function importProductModels() {
  console.log('\n🏃 Importing product models...');
  const models = readSeedFile('product-models.json');

  // Get category IDs for relationships
  const categoriesResponse = await strapiRequest('/categories?pagination[limit]=100');
  const categories = categoriesResponse.data || [];
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat.slug] = cat.id;
  });

  for (const model of models) {
    try {
      const existing = await strapiRequest(`/product-models?filters[slug][$eq]=${model.slug}`);

      if (existing.data && existing.data.length > 0) {
        console.log(`  → Model already exists: ${model.name}`);
      } else {
        const categoryId = categoryMap[model.categorySlug];
        await strapiRequest('/product-models', 'POST', {
          name: model.name,
          slug: model.slug,
          description: model.description,
          displayOrder: model.displayOrder,
          isActive: model.isActive,
          category: categoryId,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created model: ${model.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create model ${model.name}:`, error.message);
    }
  }
}

// Import store locations
async function importStoreLocations() {
  console.log('\n🏪 Importing store locations...');
  const locations = readSeedFile('store-locations.json');

  for (const location of locations) {
    try {
      const existing = await strapiRequest(`/store-locations?filters[code][$eq]=${location.code}`);

      if (existing.data && existing.data.length > 0) {
        console.log(`  → Location already exists: ${location.name}`);
      } else {
        // Transform address to match schema (firstName, lastName, addressLine1, city, country required)
        const addr = location.address || {};
        const transformedAddress = {
          firstName: 'Tifossi',
          lastName: 'Store',
          addressLine1: `${addr.street || ''} ${addr.number || ''}`.trim(),
          addressLine2: addr.neighborhood || '',
          city: addr.city || 'Montevideo',
          state: addr.department || '',
          country: 'UY',
          phoneNumber: addr.phoneNumber || location.phoneNumber || '',
          isDefault: addr.isDefault || false,
          type: 'both',
        };

        // Transform operatingHours: isOpen -> isClosed
        const transformedHours = (location.operatingHours || []).map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime || null,
          closeTime: h.closeTime || null,
          isClosed: h.isOpen === false,
          notes: h.notes || null,
        }));

        await strapiRequest('/store-locations', 'POST', {
          name: location.name,
          slug: location.slug,
          code: location.code,
          description: location.description,
          address: transformedAddress,
          phoneNumber: location.phoneNumber,
          email: location.email,
          operatingHours: transformedHours,
          hasPickupService: location.hasPickupService,
          hasParking: location.hasParking,
          isAccessible: location.isAccessible,
          maxPickupItems: location.maxPickupItems,
          isActive: location.isActive,
          displayOrder: location.displayOrder,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created location: ${location.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create location ${location.name}:`, error.message);
    }
  }
}

// Import products
async function importProducts() {
  console.log('\n👕 Importing products...');
  const products = readSeedFile('products.json');

  // Get IDs for relationships
  const [categoriesRes, modelsRes, statusesRes] = await Promise.all([
    strapiRequest('/categories?pagination[limit]=100'),
    strapiRequest('/product-models?pagination[limit]=100'),
    strapiRequest('/product-statuses?pagination[limit]=100'),
  ]);

  const categoryMap = {};
  const modelMap = {};
  const statusMap = {};

  (categoriesRes.data || []).forEach((cat) => (categoryMap[cat.slug] = cat.id));
  (modelsRes.data || []).forEach((model) => (modelMap[model.slug] = model.id));
  (statusesRes.data || []).forEach((status) => (statusMap[status.name] = status.id));

  for (const product of products) {
    try {
      const existing = await strapiRequest(`/products?filters[slug][$eq]=${product.slug}`);

      if (existing.data && existing.data.length > 0) {
        console.log(`  → Product already exists: ${product.title}`);
      } else {
        const categoryId = categoryMap[product.categorySlug];
        const modelId = modelMap[product.modelSlug];
        const statusIds = (product.statusNames || [])
          .map((name) => statusMap[name])
          .filter(Boolean);

        // Transform sizes: value -> name, available -> isActive
        const transformedSizes = (product.sizes || []).map((size) => ({
          name: size.value || size.name,
          code: size.value || size.name,
          stock: size.stock || 0,
          isActive: size.available !== undefined ? size.available : size.isActive !== false,
          displayOrder: size.displayOrder || 0,
        }));

        // Transform dimensions: map depth -> length, remove invalid fields
        let transformedDimensions = null;
        if (product.dimensions) {
          const dims = product.dimensions;
          transformedDimensions = {
            length: dims.length || dims.depth || null,
            width: dims.width || null,
            height: dims.height || null,
            weight: dims.weight || null,
            unit: dims.unit || 'cm',
            weightUnit: dims.weightUnit || 'g',
          };
          // Remove null values
          Object.keys(transformedDimensions).forEach(
            (key) => transformedDimensions[key] === null && delete transformedDimensions[key]
          );
        }

        await strapiRequest('/products', 'POST', {
          title: product.title,
          slug: product.slug,
          price: product.price,
          discountedPrice: product.discountedPrice,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          warranty: product.warranty,
          returnPolicy: product.returnPolicy,
          dimensions: transformedDimensions,
          colors: product.colors,
          sizes: transformedSizes,
          category: categoryId,
          model: modelId,
          statuses: statusIds,
          totalStock: product.colors?.reduce((sum, c) => sum + (c.quantity || 0), 0) || 0,
          isActive: true,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created product: ${product.title}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create product ${product.title}:`, error.message);
    }
  }
}

// Main import function
async function importAll() {
  console.log('🌱 Starting seed data import to Render...');
  console.log(`📡 Target: ${STRAPI_URL}`);

  try {
    // Import in dependency order
    await importProductStatuses();
    await importCategories();
    await importProductModels();
    await importStoreLocations();
    await importProducts();

    console.log('\n✅ Seed data import completed successfully!');
    console.log('\n📱 Your app should now display products from Render backend');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importAll();
}

module.exports = { importAll };
