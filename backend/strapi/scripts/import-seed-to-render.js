#!/usr/bin/env node

/**
 * Import seed data to Render Strapi instance via REST API
 * This script reads JSON files from the seed directory and imports them to the production database
 *
 * Features:
 * - Deletes existing products (optional, with --clean flag)
 * - Uploads product images to Strapi media library
 * - Creates products with linked images
 * - Updates existing entries with --update flag (Strapi v5 documentId support)
 *
 * ONE-TIME CLEANUP GUIDANCE (Step 1.3):
 * Before running --update, manually deactivate in Strapi admin:
 * 1. Any label categories that were previously created (todo, sale, new, featured, etc.)
 *    - These should not exist in Strapi; they are app-side virtual categories
 * 2. The "sale" product status if it exists
 *    - Discounts are driven by discountedPrice field, not by status
 *
 * After cleanup, run: STRAPI_API_TOKEN=xxx node import-seed-to-render.js --update
 * This will:
 * - Update model slugs to match app MODEL_IDS (e.g., regular -> regular_bag for bolsos)
 * - Remap product model relations to use the new canonical slugs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

// Paths
const SEED_DIR = path.join(__dirname, '..', 'seed');
const ASSETS_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'images', 'products');

// Image mapping: product slug -> image filename (without /products/ prefix)
// Based on verified image-to-product linking from product_image_mapping.json
const PRODUCT_IMAGE_MAP = {
  'backpack-pro': 'product_bag_6.png',
  'mochila-gold': 'mochila-gold.png',
  'mochila-black': 'mochila-black.png',
  'antideslizantes-1': 'antideslizantes.png',
  'antideslizantes-2': 'antideslizantes-2.png',
  'shinguards-pro': 'shinguards-1.png',
  'backpack-travel': 'product_bag_3.png',
  'campera-deportiva': 'campera-deportiva-bg.png',
  'tiffosi-antideslizante-1': 'antideslizantes-3.png',
  'mochila-classic': 'product_bag_1.png',
  'neceser-f2': 'neceser9-3.png',
  'relaxed-classic': 'product_shirt_white.png',
  'neceser-globo': 'product_bag_4.png',
  'shinguards-lite': 'shinguards-2.png',
  'shirt-os-black': 'shirt-os-black.png',
  'tiffosi-fast': 'tiffosi-fast.png',
  'socks-v2': 'socks-v2.png',
  'relaxed-black': 'product_t_shirt_black.png',
  'buzo-oversize': 'product_shirt_black_relaxed.png',
  'neceser-ball': 'neceser-pelota.png',
  'mochila-sq': 'mochila-squared.png',
  'neceser-wx': 'product_bag_5.png',
  'black-neceser': 'neceser9-1.png',
  'cap-v3': 'product_cap_black.png',
  'classic-socks': 'product_socks_1.png',
  'regular-black': 'product_shirt_black_regular.png',
  'antideslizante-nando': 'antideslizante-nando.png',
  'shinguards-nico': 'shinguards-nico.png',
};

// Color-specific images for products with multiple colors
// Based on verified image-to-product linking from product_image_mapping.json
const COLOR_IMAGE_MAP = {
  'tiffosi-fast': {
    Blanco: ['sock-color-1.png'],
    Negro: ['sock-color-2.png'],
    Naranja: ['sock-color-3.png'],
    Verde: ['sock-color-5.png'],
    Amarillo: ['sock-color-4.png'],
  },
  'socks-v2': {
    Blanco: ['product_socks_0.png', 'white-sock-1.png', 'white-sock-2.png', 'white-sock-3.png'],
    Negro: ['product_socks_2.png'],
  },
  'shirt-os-black': {
    Negro: ['shirt-os-black-1.png', 'shirt-os-black-2.png', 'shirt-os-black-3.png'],
  },
  'neceser-f2': {
    Negro: ['neceser9-3.png', 'neceser9-1.png', 'neceser9-4.png'],
  },
  'buzo-oversize': {
    Negro: ['product_shirt_black_relaxed.png', 'product_sweater.png'],
  },
  'shinguards-lite': {
    Blanco: ['shinguards-2.png', 'shinguards-1.png'],
  },
  'black-neceser': {
    Negro: ['neceser9-1.png', 'neceser9-4.png'],
  },
  'regular-black': {
    Blanco: ['product_shirt_white.png'],
    Negro: ['product_shirt_black_regular.png'],
  },
};

// Parse command line arguments early (before API token check for --help)
const args = process.argv.slice(2);
const CLEAN_PRODUCTS = args.includes('--clean') || args.includes('-c');
const UPLOAD_IMAGES = args.includes('--images') || args.includes('-i');
const SKIP_EXISTING = args.includes('--skip-existing') || args.includes('-s');
const UPDATE_MODE = args.includes('--update') || args.includes('-u');
const CLEANUP_ORPHANS = args.includes('--cleanup');
const SHOW_HELP = args.includes('--help') || args.includes('-h');

if (!API_TOKEN && !SHOW_HELP) {
  console.error('STRAPI_API_TOKEN environment variable is required');
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

    // Handle DELETE responses (often return 204 No Content or empty body)
    if (method === 'DELETE') {
      if (response.ok || response.status === 204) {
        return { success: true };
      }
      const text = await response.text();
      throw new Error(`Delete failed: ${response.status} - ${text}`);
    }

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

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

// Upload a file to Strapi media library using native FormData
async function uploadFile(filePath, refId = null, ref = null, field = null) {
  const url = `${STRAPI_URL}/api/upload`;
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const form = new FormData();
  form.append('files', blob, fileName);

  if (refId && ref && field) {
    form.append('refId', refId);
    form.append('ref', ref);
    form.append('field', field);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: form,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Upload Error (${response.status}):`, JSON.stringify(result, null, 2));
      throw new Error(`Upload failed: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`Upload failed for ${filePath}:`, error.message);
    throw error;
  }
}

// Read seed file
function readSeedFile(filename) {
  const filepath = path.join(SEED_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Delete all products (handles pagination)
async function deleteAllProducts() {
  console.log('\n🗑️  Deleting existing products...');

  try {
    // Get all products with pagination
    let allProducts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await strapiRequest(`/products?pagination[page]=${page}&pagination[pageSize]=100`);
      const products = response.data || [];
      allProducts = allProducts.concat(products);

      const pagination = response.meta?.pagination || {};
      hasMore = page < (pagination.pageCount || 1);
      page++;
    }

    if (allProducts.length === 0) {
      console.log('  → No products to delete');
      return;
    }

    console.log(`  Found ${allProducts.length} products to delete`);

    for (const product of allProducts) {
      try {
        // Strapi v5 uses documentId for REST API operations
        const deleteId = product.documentId || product.id;
        await strapiRequest(`/products/${deleteId}`, 'DELETE');
        console.log(`  ✓ Deleted: ${product.title || deleteId}`);
      } catch (error) {
        console.error(`  ✗ Failed to delete product ${product.documentId || product.id}:`, error.message);
      }
    }

    console.log('  ✓ All products deleted');
  } catch (error) {
    console.error('  ✗ Failed to delete products:', error.message);
  }
}

// Upload all product images and return a map of filename -> media ID
async function uploadProductImages() {
  console.log('\n📸 Uploading product images...');

  const uploadedImages = {};

  // Get list of unique images needed
  const imagesToUpload = new Set();

  // Add main product images
  Object.values(PRODUCT_IMAGE_MAP).forEach((img) => imagesToUpload.add(img));

  // Add color-specific images
  Object.values(COLOR_IMAGE_MAP).forEach((colors) => {
    Object.values(colors).forEach((imgs) => {
      imgs.forEach((img) => imagesToUpload.add(img));
    });
  });

  console.log(`  Found ${imagesToUpload.size} unique images to upload`);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const filename of imagesToUpload) {
    const filePath = path.join(ASSETS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`  → Skipping (not found): ${filename}`);
      continue;
    }

    try {
      const result = await uploadFile(filePath);
      if (result && result[0]) {
        uploadedImages[filename] = result[0].id;
        console.log(`  ✓ Uploaded: ${filename} (ID: ${result[0].id})`);
      }
      // Add delay between uploads to avoid overwhelming Render/Cloudinary
      await delay(3000);
    } catch (error) {
      console.error(`  ✗ Failed to upload ${filename}:`, error.message);
      // Wait longer on error (might be rate limited)
      await delay(10000);
    }
  }

  return uploadedImages;
}

// Import product statuses
async function importProductStatuses() {
  console.log('\n📋 Importing product statuses...');
  const statuses = readSeedFile('product-statuses.json');

  for (const status of statuses) {
    try {
      const existing = await strapiRequest(`/product-statuses?filters[name][$eq]=${status.name}`);

      if (existing.data && existing.data.length > 0) {
        if (UPDATE_MODE) {
          const existingStatus = existing.data[0];
          await strapiRequest(`/product-statuses/${existingStatus.documentId}`, 'PUT', {
            displayOrder: status.displayOrder,
            description: status.description,
            isActive: status.isActive,
          });
          console.log(`  ✓ Updated status: ${status.name}`);
        } else {
          console.log(`  → Status already exists: ${status.name}`);
        }
      } else {
        await strapiRequest('/product-statuses', 'POST', {
          ...status,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created status: ${status.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create/update status ${status.name}:`, error.message);
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
        if (UPDATE_MODE) {
          const existingCat = existing.data[0];
          await strapiRequest(`/categories/${existingCat.documentId}`, 'PUT', {
            name: category.name,
            displayOrder: category.displayOrder,
            description: category.description,
            isActive: category.isActive,
          });
          console.log(`  ✓ Updated category: ${category.name}`);
        } else {
          console.log(`  → Category already exists: ${category.name}`);
        }
      } else {
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
      console.error(`  ✗ Failed to create/update category ${category.name}:`, error.message);
    }
  }
}

// Cleanup orphaned categories and models not in seed files
async function cleanupOrphans() {
  console.log('\n🧹 Cleaning up orphaned entries...');

  // Get seed data
  const seedCategories = readSeedFile('categories.json');
  const seedModels = readSeedFile('product-models.json');
  const seedCategorySlugs = new Set(seedCategories.map((c) => c.slug));
  const seedModelSlugs = new Set(seedModels.map((m) => m.slug));

  // Cleanup orphaned categories
  const strapiCategories = await strapiRequest('/categories?pagination[limit]=100');
  const categoriesToDelete = (strapiCategories.data || []).filter((c) => !seedCategorySlugs.has(c.slug));

  for (const cat of categoriesToDelete) {
    try {
      await strapiRequest(`/categories/${cat.documentId}`, 'DELETE');
      console.log(`  ✓ Deleted category: ${cat.name} (${cat.slug})`);
    } catch (error) {
      console.error(`  ✗ Failed to delete category ${cat.name}:`, error.message);
    }
  }

  if (categoriesToDelete.length === 0) {
    console.log('  → No orphaned categories to delete');
  }

  // Cleanup orphaned models
  const strapiModels = await strapiRequest('/product-models?pagination[limit]=100');
  const modelsToDelete = (strapiModels.data || []).filter((m) => !seedModelSlugs.has(m.slug));

  for (const model of modelsToDelete) {
    try {
      await strapiRequest(`/product-models/${model.documentId}`, 'DELETE');
      console.log(`  ✓ Deleted model: ${model.name} (${model.slug})`);
    } catch (error) {
      console.error(`  ✗ Failed to delete model ${model.name}:`, error.message);
    }
  }

  if (modelsToDelete.length === 0) {
    console.log('  → No orphaned models to delete');
  }
}

// Import product models
async function importProductModels() {
  console.log('\n🏃 Importing product models...');
  const models = readSeedFile('product-models.json');

  const categoriesResponse = await strapiRequest('/categories?pagination[limit]=100');
  const categories = categoriesResponse.data || [];
  // Strapi v5: use documentId for relations, not numeric id
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat.slug] = cat.documentId;
  });

  for (const model of models) {
    try {
      // Check by slug first
      let existing = await strapiRequest(`/product-models?filters[slug][$eq]=${model.slug}`);

      // For update mode: if slug not found, try matching by (categorySlug + name)
      if (UPDATE_MODE && (!existing.data || existing.data.length === 0)) {
        const byName = await strapiRequest(
          `/product-models?filters[name][$eq]=${encodeURIComponent(model.name)}&populate=category`
        );
        if (byName.data && byName.data.length > 0) {
          // Find one with matching category
          existing = {
            data: byName.data.filter((m) => m.category?.slug === model.categorySlug),
          };
        }
      }

      if (existing.data && existing.data.length > 0) {
        if (UPDATE_MODE) {
          const existingModel = existing.data[0];
          const categoryDocId = categoryMap[model.categorySlug];
          await strapiRequest(`/product-models/${existingModel.documentId}`, 'PUT', {
            name: model.name,
            slug: model.slug,
            description: model.description,
            displayOrder: model.displayOrder,
            isActive: model.isActive,
            category: categoryDocId,
          });
          console.log(`  ✓ Updated model: ${model.name} (slug: ${model.slug})`);
        } else {
          console.log(`  → Model already exists: ${model.name}`);
        }
      } else {
        const categoryDocId = categoryMap[model.categorySlug];
        await strapiRequest('/product-models', 'POST', {
          name: model.name,
          slug: model.slug,
          description: model.description,
          displayOrder: model.displayOrder,
          isActive: model.isActive,
          category: categoryDocId,
          publishedAt: new Date().toISOString(),
        });
        console.log(`  ✓ Created model: ${model.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create/update model ${model.name}:`, error.message);
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

// Import products with images
async function importProducts(uploadedImages = {}) {
  console.log('\n👕 Importing products...');
  const products = readSeedFile('products.json');

  const [categoriesRes, modelsRes, statusesRes] = await Promise.all([
    strapiRequest('/categories?pagination[limit]=100'),
    strapiRequest('/product-models?pagination[limit]=100'),
    strapiRequest('/product-statuses?pagination[limit]=100'),
  ]);

  const categoryMap = {};
  const modelMap = {};
  const statusMap = {};

  (categoriesRes.data || []).forEach((cat) => (categoryMap[cat.slug] = cat.documentId));
  (modelsRes.data || []).forEach((model) => (modelMap[model.slug] = model.documentId));
  (statusesRes.data || []).forEach((status) => (statusMap[status.name] = status.documentId));

  for (const product of products) {
    try {
      // Check if product exists
      const existingRes = await strapiRequest(`/products?filters[slug][$eq]=${product.slug}`);
      const existingProduct = existingRes.data?.[0];

      if (SKIP_EXISTING && existingProduct) {
        console.log(`  → Product already exists: ${product.title}`);
        continue;
      }

      const categoryId = categoryMap[product.categorySlug];
      const modelId = modelMap[product.modelSlug];
      const statusIds = (product.statusNames || []).map((name) => statusMap[name]).filter(Boolean);

      // Transform sizes
      const transformedSizes = (product.sizes || []).map((size) => ({
        name: size.value || size.name,
        code: size.value || size.name,
        stock: size.stock || 0,
        isActive: size.available !== undefined ? size.available : size.isActive !== false,
        displayOrder: size.displayOrder || 0,
      }));

      // Transform dimensions
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
        Object.keys(transformedDimensions).forEach(
          (key) => transformedDimensions[key] === null && delete transformedDimensions[key]
        );
      }

      // Get front image ID if uploaded
      const frontImageFilename = PRODUCT_IMAGE_MAP[product.slug];
      const frontImageId = frontImageFilename ? uploadedImages[frontImageFilename] : null;

      // Enrich colors with image IDs from COLOR_IMAGE_MAP
      const colorImageMapping = COLOR_IMAGE_MAP[product.slug] || {};
      const enrichedColors = (product.colors || []).map((color) => {
        const colorImages = colorImageMapping[color.colorName];
        if (!colorImages || colorImages.length === 0) {
          return color;
        }

        // First image is main, rest are additional
        const [mainFilename, ...additionalFilenames] = colorImages;
        const mainImageId = uploadedImages[mainFilename];
        const additionalImageIds = additionalFilenames
          .map((f) => uploadedImages[f])
          .filter(Boolean);

        return {
          ...color,
          images: {
            main: mainImageId || null,
            additional: additionalImageIds.length > 0 ? additionalImageIds : undefined,
          },
        };
      });

      const productData = {
        title: product.title,
        slug: product.slug,
        price: product.price,
        discountedPrice: product.discountedPrice,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        warranty: product.warranty,
        returnPolicy: product.returnPolicy,
        dimensions: transformedDimensions,
        colors: enrichedColors,
        sizes: transformedSizes,
        category: categoryId,
        model: modelId,
        statuses: statusIds.length > 0 ? { connect: statusIds.map((id) => ({ documentId: id })) } : undefined,
        totalStock: product.colors?.reduce((sum, c) => sum + (c.quantity || 0), 0) || 0,
        isActive: true,
        isCustomizable: product.isCustomizable || false,
      };

      // Add front image if available
      if (frontImageId) {
        productData.frontImage = frontImageId;
      }

      if (UPDATE_MODE && existingProduct) {
        // Update existing product - remap model relation to use new slug
        // Exclude media fields (frontImage, images in colors) since Strapi v5 doesn't accept them on PUT
        const updateData = { ...productData };
        delete updateData.frontImage;
        if (updateData.colors) {
          updateData.colors = updateData.colors.map((c) => {
            const { images, ...colorWithoutImages } = c;
            return colorWithoutImages;
          });
        }
        await strapiRequest(`/products/${existingProduct.documentId}`, 'PUT', updateData);
        console.log(`  ✓ Updated product: ${product.title} (model: ${product.modelSlug})`);
      } else if (!existingProduct) {
        // Create new product
        productData.publishedAt = new Date().toISOString();
        await strapiRequest('/products', 'POST', productData);
        const hasColorImages = enrichedColors.some((c) => c.images?.main);
        const imageInfo = [frontImageId ? 'front' : null, hasColorImages ? 'color gallery' : null]
          .filter(Boolean)
          .join(' + ');
        console.log(`  ✓ Created product: ${product.title}${imageInfo ? ` (${imageInfo})` : ''}`);
      } else {
        console.log(`  → Product already exists: ${product.title}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create/update product ${product.title}:`, error.message);
    }
  }
}

// Main import function
async function importAll() {
  console.log('🌱 Starting seed data import to Render...');
  console.log(`📡 Target: ${STRAPI_URL}`);
  console.log(
    `🔧 Options: clean=${CLEAN_PRODUCTS}, images=${UPLOAD_IMAGES}, skip-existing=${SKIP_EXISTING}, update=${UPDATE_MODE}, cleanup=${CLEANUP_ORPHANS}`
  );

  try {
    // Delete existing products if --clean flag is set
    if (CLEAN_PRODUCTS) {
      await deleteAllProducts();
    }

    // Upload images if --images flag is set
    let uploadedImages = {};
    if (UPLOAD_IMAGES) {
      uploadedImages = await uploadProductImages();
    }

    // Import in dependency order
    await importProductStatuses();
    await importCategories();
    await importProductModels();
    await importStoreLocations();
    await importProducts(uploadedImages);

    // Cleanup orphaned entries if --cleanup flag is set
    if (CLEANUP_ORPHANS) {
      await cleanupOrphans();
    }

    console.log('\n✅ Seed data import completed successfully!');
    console.log('\n📱 Your app should now display products from Render backend');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Show help
function showHelp() {
  console.log(`
Usage: node import-seed-to-render.js [options]

Options:
  --clean, -c          Delete all existing products before importing
  --images, -i         Upload product images to Strapi media library
  --skip-existing, -s  Skip products that already exist
  --update, -u         Update existing entries instead of skipping them
                       - Categories: updates name, displayOrder, description, isActive by slug
                       - Models: updates by slug; if slug not found, matches by (categorySlug + name)
                         then sets the canonical slug from seed data
                       - Products: remaps model relation to use new model slug mapping
  --cleanup            Delete categories and models in Strapi that are not in seed files
                       (removes orphaned/virtual entries like label categories)
  --help, -h           Show this help message

Environment Variables:
  STRAPI_URL           Strapi backend URL (default: https://tifossi-strapi-backend.onrender.com)
  STRAPI_API_TOKEN  API token for authentication (required)

Examples:
  # Import only (skip existing)
  STRAPI_API_TOKEN=xxx node import-seed-to-render.js -s

  # Clean import with images
  STRAPI_API_TOKEN=xxx node import-seed-to-render.js --clean --images

  # Full fresh import
  STRAPI_API_TOKEN=xxx node import-seed-to-render.js -c -i

  # Update existing entries (fix model slugs, remap relations)
  STRAPI_API_TOKEN=xxx node import-seed-to-render.js --update
`);
}

// Run if called directly
if (require.main === module) {
  if (SHOW_HELP) {
    showHelp();
  } else {
    importAll();
  }
}

module.exports = { importAll, deleteAllProducts, uploadProductImages };
