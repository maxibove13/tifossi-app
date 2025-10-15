#!/usr/bin/env node

/**
 * Media Asset Uploader
 * Uploads product images and videos from local assets to Strapi Media Library
 *
 * Usage:
 *   node media-asset-uploader.js --phase=images
 *   node media-asset-uploader.js --phase=videos
 *   node media-asset-uploader.js --phase=all --batch-size=5 --parallel=2
 *   node media-asset-uploader.js --phase=mapping
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

class MediaAssetUploader {
  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.strapiToken = process.env.STRAPI_API_TOKEN;
    this.batchSize = parseInt(process.env.BATCH_SIZE) || 5;
    this.parallelUploads = parseInt(process.env.PARALLEL_UPLOADS) || 2;
    this.assetsPath = path.join(__dirname, '../../assets');
    this.uploadResults = [];
    this.urlMapping = { images: {}, videos: {} };

    if (!this.strapiToken) {
      throw new Error('STRAPI_API_TOKEN environment variable is required');
    }
  }

  async initialize() {
    console.log('🚀 Initializing Media Asset Uploader...');
    console.log(`📡 Strapi URL: ${this.strapiUrl}`);
    console.log(`📦 Batch Size: ${this.batchSize}`);
    console.log(`⚡ Parallel Uploads: ${this.parallelUploads}`);
    console.log(`📁 Assets Path: ${this.assetsPath}`);

    // Test Strapi connection
    try {
      const response = await axios.get(
        `${this.strapiUrl}/api/upload/files?pagination[pageSize]=1`,
        {
          headers: { Authorization: `Bearer ${this.strapiToken}` },
        }
      );
      console.log('✅ Strapi Media Library connection successful');
    } catch (error) {
      console.error('❌ Failed to connect to Strapi Media Library:', error.message);
      throw error;
    }

    // Ensure output directories exist
    await this.ensureDirectories();
  }

  async ensureDirectories() {
    const dirs = [
      path.join(__dirname, 'processed'),
      path.join(__dirname, 'uploads'),
      path.join(__dirname, 'validation'),
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async uploadImageAssets() {
    console.log('🖼️ Starting image asset upload...');

    const imagesDir = path.join(this.assetsPath, 'images/products');
    const imageFiles = await this.getImageFiles(imagesDir);

    console.log(`📊 Found ${imageFiles.length} image files to upload`);

    const uploadResults = [];

    // Process images in batches
    for (let i = 0; i < imageFiles.length; i += this.batchSize) {
      const batch = imageFiles.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(imageFiles.length / this.batchSize);

      console.log(
        `\\n📦 Processing image batch ${batchNumber}/${totalBatches} (${batch.length} files)`
      );

      const batchPromises = batch.map(async (file, index) => {
        const delay = index * (1000 / this.parallelUploads); // Stagger uploads
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processAndUploadImage(file, i + index + 1, imageFiles.length);
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const file = batch[index];
        if (result.status === 'fulfilled') {
          uploadResults.push(result.value);
          this.urlMapping.images[file.originalPath] = result.value.urls;
        } else {
          console.error(`❌ Failed to upload ${file.name}:`, result.reason.message);
          uploadResults.push({
            file: file.name,
            status: 'failed',
            error: result.reason.message,
          });
        }
      });

      // Brief pause between batches
      if (i + this.batchSize < imageFiles.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const successCount = uploadResults.filter((r) => r.status === 'success').length;
    console.log(`\\n✅ Image upload complete: ${successCount}/${imageFiles.length} successful`);

    return uploadResults;
  }

  async getImageFiles(directory) {
    const files = await fs.readdir(directory);
    const imageFiles = files.filter(
      (file) =>
        file.toLowerCase().endsWith('.png') ||
        file.toLowerCase().endsWith('.jpg') ||
        file.toLowerCase().endsWith('.jpeg')
    );

    return imageFiles.map((file) => ({
      name: file,
      path: path.join(directory, file),
      originalPath: `require('../../assets/images/products/${file}')`,
      baseName: path.parse(file).name,
      extension: path.parse(file).ext,
    }));
  }

  async processAndUploadImage(file, current, total) {
    console.log(`[${current}/${total}] 🔄 Processing ${file.name}...`);

    try {
      // Generate optimized versions
      const variants = await this.generateImageVariants(file);

      // Upload all variants to Strapi
      const uploadPromises = variants.map((variant) => this.uploadImageVariant(variant));
      const uploadResults = await Promise.all(uploadPromises);

      // Create URL mapping
      const urls = {};
      uploadResults.forEach((result) => {
        urls[result.variant] = result.url;
      });

      console.log(`✅ [${current}/${total}] ${file.name} uploaded (${variants.length} variants)`);

      return {
        file: file.name,
        status: 'success',
        variants: variants.length,
        urls: urls,
        originalSize: (await fs.stat(file.path)).size,
        uploadedSize: uploadResults.reduce((sum, r) => sum + r.size, 0),
      };
    } catch (error) {
      console.error(`❌ [${current}/${total}] Failed to process ${file.name}:`, error.message);
      throw error;
    }
  }

  async generateImageVariants(file) {
    const variants = [];
    const processedDir = path.join(__dirname, 'processed');

    // Define variant sizes
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150, quality: 80 },
      { name: 'small', width: 300, height: 300, quality: 85 },
      { name: 'medium', width: 600, height: 600, quality: 90 },
      { name: 'large', width: 1200, height: 1200, quality: 95 },
    ];

    // Generate optimized variants
    for (const size of sizes) {
      const outputFileName = `${file.baseName}_${size.name}.webp`;
      const outputPath = path.join(processedDir, outputFileName);

      await sharp(file.path)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: size.quality })
        .toFile(outputPath);

      variants.push({
        name: size.name,
        path: outputPath,
        fileName: outputFileName,
        width: size.width,
        height: size.height,
      });
    }

    // Include original
    variants.push({
      name: 'original',
      path: file.path,
      fileName: file.name,
      width: null,
      height: null,
    });

    return variants;
  }

  async uploadImageVariant(variant) {
    const formData = new FormData();
    const fileStream = await fs.readFile(variant.path);

    formData.append('files', fileStream, {
      filename: variant.fileName,
      contentType: variant.name === 'original' ? 'image/png' : 'image/webp',
    });

    formData.append(
      'fileInfo',
      JSON.stringify({
        name: variant.fileName,
        alternativeText: `Product image - ${variant.name} variant`,
        caption: `Optimized ${variant.name} version`,
      })
    );

    const response = await axios.post(`${this.strapiUrl}/api/upload`, formData, {
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const uploadedFile = response.data[0];
    return {
      variant: variant.name,
      url: uploadedFile.url,
      size: uploadedFile.size,
      strapiId: uploadedFile.id,
    };
  }

  async uploadVideoAssets() {
    console.log('🎥 Starting video asset upload...');

    const videosDir = path.join(this.assetsPath, 'videos');
    const videoFiles = await this.getVideoFiles(videosDir);

    console.log(`📊 Found ${videoFiles.length} video files to upload`);

    const uploadResults = [];

    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      console.log(`\\n[${i + 1}/${videoFiles.length}] 🔄 Processing ${file.name}...`);

      try {
        const result = await this.processAndUploadVideo(file, i + 1, videoFiles.length);
        uploadResults.push(result);
        this.urlMapping.videos[file.originalPath] = result.urls;
      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error.message);
        uploadResults.push({
          file: file.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    const successCount = uploadResults.filter((r) => r.status === 'success').length;
    console.log(`\\n✅ Video upload complete: ${successCount}/${videoFiles.length} successful`);

    return uploadResults;
  }

  async getVideoFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      const videoFiles = files.filter(
        (file) =>
          file.toLowerCase().endsWith('.mov') ||
          file.toLowerCase().endsWith('.mp4') ||
          file.toLowerCase().endsWith('.avi')
      );

      return videoFiles.map((file) => ({
        name: file,
        path: path.join(directory, file),
        originalPath: `require('../../assets/videos/${file}')`,
        baseName: path.parse(file).name,
        extension: path.parse(file).ext,
      }));
    } catch (error) {
      console.warn('⚠️ Videos directory not found or empty');
      return [];
    }
  }

  async processAndUploadVideo(file, current, total) {
    console.log(`[${current}/${total}] 🎬 Processing video ${file.name}...`);

    try {
      // Generate optimized versions
      const variants = await this.generateVideoVariants(file);

      // Upload all variants to Strapi
      const uploadPromises = variants.map((variant) => this.uploadVideoVariant(variant));
      const uploadResults = await Promise.all(uploadPromises);

      // Create URL mapping
      const urls = {};
      uploadResults.forEach((result) => {
        urls[result.variant] = result.url;
      });

      console.log(`✅ [${current}/${total}] ${file.name} uploaded (${variants.length} variants)`);

      return {
        file: file.name,
        status: 'success',
        variants: variants.length,
        urls: urls,
        originalSize: (await fs.stat(file.path)).size,
        uploadedSize: uploadResults.reduce((sum, r) => sum + r.size, 0),
      };
    } catch (error) {
      console.error(`❌ [${current}/${total}] Failed to process ${file.name}:`, error.message);
      throw error;
    }
  }

  async generateVideoVariants(file) {
    const variants = [];
    const processedDir = path.join(__dirname, 'processed');

    // Mobile-optimized version
    const mobileFileName = `${file.baseName}_mobile.mp4`;
    const mobilePath = path.join(processedDir, mobileFileName);

    await new Promise((resolve, reject) => {
      ffmpeg(file.path)
        .output(mobilePath)
        .videoCodec('libx264')
        .size('720x?')
        .videoBitrate('1000k')
        .audioCodec('aac')
        .audioBitrate('128k')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    variants.push({
      name: 'mobile',
      path: mobilePath,
      fileName: mobileFileName,
    });

    // Desktop-optimized version
    const desktopFileName = `${file.baseName}_desktop.mp4`;
    const desktopPath = path.join(processedDir, desktopFileName);

    await new Promise((resolve, reject) => {
      ffmpeg(file.path)
        .output(desktopPath)
        .videoCodec('libx264')
        .size('1080x?')
        .videoBitrate('2000k')
        .audioCodec('aac')
        .audioBitrate('192k')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    variants.push({
      name: 'desktop',
      path: desktopPath,
      fileName: desktopFileName,
    });

    // Include original
    variants.push({
      name: 'original',
      path: file.path,
      fileName: file.name,
    });

    return variants;
  }

  async uploadVideoVariant(variant) {
    const formData = new FormData();
    const fileStream = await fs.readFile(variant.path);

    formData.append('files', fileStream, {
      filename: variant.fileName,
      contentType: variant.name === 'original' ? 'video/quicktime' : 'video/mp4',
    });

    formData.append(
      'fileInfo',
      JSON.stringify({
        name: variant.fileName,
        alternativeText: `Product video - ${variant.name} variant`,
        caption: `Optimized ${variant.name} version`,
      })
    );

    const response = await axios.post(`${this.strapiUrl}/api/upload`, formData, {
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000, // 5 minutes for large videos
    });

    const uploadedFile = response.data[0];
    return {
      variant: variant.name,
      url: uploadedFile.url,
      size: uploadedFile.size,
      strapiId: uploadedFile.id,
    };
  }

  async generateUrlMapping() {
    console.log('🗺️ Generating URL mapping file...');

    const mappingPath = path.join(__dirname, 'media-url-mapping.json');

    const mapping = {
      generated: new Date().toISOString(),
      totalImages: Object.keys(this.urlMapping.images).length,
      totalVideos: Object.keys(this.urlMapping.videos).length,
      images: this.urlMapping.images,
      videos: this.urlMapping.videos,
    };

    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));

    console.log(`✅ URL mapping saved to ${mappingPath}`);
    console.log(`📊 Mapped ${mapping.totalImages} images and ${mapping.totalVideos} videos`);

    return mapping;
  }

  async validateUploads() {
    console.log('✅ Validating uploaded assets...');

    const validationResults = {
      images: { total: 0, accessible: 0, failed: [] },
      videos: { total: 0, accessible: 0, failed: [] },
    };

    // Validate image URLs
    for (const [originalPath, urls] of Object.entries(this.urlMapping.images)) {
      validationResults.images.total++;

      try {
        // Test original URL accessibility
        const response = await axios.head(urls.original, { timeout: 10000 });
        if (response.status === 200) {
          validationResults.images.accessible++;
        } else {
          validationResults.images.failed.push({
            path: originalPath,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        validationResults.images.failed.push({ path: originalPath, error: error.message });
      }
    }

    // Validate video URLs
    for (const [originalPath, urls] of Object.entries(this.urlMapping.videos)) {
      validationResults.videos.total++;

      try {
        // Test original URL accessibility
        const response = await axios.head(urls.original, { timeout: 10000 });
        if (response.status === 200) {
          validationResults.videos.accessible++;
        } else {
          validationResults.videos.failed.push({
            path: originalPath,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        validationResults.videos.failed.push({ path: originalPath, error: error.message });
      }
    }

    console.log(`\\n📊 Validation Results:`);
    console.log(
      `Images: ${validationResults.images.accessible}/${validationResults.images.total} accessible`
    );
    console.log(
      `Videos: ${validationResults.videos.accessible}/${validationResults.videos.total} accessible`
    );

    if (validationResults.images.failed.length > 0 || validationResults.videos.failed.length > 0) {
      console.log(`\\n❌ Failed validations:`);
      [...validationResults.images.failed, ...validationResults.videos.failed].forEach(
        (failure) => {
          console.log(`  - ${failure.path}: ${failure.error}`);
        }
      );
    }

    return validationResults;
  }

  async generateReport() {
    console.log('\\n📊 Media Upload Report:');
    console.log('========================');

    const imageCount = Object.keys(this.urlMapping.images).length;
    const videoCount = Object.keys(this.urlMapping.videos).length;

    console.log(`Images uploaded: ${imageCount}`);
    console.log(`Videos uploaded: ${videoCount}`);
    console.log(`Total media files: ${imageCount + videoCount}`);

    // Calculate size statistics
    let totalOriginalSize = 0;
    let totalUploadedSize = 0;

    this.uploadResults.forEach((result) => {
      if (result.originalSize) {
        totalOriginalSize += result.originalSize;
      }
      if (result.uploadedSize) {
        totalUploadedSize += result.uploadedSize;
      }
    });

    const sizeDifference = totalOriginalSize - totalUploadedSize;
    const compressionRatio = sizeDifference > 0 ? (sizeDifference / totalOriginalSize) * 100 : 0;

    console.log(`\\nSize Analysis:`);
    console.log(`Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Uploaded size: ${(totalUploadedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `Size reduction: ${(sizeDifference / 1024 / 1024).toFixed(2)} MB (${compressionRatio.toFixed(1)}%)`
    );
  }

  async run(phase = 'all') {
    try {
      await this.initialize();

      console.log(`\\n🚀 Starting media upload phase: ${phase}`);

      switch (phase) {
        case 'images':
          this.uploadResults = await this.uploadImageAssets();
          break;

        case 'videos':
          this.uploadResults = await this.uploadVideoAssets();
          break;

        case 'all':
          const imageResults = await this.uploadImageAssets();
          const videoResults = await this.uploadVideoAssets();
          this.uploadResults = [...imageResults, ...videoResults];
          break;

        case 'mapping':
          await this.generateUrlMapping();
          return;

        case 'validate':
          // Load existing mapping and validate
          const existingMapping = require('./media-url-mapping.json');
          this.urlMapping = existingMapping;
          await this.validateUploads();
          return;

        default:
          throw new Error(`Unknown phase: ${phase}`);
      }

      await this.generateUrlMapping();
      await this.validateUploads();
      await this.generateReport();

      console.log('\\n✅ Media upload completed successfully!');
    } catch (error) {
      console.error('\\n❌ Media upload failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const phaseArg = args.find((arg) => arg.startsWith('--phase='));
  const batchSizeArg = args.find((arg) => arg.startsWith('--batch-size='));
  const parallelArg = args.find((arg) => arg.startsWith('--parallel='));

  const phase = phaseArg ? phaseArg.split('=')[1] : 'all';
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 5;
  const parallel = parallelArg ? parseInt(parallelArg.split('=')[1]) : 2;

  if (batchSizeArg) {
    process.env.BATCH_SIZE = batchSize.toString();
  }

  if (parallelArg) {
    process.env.PARALLEL_UPLOADS = parallel.toString();
  }

  const uploader = new MediaAssetUploader();
  uploader.run(phase);
}

module.exports = MediaAssetUploader;
