#!/usr/bin/env node

/**
 * Media Upload Script for Strapi
 *
 * This script uploads all local media files to Strapi's media library
 * and generates a mapping file for the product migration script.
 *
 * Usage:
 *   node upload-media-to-strapi.js --type=images
 *   node upload-media-to-strapi.js --type=videos
 *   node upload-media-to-strapi.js --type=all
 *
 * Environment variables:
 *   STRAPI_URL - Strapi server URL (default: http://localhost:1337)
 *   STRAPI_API_TOKEN - Admin API token for authentication
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { createReadStream } = require('fs');

class MediaUploader {
  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.strapiToken = process.env.STRAPI_API_TOKEN;
    this.assetsPath = path.join(__dirname, '../../assets');
    this.mediaMapping = {};

    if (!this.strapiToken) {
      throw new Error('STRAPI_API_TOKEN environment variable is required');
    }
  }

  async initialize() {
    console.log('🚀 Initializing Media Uploader...');
    console.log(`📡 Strapi URL: ${this.strapiUrl}`);
    console.log(`📁 Assets Path: ${this.assetsPath}`);

    // Test Strapi connection
    try {
      await this.makeRequest('GET', '/api/upload/files?pageSize=1');
      console.log('✅ Strapi connection successful');
    } catch (error) {
      console.error('❌ Failed to connect to Strapi:', error.message);
      throw error;
    }

    // Load existing mapping if it exists
    await this.loadExistingMapping();
  }

  async loadExistingMapping() {
    try {
      const mappingPath = path.join(__dirname, 'media-url-mapping.json');
      const content = await fs.readFile(mappingPath, 'utf8');
      const existing = JSON.parse(content);

      this.mediaMapping = existing;
      console.log(
        `📋 Loaded existing mapping with ${Object.keys(existing.images || {}).length} images and ${Object.keys(existing.videos || {}).length} videos`
      );
    } catch {
      this.mediaMapping = { images: {}, videos: {} };
      console.log('📋 Starting with empty mapping');
    }
  }

  async saveMapping() {
    const mappingPath = path.join(__dirname, 'media-url-mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify(this.mediaMapping, null, 2));
    console.log(`💾 Saved mapping to ${mappingPath}`);
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${this.strapiUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
        ...headers,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Strapi API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      }
      throw error;
    }
  }

  async uploadFile(filePath, folder = 'products') {
    const fileName = path.basename(filePath);
    const fileKey = `/${folder}/${fileName}`;

    // Check if already uploaded
    if (this.mediaMapping.images && this.mediaMapping.images[fileKey]) {
      console.log(`⏭️  Skipping ${fileName} (already uploaded)`);
      return this.mediaMapping.images[fileKey];
    }
    if (this.mediaMapping.videos && this.mediaMapping.videos[fileKey]) {
      console.log(`⏭️  Skipping ${fileName} (already uploaded)`);
      return this.mediaMapping.videos[fileKey];
    }

    console.log(`📤 Uploading ${fileName}...`);

    try {
      const form = new FormData();
      form.append('files', createReadStream(filePath), fileName);
      form.append('folder', folder);

      const response = await this.makeRequest('POST', '/api/upload', form, form.getHeaders());

      if (response && response[0]) {
        const uploadedFile = response[0];
        const mediaId = uploadedFile.id;
        const mediaUrl = uploadedFile.url;

        console.log(`✅ Uploaded ${fileName} -> ID: ${mediaId}, URL: ${mediaUrl}`);

        return {
          id: mediaId,
          url: mediaUrl,
          name: uploadedFile.name,
          hash: uploadedFile.hash,
          ext: uploadedFile.ext,
        };
      }

      throw new Error('Upload response was empty');
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
      throw error;
    }
  }

  async uploadImages() {
    console.log('\n📸 Starting image upload...');

    const imagePath = path.join(this.assetsPath, 'images/products');

    try {
      const files = await fs.readdir(imagePath);
      const imageFiles = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

      console.log(`Found ${imageFiles.length} image files to process`);

      for (const file of imageFiles) {
        const fullPath = path.join(imagePath, file);
        const result = await this.uploadFile(fullPath, 'products');

        // Store mapping using the path format used in products.ts
        const pathKey = `/products/${file}`;
        if (!this.mediaMapping.images) {
          this.mediaMapping.images = {};
        }
        this.mediaMapping.images[pathKey] = result;

        // Save mapping after each upload for safety
        await this.saveMapping();

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(`✅ Uploaded ${imageFiles.length} images successfully`);
    } catch (error) {
      console.error('❌ Image upload failed:', error.message);
      throw error;
    }
  }

  async uploadVideos() {
    console.log('\n🎥 Starting video upload...');

    const videoPath = path.join(this.assetsPath, 'videos');

    try {
      const files = await fs.readdir(videoPath);
      const videoFiles = files.filter((f) => /\.(mov|mp4|webm)$/i.test(f));

      console.log(`Found ${videoFiles.length} video files to process`);

      for (const file of videoFiles) {
        const fullPath = path.join(videoPath, file);

        // Convert .mov to .mp4 in the key for consistency
        const keyName = file.replace('.mov', '.mp4');
        const result = await this.uploadFile(fullPath, 'videos');

        // Store mapping using the path format
        const pathKey = `/videos/${keyName}`;
        const uploadPathKey = `/uploads/${keyName.replace('-', '_')}`;

        if (!this.mediaMapping.videos) {
          this.mediaMapping.videos = {};
        }

        // Store both path formats for flexibility
        this.mediaMapping.videos[pathKey] = result;
        this.mediaMapping.videos[uploadPathKey] = result;

        // Save mapping after each upload
        await this.saveMapping();

        // Longer delay for videos as they're larger
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`✅ Uploaded ${videoFiles.length} videos successfully`);
    } catch (error) {
      console.error('❌ Video upload failed:', error.message);
      throw error;
    }
  }

  async generateReport() {
    console.log('\n📊 Upload Report:');
    console.log('================');

    const imageCount = Object.keys(this.mediaMapping.images || {}).length;
    const videoCount = Object.keys(this.mediaMapping.videos || {}).length;

    console.log(`📸 Images uploaded: ${imageCount}`);
    console.log(`🎥 Videos uploaded: ${videoCount}`);
    console.log(`📦 Total media files: ${imageCount + videoCount}`);

    // Sample of mapping for verification
    console.log('\n📋 Sample Mappings:');

    const sampleImages = Object.entries(this.mediaMapping.images || {}).slice(0, 3);
    sampleImages.forEach(([key, value]) => {
      console.log(`  Image: ${key} -> ${value.url}`);
    });

    const sampleVideos = Object.entries(this.mediaMapping.videos || {}).slice(0, 3);
    sampleVideos.forEach(([key, value]) => {
      console.log(`  Video: ${key} -> ${value.url}`);
    });
  }

  async run(type = 'all') {
    await this.initialize();

    try {
      switch (type) {
        case 'images':
          await this.uploadImages();
          break;
        case 'videos':
          await this.uploadVideos();
          break;
        case 'all':
          await this.uploadImages();
          await this.uploadVideos();
          break;
        default:
          throw new Error(`Unknown upload type: ${type}. Use 'images', 'videos', or 'all'`);
      }

      await this.generateReport();
      console.log('\n✅ Media upload completed successfully!');
      console.log(`📁 Mapping file saved at: ${path.join(__dirname, 'media-url-mapping.json')}`);
    } catch (error) {
      console.error('\n❌ Media upload failed:', error.message);
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const typeArg = args.find((arg) => arg.startsWith('--type='));
const uploadType = typeArg ? typeArg.split('=')[1] : 'all';

// Run the uploader
const uploader = new MediaUploader();
uploader.run(uploadType).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
