#!/usr/bin/env node

/**
 * Upload a single product image and link it to a specific field
 *
 * Usage:
 *   # Product front image (auto-detects from PRODUCT_IMAGE_MAP)
 *   node upload-product-image.js --slug mochila-sq --field frontImage
 *
 *   # Product front image with explicit file
 *   node upload-product-image.js --slug mochila-sq --field frontImage --image mochila-squared.png
 *
 *   # Add to product gallery
 *   node upload-product-image.js --slug mochila-sq --field images --image gallery-1.png
 *
 *   # Color-specific main image
 *   node upload-product-image.js --slug socks-v2 --field mainImage --color Negro --image product_socks_2.png
 *
 *   # Color-specific additional images
 *   node upload-product-image.js --slug socks-v2 --field additionalImages --color Blanco --image white-sock-1.png
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

// Paths
const ASSETS_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'images', 'products');

// Default image mapping (same as import script)
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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    slug: null,
    field: 'frontImage',
    image: null,
    color: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--slug':
      case '-s':
        options.slug = args[++i];
        break;
      case '--field':
      case '-f':
        options.field = args[++i];
        break;
      case '--image':
      case '-i':
        options.image = args[++i];
        break;
      case '--color':
      case '-c':
        options.color = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Upload a single product image and link it to Strapi

Usage: node upload-product-image.js [options]

Options:
  --slug, -s       Product slug (required)
  --field, -f      Image field: frontImage, images, mainImage, additionalImages (default: frontImage)
  --image, -i      Image filename in assets/images/products/ (auto-detected for frontImage)
  --color, -c      Color name (required for mainImage/additionalImages)
  --help, -h       Show this help

Examples:
  # Upload front image (auto-detects filename from map)
  STRAPI_API_TOKEN=xxx node upload-product-image.js --slug mochila-sq --field frontImage

  # Upload specific image to product gallery
  STRAPI_API_TOKEN=xxx node upload-product-image.js --slug mochila-sq --field images --image gallery.png

  # Upload color-specific image
  STRAPI_API_TOKEN=xxx node upload-product-image.js --slug socks-v2 --field mainImage --color Negro --image product_socks_2.png

Environment Variables:
  STRAPI_URL         Strapi backend URL (default: https://tifossi-strapi-backend.onrender.com)
  STRAPI_API_TOKEN   API token for authentication (required)
`);
}

// API request helper
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

  const response = await fetch(url, options);
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    console.error(`API Error (${response.status}):`, JSON.stringify(result, null, 2));
    throw new Error(`API request failed: ${response.status}`);
  }

  return result;
}

// Upload file to Strapi media library
async function uploadFile(filePath) {
  const url = `${STRAPI_URL}/api/upload`;
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const form = new FormData();
  form.append('files', blob, fileName);

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

  return result[0]; // Return first uploaded file
}

// Get product by slug
async function getProduct(slug) {
  const response = await strapiRequest(
    `/products?filters[slug][$eq]=${slug}&populate=frontImage,images,colors`
  );

  if (!response.data || response.data.length === 0) {
    throw new Error(`Product not found: ${slug}`);
  }

  return response.data[0];
}

// Update product field
async function updateProduct(documentId, data) {
  return strapiRequest(`/products/${documentId}`, 'PUT', data);
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!API_TOKEN) {
    console.error('Error: STRAPI_API_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!options.slug) {
    console.error('Error: --slug is required');
    showHelp();
    process.exit(1);
  }

  const isColorField = ['mainImage', 'additionalImages'].includes(options.field);
  if (isColorField && !options.color) {
    console.error(`Error: --color is required for field "${options.field}"`);
    process.exit(1);
  }

  // Determine image file
  let imageFile = options.image;
  if (!imageFile && options.field === 'frontImage') {
    imageFile = PRODUCT_IMAGE_MAP[options.slug];
    if (!imageFile) {
      console.error(`Error: No default image mapping for "${options.slug}". Use --image to specify.`);
      process.exit(1);
    }
  }

  if (!imageFile) {
    console.error('Error: --image is required for this field');
    process.exit(1);
  }

  const imagePath = path.join(ASSETS_DIR, imageFile);
  if (!fs.existsSync(imagePath)) {
    console.error(`Error: Image not found: ${imagePath}`);
    process.exit(1);
  }

  console.log(`Uploading image for product: ${options.slug}`);
  console.log(`  Field: ${options.field}`);
  console.log(`  Image: ${imageFile}`);
  if (options.color) console.log(`  Color: ${options.color}`);

  try {
    // 1. Get current product
    console.log('\nFetching product...');
    const product = await getProduct(options.slug);
    console.log(`  Found: ${product.title} (${product.documentId})`);

    // 2. Upload image
    console.log('\nUploading image...');
    const uploadedImage = await uploadFile(imagePath);
    console.log(`  Uploaded: ID ${uploadedImage.id}`);

    // 3. Update product
    console.log('\nUpdating product...');
    let updateData = {};

    if (options.field === 'frontImage') {
      updateData.frontImage = uploadedImage.id;
    } else if (options.field === 'images') {
      // Append to existing images
      const existingIds = (product.images || []).map((img) => img.id);
      updateData.images = [...existingIds, uploadedImage.id];
    } else if (isColorField) {
      // Update color-specific image
      const colors = product.colors || [];
      const colorIndex = colors.findIndex(
        (c) => c.colorName.toLowerCase() === options.color.toLowerCase()
      );

      if (colorIndex === -1) {
        throw new Error(`Color not found: ${options.color}`);
      }

      if (options.field === 'mainImage') {
        colors[colorIndex].mainImage = uploadedImage.id;
      } else if (options.field === 'additionalImages') {
        const existingIds = (colors[colorIndex].additionalImages || []).map((img) => img.id);
        colors[colorIndex].additionalImages = [...existingIds, uploadedImage.id];
      }

      updateData.colors = colors;
    }

    await updateProduct(product.documentId, updateData);
    console.log(`  Done!`);

    console.log(`\nSuccess: ${options.field} updated for "${product.title}"`);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

main();
