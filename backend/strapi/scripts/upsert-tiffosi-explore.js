#!/usr/bin/env node

/**
 * Surgical upsert for Tiffosi Explore products
 * - Updates existing products (price, statuses, frontImage)
 * - Creates only new products that don't exist
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
const ASSETS_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'images', 'products');

if (!API_TOKEN) {
  console.error('STRAPI_API_TOKEN required');
  process.exit(1);
}

// Products to upsert (from Figma tiffosi-explore)
const PRODUCTS_TO_UPSERT = [
  {
    slug: 'mochila-gold',
    updates: { price: 1590 },
    image: 'mochila-gold.png',
  },
  {
    slug: 'campera-deportiva',
    updates: { price: 2390 },
    image: 'campera-deportiva-bg.png',
  },
  {
    slug: 'antideslizantes-1',
    updates: { price: 690 },
    statusNames: ['popular', 'app_exclusive'],
    image: 'antideslizantes.png',
  },
  {
    slug: 'mochila-black',
    updates: { price: 1890 },
    statusNames: ['app_exclusive', 'new'],
    image: 'mochila-black.png',
  },
  {
    slug: 'tiffosi-fast',
    updates: {},
    image: 'tiffosi-fast.png',
  },
  {
    slug: 'shirt-os-black',
    updates: { price: 590 },
    statusNames: ['featured', 'popular', 'app_exclusive'],
    image: 'shirt-os-black.png',
  },
  {
    slug: 'socks-v2',
    updates: {},
    image: 'socks-v2.png',
  },
  // NEW products to create
  {
    slug: 'antideslizante-nando',
    isNew: true,
    image: 'antideslizante-nando.png',
    data: {
      title: 'Tiffosi Antideslizante by Nando',
      price: 1190,
      categorySlug: 'medias',
      modelSlug: 'antideslizante',
      statusNames: ['app_exclusive'],
      shortDescription: {
        line1: 'Edicion especial disenada con Nando.',
        line2: 'Maximo agarre y estilo unico.',
      },
      longDescription: 'Tiffosi Antideslizante by Nando es una edicion especial creada en colaboracion con el reconocido jugador.',
      colors: [{ colorName: 'Negro', quantity: 15, hex: '#0C0C0C', isActive: true, displayOrder: 1 }],
      sizes: [
        { value: 'S', available: true, stock: 5, displayOrder: 1 },
        { value: 'M', available: true, stock: 6, displayOrder: 2 },
        { value: 'L', available: true, stock: 4, displayOrder: 3 },
      ],
      totalStock: 15,
      isActive: true,
      isCustomizable: false,
    },
  },
  {
    slug: 'shinguards-nico',
    isNew: true,
    image: 'shinguards-nico.png',
    data: {
      title: 'Performance Shinguards by Nico',
      price: 590,
      categorySlug: 'canilleras',
      modelSlug: 'pro',
      statusNames: ['app_exclusive'],
      shortDescription: {
        line1: 'Canilleras disenadas con Nico.',
        line2: 'Proteccion profesional y ligereza.',
      },
      longDescription: 'Performance Shinguards by Nico es una edicion especial creada junto al talentoso jugador.',
      colors: [{ colorName: 'Negro', quantity: 12, hex: '#0C0C0C', isActive: true, displayOrder: 1 }],
      sizes: [
        { value: 'S', available: true, stock: 4, displayOrder: 1 },
        { value: 'M', available: true, stock: 5, displayOrder: 2 },
        { value: 'L', available: true, stock: 3, displayOrder: 3 },
      ],
      totalStock: 12,
      isActive: true,
      isCustomizable: true,
    },
  },
];

async function strapiRequest(endpoint, method = 'GET', data = null) {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
  };
  if (data) options.body = JSON.stringify({ data });

  const response = await fetch(url, options);
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    console.error(`API Error (${response.status}):`, JSON.stringify(result, null, 2));
    throw new Error(`API request failed: ${response.status}`);
  }
  return result;
}

async function uploadFile(filePath) {
  const url = `${STRAPI_URL}/api/upload`;
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const form = new FormData();
  form.append('files', blob, fileName);

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    body: form,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return result[0];
}

async function getProduct(slug) {
  const response = await strapiRequest(`/products?filters[slug][$eq]=${slug}&populate=statuses`);
  return response.data?.[0] || null;
}

async function getStatusMap() {
  const response = await strapiRequest('/product-statuses?pagination[limit]=100');
  const map = {};
  (response.data || []).forEach((s) => (map[s.name] = s.documentId));
  return map;
}

async function getCategoryMap() {
  const response = await strapiRequest('/categories?pagination[limit]=100');
  const map = {};
  (response.data || []).forEach((c) => (map[c.slug] = c.documentId));
  return map;
}

async function getModelMap() {
  const response = await strapiRequest('/product-models?pagination[limit]=100');
  const map = {};
  (response.data || []).forEach((m) => (map[m.slug] = m.documentId));
  return map;
}

async function main() {
  console.log('Fetching lookups...');
  const [statusMap, categoryMap, modelMap] = await Promise.all([
    getStatusMap(),
    getCategoryMap(),
    getModelMap(),
  ]);

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const product of PRODUCTS_TO_UPSERT) {
    console.log(`\nProcessing: ${product.slug}`);

    try {
      // Upload image
      const imagePath = path.join(ASSETS_DIR, product.image);
      if (!fs.existsSync(imagePath)) {
        console.log(`  Image not found: ${product.image}, skipping image upload`);
        continue;
      }

      console.log(`  Uploading image: ${product.image}`);
      const uploadedImage = await uploadFile(imagePath);
      console.log(`  Uploaded: ID ${uploadedImage.id}`);
      await delay(2000);

      const existing = await getProduct(product.slug);

      if (existing) {
        // UPDATE existing product
        const updateData = {
          ...product.updates,
          frontImage: uploadedImage.id,
        };

        if (product.statusNames) {
          const statusIds = product.statusNames.map((n) => statusMap[n]).filter(Boolean);
          updateData.statuses = { set: statusIds.map((id) => ({ documentId: id })) };
        }

        await strapiRequest(`/products/${existing.documentId}`, 'PUT', updateData);
        console.log(`  Updated: ${existing.title}`);
      } else if (product.isNew && product.data) {
        // CREATE new product
        const { categorySlug, modelSlug, statusNames, ...rest } = product.data;

        const createData = {
          ...rest,
          slug: product.slug,
          frontImage: uploadedImage.id,
          category: categoryMap[categorySlug],
          model: modelMap[modelSlug],
          publishedAt: new Date().toISOString(),
        };

        if (statusNames) {
          const statusIds = statusNames.map((n) => statusMap[n]).filter(Boolean);
          createData.statuses = { connect: statusIds.map((id) => ({ documentId: id })) };
        }

        // Transform sizes for Strapi
        if (createData.sizes) {
          createData.sizes = createData.sizes.map((s) => ({
            name: s.value,
            code: s.value,
            stock: s.stock || 0,
            isActive: s.available !== false,
            displayOrder: s.displayOrder || 0,
          }));
        }

        await strapiRequest('/products', 'POST', createData);
        console.log(`  Created: ${product.data.title}`);
      } else {
        console.log(`  Product not found and no create data: ${product.slug}`);
      }

      await delay(1000);
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('\nDone!');
}

main();
