#!/usr/bin/env node

/**
 * Upload product images to Render Strapi instance via Upload API
 * Images are stored in Cloudinary (configured in Strapi)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!API_TOKEN) {
  console.error('STRAPI_API_TOKEN environment variable is required');
  console.error('Get it from: Strapi Admin -> Settings -> API Tokens');
  process.exit(1);
}

// Image directory
const IMAGES_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'images', 'products');

// Product to images mapping (first image is frontImage, rest are gallery)
const PRODUCT_IMAGES = {
  'tiffosi-fast': {
    front: 'tiffosi-fast.png',
    gallery: ['sock-color-1.png', 'sock-color-2.png', 'sock-color-3.png', 'sock-color-4.png', 'sock-color-5.png'],
  },
  'mochila-premium-sport': {
    front: 'mochila-black.png',
    gallery: ['mochila-gold.png', 'product_bag_0.png', 'product_bag_1.png', 'product_bag_2.png'],
  },
  'remera-oversize-cotton': {
    front: 'shirt-os-black-1.png',
    gallery: ['shirt-os-black-2.png', 'shirt-os-black-3.png'],
  },
  'canilleras-pro-protection': {
    front: 'shinguards-1.png',
    gallery: ['shinguards-2.png', 'antideslizantes-1.png', 'antideslizantes-2.png'],
  },
  'gorro-cap-classic': {
    front: 'product_cap_black.png',
    gallery: [],
  },
};

// Get MIME type from file extension
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Upload a single file to Strapi
async function uploadFile(filePath) {
  const { FormData, Blob } = await import('formdata-node');

  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const mimeType = getMimeType(filename);

  const blob = new Blob([fileBuffer], { type: mimeType });

  const formData = new FormData();
  formData.append('files', blob, filename);

  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}): ${text}`);
  }

  const result = await response.json();
  return result[0]; // Returns array, we want first item
}

// Get all products from Strapi
async function getProducts() {
  const response = await fetch(`${STRAPI_URL}/api/products?pagination[limit]=100`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get products: ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}

// Update product with images
async function updateProductImages(productId, frontImageId, galleryImageIds) {
  const body = {
    data: {
      frontImage: frontImageId,
    },
  };

  if (galleryImageIds && galleryImageIds.length > 0) {
    body.data.images = galleryImageIds;
  }

  const response = await fetch(`${STRAPI_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update product (${response.status}): ${text}`);
  }

  return response.json();
}

// Main upload function
async function uploadAllImages() {
  console.log('Starting image upload to Render/Cloudinary...');
  console.log(`Target: ${STRAPI_URL}`);
  console.log(`Images directory: ${IMAGES_DIR}\n`);

  // Get existing products
  const products = await getProducts();
  console.log(`Found ${products.length} products in Strapi\n`);

  const productMap = {};
  products.forEach((p) => {
    productMap[p.slug] = p;
  });

  // Track uploaded files to avoid duplicates
  const uploadedFiles = {};

  for (const [slug, imageConfig] of Object.entries(PRODUCT_IMAGES)) {
    const product = productMap[slug];
    if (!product) {
      console.log(`Product not found: ${slug}, skipping...`);
      continue;
    }

    console.log(`\nProcessing: ${product.title} (${slug})`);

    try {
      // Upload front image
      let frontImageId = null;
      const frontPath = path.join(IMAGES_DIR, imageConfig.front);

      if (fs.existsSync(frontPath)) {
        if (uploadedFiles[imageConfig.front]) {
          frontImageId = uploadedFiles[imageConfig.front];
          console.log(`  Front image (cached): ${imageConfig.front}`);
        } else {
          console.log(`  Uploading front image: ${imageConfig.front}`);
          const uploaded = await uploadFile(frontPath);
          frontImageId = uploaded.id;
          uploadedFiles[imageConfig.front] = frontImageId;
          console.log(`  Uploaded: ${uploaded.url}`);
        }
      } else {
        console.log(`  Front image not found: ${frontPath}`);
        continue; // frontImage is required
      }

      // Upload gallery images
      const galleryIds = [];
      for (const galleryFile of imageConfig.gallery) {
        const galleryPath = path.join(IMAGES_DIR, galleryFile);

        if (fs.existsSync(galleryPath)) {
          if (uploadedFiles[galleryFile]) {
            galleryIds.push(uploadedFiles[galleryFile]);
            console.log(`  Gallery image (cached): ${galleryFile}`);
          } else {
            console.log(`  Uploading gallery image: ${galleryFile}`);
            const uploaded = await uploadFile(galleryPath);
            galleryIds.push(uploaded.id);
            uploadedFiles[galleryFile] = uploaded.id;
            console.log(`  Uploaded: ${uploaded.url}`);
          }
        } else {
          console.log(`  Gallery image not found: ${galleryPath}`);
        }
      }

      // Link images to product
      console.log(`  Linking images to product...`);
      await updateProductImages(product.documentId || product.id, frontImageId, galleryIds);
      console.log(`  Done: ${product.title}`);
    } catch (error) {
      console.error(`  Error processing ${slug}:`, error.message);
    }
  }

  console.log('\n\nImage upload completed!');
}

// Run if called directly
if (require.main === module) {
  uploadAllImages().catch(console.error);
}

module.exports = { uploadAllImages };
