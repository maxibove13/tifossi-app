#!/usr/bin/env node

/**
 * Data Validator
 * Comprehensive validation suite for the migration process
 *
 * Usage:
 *   node data-validator.js --phase=pre-migration
 *   node data-validator.js --phase=migration-time
 *   node data-validator.js --phase=post-migration
 *   node data-validator.js --phase=continuous
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class DataValidator {
  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.strapiToken = process.env.STRAPI_API_TOKEN;
    this.sourceDataPath = path.join(__dirname, '../../app/_data');
    this.validationResults = {
      phase: null,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalErrors: 0,
        warnings: 0,
      },
      sections: {},
    };
  }

  async initialize() {
    console.log('🔍 Initializing Data Validator...');
    console.log(`📡 Strapi URL: ${this.strapiUrl}`);
    console.log(`📁 Source Path: ${this.sourceDataPath}`);
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.strapiUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.strapiToken}`,
          ...options.headers,
        },
        timeout: 10000,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async validatePreMigration() {
    console.log('🚦 Running pre-migration validation...');

    const results = {
      sourceData: await this.validateSourceData(),
      assetIntegrity: await this.validateAssetIntegrity(),
      relationships: await this.validateSourceRelationships(),
      strapiSetup: await this.validateStrapiSetup(),
    };

    this.validationResults.sections.preMigration = results;
    return results;
  }

  async validateSourceData() {
    console.log('📊 Validating source data structure...');

    const results = {
      products: { total: 0, valid: 0, errors: [] },
      categories: { total: 0, valid: 0, errors: [] },
      models: { total: 0, valid: 0, errors: [] },
    };

    try {
      // Validate products
      const products = await this.loadLocalData('products.ts');
      results.products.total = products.length;

      for (const product of products) {
        const errors = this.validateProductStructure(product);
        if (errors.length === 0) {
          results.products.valid++;
        } else {
          results.products.errors.push({
            productId: product.id,
            errors,
          });
        }
      }

      // Validate categories
      const categories = await this.loadLocalData('categories.ts');
      results.categories.total = categories.length;
      results.categories.valid = categories.filter(
        (cat) => cat.id && cat.name && typeof cat.displayOrder === 'number'
      ).length;

      // Validate models
      const models = await this.loadLocalData('models.ts');
      results.models.total = models.length;
      results.models.valid = models.filter(
        (model) => model.id && model.name && model.categoryId
      ).length;

      this.updateTestStats(
        3,
        results.products.valid === results.products.total &&
          results.categories.valid === results.categories.total &&
          results.models.valid === results.models.total
          ? 3
          : 0
      );
    } catch (error) {
      results.error = error.message;
      this.updateTestStats(1, 0, 1);
    }

    return results;
  }

  validateProductStructure(product) {
    const errors = [];

    // Required fields
    if (!product.id || typeof product.id !== 'string') {
      errors.push('Invalid or missing product ID');
    }

    if (!product.title || typeof product.title !== 'string') {
      errors.push('Invalid or missing product title');
    }

    if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
      errors.push('Invalid product price');
    }

    if (!product.categoryId || typeof product.categoryId !== 'string') {
      errors.push('Invalid or missing category ID');
    }

    if (!product.modelId || typeof product.modelId !== 'string') {
      errors.push('Invalid or missing model ID');
    }

    if (!product.frontImage) {
      errors.push('Missing front image');
    }

    // Colors validation
    if (!product.colors || !Array.isArray(product.colors) || product.colors.length === 0) {
      errors.push('Product must have at least one color variant');
    } else {
      product.colors.forEach((color, index) => {
        if (!color.colorName || !color.images?.main) {
          errors.push(`Color variant ${index} missing required fields`);
        }
        if (typeof color.quantity !== 'number' || color.quantity < 0) {
          errors.push(`Color variant ${index} has invalid quantity`);
        }
      });
    }

    // Statuses validation
    if (!product.statuses || !Array.isArray(product.statuses) || product.statuses.length === 0) {
      errors.push('Product must have at least one status');
    }

    // Price validation
    if (product.discountedPrice && product.discountedPrice >= product.price) {
      errors.push('Discounted price must be less than regular price');
    }

    // Size validation
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes.forEach((size, index) => {
        if (!size.value || typeof size.available !== 'boolean') {
          errors.push(`Size ${index} has invalid structure`);
        }
      });
    }

    return errors;
  }

  async validateAssetIntegrity() {
    console.log('🖼️ Validating asset integrity...');

    const results = {
      images: { total: 0, accessible: 0, errors: [] },
      videos: { total: 0, accessible: 0, errors: [] },
      totalSize: 0,
    };

    try {
      // Validate images
      const imagesDir = path.join(__dirname, '../../assets/images/products');
      const imageFiles = await fs.readdir(imagesDir);
      const pngFiles = imageFiles.filter((file) => file.endsWith('.png'));

      results.images.total = pngFiles.length;

      for (const imageFile of pngFiles) {
        const imagePath = path.join(imagesDir, imageFile);
        try {
          const stats = await fs.stat(imagePath);
          results.totalSize += stats.size;

          if (stats.size > 0) {
            results.images.accessible++;
          } else {
            results.images.errors.push(`Empty file: ${imageFile}`);
          }
        } catch (error) {
          results.images.errors.push(`Cannot access: ${imageFile} - ${error.message}`);
        }
      }

      // Validate videos
      try {
        const videosDir = path.join(__dirname, '../../assets/videos');
        const videoFiles = await fs.readdir(videosDir);
        const movFiles = videoFiles.filter((file) => file.endsWith('.mov'));

        results.videos.total = movFiles.length;

        for (const videoFile of movFiles) {
          const videoPath = path.join(videosDir, videoFile);
          try {
            const stats = await fs.stat(videoPath);
            results.totalSize += stats.size;

            if (stats.size > 0) {
              results.videos.accessible++;
            } else {
              results.videos.errors.push(`Empty file: ${videoFile}`);
            }
          } catch (error) {
            results.videos.errors.push(`Cannot access: ${videoFile} - ${error.message}`);
          }
        }
      } catch (error) {
        results.videos.errors.push(`Videos directory error: ${error.message}`);
      }

      const allAssetsValid =
        results.images.accessible === results.images.total &&
        results.videos.accessible === results.videos.total &&
        results.images.errors.length === 0 &&
        results.videos.errors.length === 0;

      this.updateTestStats(1, allAssetsValid ? 1 : 0);
    } catch (error) {
      results.error = error.message;
      this.updateTestStats(1, 0, 1);
    }

    return results;
  }

  async validateSourceRelationships() {
    console.log('🔗 Validating source data relationships...');

    const results = {
      categoryReferences: { total: 0, valid: 0, broken: [] },
      modelReferences: { total: 0, valid: 0, broken: [] },
      imageReferences: { total: 0, valid: 0, broken: [] },
    };

    try {
      const products = await this.loadLocalData('products.ts');
      const categories = await this.loadLocalData('categories.ts');
      const models = await this.loadLocalData('models.ts');

      const categoryIds = new Set(categories.map((c) => c.id));
      const modelIds = new Set(models.map((m) => m.id));

      // Validate category references
      results.categoryReferences.total = products.length;
      products.forEach((product) => {
        if (categoryIds.has(product.categoryId)) {
          results.categoryReferences.valid++;
        } else {
          results.categoryReferences.broken.push({
            productId: product.id,
            categoryId: product.categoryId,
          });
        }
      });

      // Validate model references
      results.modelReferences.total = products.length;
      products.forEach((product) => {
        if (modelIds.has(product.modelId)) {
          results.modelReferences.valid++;
        } else {
          results.modelReferences.broken.push({
            productId: product.id,
            modelId: product.modelId,
          });
        }
      });

      // Validate image references
      const imageFiles = await this.getAvailableImages();
      let totalImageRefs = 0;
      let validImageRefs = 0;

      products.forEach((product) => {
        // Front image
        totalImageRefs++;
        if (this.isImageReferenceValid(product.frontImage, imageFiles)) {
          validImageRefs++;
        } else {
          results.imageReferences.broken.push({
            productId: product.id,
            imageRef: product.frontImage,
            type: 'frontImage',
          });
        }

        // Color variant images
        product.colors.forEach((color, colorIndex) => {
          totalImageRefs++;
          if (this.isImageReferenceValid(color.images.main, imageFiles)) {
            validImageRefs++;
          } else {
            results.imageReferences.broken.push({
              productId: product.id,
              colorIndex,
              imageRef: color.images.main,
              type: 'colorMain',
            });
          }

          if (color.images.additional) {
            color.images.additional.forEach((img, imgIndex) => {
              totalImageRefs++;
              if (this.isImageReferenceValid(img, imageFiles)) {
                validImageRefs++;
              } else {
                results.imageReferences.broken.push({
                  productId: product.id,
                  colorIndex,
                  imgIndex,
                  imageRef: img,
                  type: 'colorAdditional',
                });
              }
            });
          }
        });
      });

      results.imageReferences.total = totalImageRefs;
      results.imageReferences.valid = validImageRefs;

      const allRelationshipsValid =
        results.categoryReferences.broken.length === 0 &&
        results.modelReferences.broken.length === 0 &&
        results.imageReferences.broken.length === 0;

      this.updateTestStats(1, allRelationshipsValid ? 1 : 0);
    } catch (error) {
      results.error = error.message;
      this.updateTestStats(1, 0, 1);
    }

    return results;
  }

  async getAvailableImages() {
    const imagesDir = path.join(__dirname, '../../assets/images/products');
    const files = await fs.readdir(imagesDir);
    return files.filter(
      (file) => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
    );
  }

  isImageReferenceValid(imageRef, availableImages) {
    if (typeof imageRef === 'string') {
      // Extract filename from path
      const filename = imageRef.split('/').pop();
      return availableImages.includes(filename);
    }

    // Handle require() statements
    if (typeof imageRef === 'object' && imageRef.uri) {
      const filename = imageRef.uri.split('/').pop();
      return availableImages.includes(filename);
    }

    return false;
  }

  async validateStrapiSetup() {
    console.log('⚙️ Validating Strapi setup...');

    const results = {
      connection: false,
      contentTypes: { expected: 4, found: 0, missing: [] },
      permissions: { upload: false, api: false },
      database: { connected: false, writable: false },
    };

    try {
      // Test basic connection
      await this.makeRequest('/api/products?pagination[pageSize]=1');
      results.connection = true;

      // Check content types
      const expectedContentTypes = ['products', 'categories', 'product-models', 'upload/files'];

      for (const contentType of expectedContentTypes) {
        try {
          await this.makeRequest(`/api/${contentType}?pagination[pageSize]=1`);
          results.contentTypes.found++;
        } catch (error) {
          results.contentTypes.missing.push(contentType);
        }
      }

      // Test upload permissions
      try {
        await this.makeRequest('/api/upload/files?pagination[pageSize]=1');
        results.permissions.upload = true;
      } catch (error) {
        // Upload permission test failed
      }

      // Test API permissions
      results.permissions.api = results.connection;

      // Test database connectivity (implicit through successful API calls)
      results.database.connected = results.connection;

      // Test database writability (we can't safely test writes in validation)
      results.database.writable = results.connection; // Assume writable if connected

      const setupValid =
        results.connection &&
        results.contentTypes.found === results.contentTypes.expected &&
        results.permissions.upload &&
        results.permissions.api;

      this.updateTestStats(1, setupValid ? 1 : 0);
    } catch (error) {
      results.error = error.message;
      this.updateTestStats(1, 0, 1);
    }

    return results;
  }

  async validatePostMigration() {
    console.log('✅ Running post-migration validation...');

    const results = {
      dataCompleteness: await this.validateDataCompleteness(),
      apiEndpoints: await this.validateAPIEndpoints(),
      mediaAccessibility: await this.validateMediaAccessibility(),
      performance: await this.validatePerformance(),
      userWorkflows: await this.validateUserWorkflows(),
    };

    this.validationResults.sections.postMigration = results;
    return results;
  }

  async validateDataCompleteness() {
    console.log('📊 Validating data completeness...');

    const results = {
      products: { expected: 0, actual: 0, missing: [] },
      categories: { expected: 0, actual: 0, missing: [] },
      models: { expected: 0, actual: 0, missing: [] },
      media: { expected: 0, actual: 0, missing: [] },
    };

    try {
      // Load original data for comparison
      const originalProducts = await this.loadLocalData('products.ts');
      const originalCategories = await this.loadLocalData('categories.ts');
      const originalModels = await this.loadLocalData('models.ts');

      results.products.expected = originalProducts.length;
      results.categories.expected = originalCategories.length;
      results.models.expected = originalModels.length;

      // Check migrated data
      const strapiProducts = await this.makeRequest('/api/products');
      const strapiCategories = await this.makeRequest('/api/categories');
      const strapiModels = await this.makeRequest('/api/product-models');
      const strapiMedia = await this.makeRequest('/api/upload/files');

      results.products.actual = strapiProducts.data.length;
      results.categories.actual = strapiCategories.data.length;
      results.models.actual = strapiModels.data.length;
      results.media.actual = strapiMedia.data.length;

      // Find missing products
      const strapiProductIds = new Set(strapiProducts.data.map((p) => p.id));
      results.products.missing = originalProducts
        .filter((p) => !strapiProductIds.has(p.id))
        .map((p) => p.id);

      // Find missing categories
      const strapiCategoryIds = new Set(strapiCategories.data.map((c) => c.attributes.slug));
      results.categories.missing = originalCategories
        .filter((c) => !strapiCategoryIds.has(c.id))
        .map((c) => c.id);

      // Calculate expected media count (rough estimate)
      let expectedMediaCount = 0;
      originalProducts.forEach((product) => {
        expectedMediaCount++; // front image
        expectedMediaCount += product.colors.length; // color main images
        product.colors.forEach((color) => {
          if (color.images.additional) {
            expectedMediaCount += color.images.additional.length;
          }
        });
      });
      results.media.expected = expectedMediaCount;

      const completenessValid =
        results.products.actual >= results.products.expected * 0.95 && // Allow 5% tolerance
        results.categories.actual >= results.categories.expected &&
        results.models.actual >= results.models.expected &&
        results.media.actual >= results.media.expected * 0.9; // Allow 10% tolerance for media

      this.updateTestStats(1, completenessValid ? 1 : 0);
    } catch (error) {
      results.error = error.message;
      this.updateTestStats(1, 0, 1);
    }

    return results;
  }

  async validateAPIEndpoints() {
    console.log('🔌 Validating API endpoints...');

    const endpoints = [
      {
        name: 'Get all products',
        endpoint: '/api/products',
        expectedMin: 20,
      },
      {
        name: 'Get products with population',
        endpoint: '/api/products?populate=*',
        expectedMin: 20,
      },
      {
        name: 'Get product by ID',
        endpoint: '/api/products/1',
        expectedFields: ['id', 'attributes'],
      },
      {
        name: 'Get categories',
        endpoint: '/api/categories',
        expectedMin: 5,
      },
      {
        name: 'Get product models',
        endpoint: '/api/product-models',
        expectedMin: 5,
      },
      {
        name: 'Get media files',
        endpoint: '/api/upload/files',
        expectedMin: 30,
      },
    ];

    const results = [];

    for (const test of endpoints) {
      const result = {
        name: test.name,
        endpoint: test.endpoint,
        status: 'pending',
        duration: 0,
        error: null,
      };

      const startTime = Date.now();

      try {
        const response = await this.makeRequest(test.endpoint);
        result.duration = Date.now() - startTime;

        if (test.expectedMin && response.data && response.data.length >= test.expectedMin) {
          result.status = 'pass';
        } else if (
          test.expectedFields &&
          response.data &&
          test.expectedFields.every((field) => field in response.data)
        ) {
          result.status = 'pass';
        } else if (!test.expectedMin && !test.expectedFields) {
          result.status = 'pass';
        } else {
          result.status = 'fail';
          result.error = 'Response validation failed';
        }
      } catch (error) {
        result.duration = Date.now() - startTime;
        result.status = 'error';
        result.error = error.message;
      }

      results.push(result);
    }

    const passedTests = results.filter((r) => r.status === 'pass').length;
    this.updateTestStats(endpoints.length, passedTests);

    return { tests: results, summary: { total: endpoints.length, passed: passedTests } };
  }

  async validateMediaAccessibility() {
    console.log('🖼️ Validating media accessibility...');

    const results = {
      totalFiles: 0,
      accessibleFiles: 0,
      failedFiles: [],
      averageResponseTime: 0,
    };

    try {
      const mediaFiles = await this.makeRequest('/api/upload/files?pagination[pageSize]=50');
      results.totalFiles = mediaFiles.data.length;

      const responseTimes = [];

      for (const file of mediaFiles.data.slice(0, 10)) {
        // Test first 10 files
        const startTime = Date.now();

        try {
          const response = await axios.head(file.attributes.url, { timeout: 5000 });
          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          if (response.status === 200) {
            results.accessibleFiles++;
          } else {
            results.failedFiles.push({
              name: file.attributes.name,
              url: file.attributes.url,
              error: `HTTP ${response.status}`,
            });
          }
        } catch (error) {
          results.failedFiles.push({
            name: file.attributes.name,
            url: file.attributes.url,
            error: error.message,
          });
        }
      }

      results.averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

      const accessibilityValid = results.accessibleFiles >= Math.min(10, results.totalFiles) * 0.9; // 90% success rate
      this.updateTestStats(1, accessibilityValid ? 1 : 0);
    } catch (error) {
      results.error = error.message;
      this.updateTestStats(1, 0, 1);
    }

    return results;
  }

  async validatePerformance() {
    console.log('⚡ Validating performance...');

    const performanceTests = [
      { name: 'Product list', endpoint: '/api/products?pagination[pageSize]=10', target: 500 },
      { name: 'Product detail', endpoint: '/api/products/1?populate=*', target: 800 },
      { name: 'Category list', endpoint: '/api/categories', target: 300 },
      { name: 'Media list', endpoint: '/api/upload/files?pagination[pageSize]=10', target: 400 },
    ];

    const results = [];

    for (const test of performanceTests) {
      const startTime = Date.now();

      try {
        await this.makeRequest(test.endpoint);
        const duration = Date.now() - startTime;

        results.push({
          name: test.name,
          duration,
          target: test.target,
          passed: duration <= test.target,
          status: duration <= test.target ? 'pass' : 'slow',
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
          name: test.name,
          duration,
          target: test.target,
          passed: false,
          status: 'error',
          error: error.message,
        });
      }
    }

    const passedTests = results.filter((r) => r.passed).length;
    this.updateTestStats(performanceTests.length, passedTests);

    return { tests: results, summary: { total: performanceTests.length, passed: passedTests } };
  }

  async validateUserWorkflows() {
    console.log('👤 Validating user workflows...');

    const workflows = [
      {
        name: 'Browse products workflow',
        steps: [
          () => this.makeRequest('/api/products?pagination[pageSize]=5'),
          () => this.makeRequest('/api/products/1?populate=*'),
        ],
      },
      {
        name: 'Category filtering workflow',
        steps: [
          () => this.makeRequest('/api/categories'),
          () => this.makeRequest('/api/products?filters[category][slug][$eq]=medias'),
        ],
      },
      {
        name: 'Product search workflow',
        steps: [() => this.makeRequest('/api/products?filters[title][$contains]=tiffosi')],
      },
    ];

    const results = [];

    for (const workflow of workflows) {
      const workflowResult = {
        name: workflow.name,
        steps: [],
        success: true,
        error: null,
      };

      try {
        for (let i = 0; i < workflow.steps.length; i++) {
          const stepStart = Date.now();
          await workflow.steps[i]();
          const stepDuration = Date.now() - stepStart;

          workflowResult.steps.push({
            stepNumber: i + 1,
            duration: stepDuration,
            success: true,
          });
        }
      } catch (error) {
        workflowResult.success = false;
        workflowResult.error = error.message;
      }

      results.push(workflowResult);
    }

    const successfulWorkflows = results.filter((r) => r.success).length;
    this.updateTestStats(workflows.length, successfulWorkflows);

    return {
      workflows: results,
      summary: { total: workflows.length, successful: successfulWorkflows },
    };
  }

  async loadLocalData(filename) {
    const filePath = path.join(this.sourceDataPath, filename);
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Simple extraction - in production, use proper TypeScript parser
    const dataMatch = fileContent.match(/export const \\w+ = (\\[[\\s\\S]*?\\]);/m);
    if (!dataMatch) {
      throw new Error(`Could not extract data from ${filename}`);
    }

    // Clean up the data string
    const dataString = dataMatch[1]
      .replace(/require\\(['"]([^'"]+)['"]\\)/g, '"$1"')
      .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '"$1.$2"');

    return eval(dataString);
  }

  updateTestStats(total, passed, critical = 0) {
    this.validationResults.summary.totalTests += total;
    this.validationResults.summary.passedTests += passed;
    this.validationResults.summary.failedTests += total - passed;
    this.validationResults.summary.criticalErrors += critical;
  }

  async generateReport() {
    console.log('\\n📊 Validation Report');
    console.log('====================');

    const summary = this.validationResults.summary;
    const successRate =
      summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0;

    console.log(`Phase: ${this.validationResults.phase}`);
    console.log(`Timestamp: ${this.validationResults.timestamp}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Critical Errors: ${summary.criticalErrors}`);
    console.log(`Success Rate: ${successRate}%`);

    // Detailed section results
    Object.entries(this.validationResults.sections).forEach(([section, results]) => {
      console.log(`\\n${section.toUpperCase()}:`);
      if (results.error) {
        console.log(`  ❌ Error: ${results.error}`);
      } else {
        Object.entries(results).forEach(([key, value]) => {
          if (typeof value === 'object' && value.total !== undefined) {
            console.log(
              `  ${key}: ${value.valid || value.actual}/${value.total || value.expected}`
            );
          }
        });
      }
    });

    // Save report to file
    const reportPath = path.join(
      __dirname,
      `validation-report-${this.validationResults.phase}-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(this.validationResults, null, 2));
    console.log(`\\n📄 Full report saved to: ${reportPath}`);

    return this.validationResults;
  }

  async run(phase) {
    try {
      await this.initialize();

      this.validationResults.phase = phase;
      console.log(`\\n🔍 Starting validation phase: ${phase}`);

      switch (phase) {
        case 'pre-migration':
          await this.validatePreMigration();
          break;

        case 'post-migration':
          await this.validatePostMigration();
          break;

        case 'continuous':
          // Run a subset of validations for continuous monitoring
          await this.validateDataCompleteness();
          await this.validatePerformance();
          break;

        default:
          throw new Error(`Unknown validation phase: ${phase}`);
      }

      const report = await this.generateReport();

      if (report.summary.criticalErrors > 0) {
        console.log('\\n❌ Validation failed with critical errors!');
        process.exit(1);
      } else if (report.summary.failedTests > 0) {
        console.log('\\n⚠️ Validation completed with warnings');
        process.exit(0);
      } else {
        console.log('\\n✅ Validation passed successfully!');
        process.exit(0);
      }
    } catch (error) {
      console.error('\\n❌ Validation failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const phaseArg = args.find((arg) => arg.startsWith('--phase='));

  const phase = phaseArg ? phaseArg.split('=')[1] : 'pre-migration';

  const validator = new DataValidator();
  validator.run(phase);
}

module.exports = DataValidator;
