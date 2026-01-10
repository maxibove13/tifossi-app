#!/usr/bin/env node

/**
 * Temporary script to upload videos for Tiffosi Explore products
 * Only uploads videos and updates videoSource field - doesn't touch other data
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'https://tifossi-strapi-backend.onrender.com';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
const VIDEOS_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'videos');

if (!API_TOKEN) {
  console.error('STRAPI_API_TOKEN required');
  process.exit(1);
}

const PRODUCTS_WITH_VIDEOS = [
  { slug: 'mochila-gold', video: 'mochila-gold.mov' },
  { slug: 'mochila-black', video: 'mochila-black.mov' },
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

async function uploadVideo(filePath) {
  const url = `${STRAPI_URL}/api/upload`;
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'video/quicktime' });

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
  const response = await strapiRequest(`/products?filters[slug][$eq]=${slug}`);
  return response.data?.[0] || null;
}

async function main() {
  console.log('Uploading videos for Tiffosi Explore products...\n');

  for (const { slug, video } of PRODUCTS_WITH_VIDEOS) {
    console.log(`Processing: ${slug}`);

    const videoPath = path.join(VIDEOS_DIR, video);
    if (!fs.existsSync(videoPath)) {
      console.log(`  Video not found: ${videoPath}`);
      continue;
    }

    try {
      // Get the product
      const product = await getProduct(slug);
      if (!product) {
        console.log(`  Product not found in Strapi: ${slug}`);
        continue;
      }

      // Upload video
      console.log(`  Uploading: ${video}`);
      const uploadedVideo = await uploadVideo(videoPath);
      console.log(`  Uploaded video ID: ${uploadedVideo.id}`);

      // Update product with videoSource
      await strapiRequest(`/products/${product.documentId}`, 'PUT', {
        videoSource: uploadedVideo.id,
      });
      console.log(`  Updated product with videoSource\n`);

      // Small delay between uploads
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
    }
  }

  console.log('Done!');
}

main();
