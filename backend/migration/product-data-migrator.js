#!/usr/bin/env node

/**
 * Product Data Migrator
 * Migrates product data from local TypeScript files to Strapi backend
 * 
 * Usage:
 *   node product-data-migrator.js --step=categories
 *   node product-data-migrator.js --step=models  
 *   node product-data-migrator.js --step=products --batch-size=5
 *   node product-data-migrator.js --step=all
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

class ProductDataMigrator {
  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.strapiToken = process.env.STRAPI_API_TOKEN;
    this.batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE) || 5;
    this.sourceDataPath = path.join(__dirname, '../../app/_data');
    this.migrationLog = [];
    
    if (!this.strapiToken) {
      throw new Error('STRAPI_API_TOKEN environment variable is required');
    }
  }

  async initialize() {
    console.log('🚀 Initializing Product Data Migrator...');
    console.log(`📡 Strapi URL: ${this.strapiUrl}`);
    console.log(`📦 Batch Size: ${this.batchSize}`);
    console.log(`📁 Source Path: ${this.sourceDataPath}`);
    
    // Test Strapi connection
    try {
      const response = await this.makeRequest('GET', '/api/products?pagination[pageSize]=1');
      console.log('✅ Strapi connection successful');
    } catch (error) {
      console.error('❌ Failed to connect to Strapi:', error.message);
      throw error;
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${this.strapiUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.strapiToken}`,
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Strapi API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async loadLocalData(filename) {
    console.log(`📖 Loading local data from ${filename}...`);
    
    try {
      // Read the TypeScript file
      const filePath = path.join(this.sourceDataPath, filename);
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      // Extract the exported data using regex (simple approach)
      // In production, you might want to use TypeScript compiler API
      const dataMatch = fileContent.match(new RegExp(`export const \\w+ = (\\[[\\s\\S]*?\\]);`, 'm'));
      
      if (!dataMatch) {
        throw new Error(`Could not extract data from ${filename}`);
      }
      
      // Use eval to parse the JavaScript array (be careful in production!)
      // Alternative: Use a proper TypeScript parser
      const dataString = dataMatch[1]
        .replace(/require\\(['"]([^'"]+)['"]\\)/g, '"$1"') // Replace require() calls with strings
        .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '"$1.$2"'); // Replace enum references
      
      const data = eval(dataString);
      console.log(`✅ Loaded ${data.length} items from ${filename}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Failed to load ${filename}:`, error.message);
      throw error;
    }
  }

  async migrateCategories() {
    console.log('🏷️ Starting category migration...');
    
    try {
      const categories = await this.loadLocalData('categories.ts');
      const migrationResults = [];

      for (const category of categories) {
        try {
          console.log(`📝 Migrating category: ${category.name}`);
          
          const strapiCategory = {
            name: category.name,
            slug: category.id,
            displayOrder: category.displayOrder || 0,
            publishedAt: new Date().toISOString()
          };

          const result = await this.makeRequest('POST', '/api/categories', {
            data: strapiCategory
          });

          migrationResults.push({
            localId: category.id,
            strapiId: result.data.id,
            name: category.name,
            status: 'success'
          });

          console.log(`✅ Category "${category.name}" migrated successfully`);
          
        } catch (error) {
          console.error(`❌ Failed to migrate category "${category.name}":`, error.message);
          migrationResults.push({
            localId: category.id,
            name: category.name,
            status: 'failed',
            error: error.message
          });
        }
      }

      this.logMigrationStep('categories', migrationResults);
      
      const successCount = migrationResults.filter(r => r.status === 'success').length;
      console.log(`✅ Category migration complete: ${successCount}/${categories.length} successful`);
      
      return migrationResults;
      
    } catch (error) {
      console.error('❌ Category migration failed:', error.message);
      throw error;
    }
  }

  async migrateModels() {
    console.log('🏗️ Starting model migration...');
    
    try {
      const models = await this.loadLocalData('models.ts');
      const categories = await this.makeRequest('GET', '/api/categories');
      
      // Create category mapping
      const categoryMap = new Map();
      categories.data.forEach(cat => {
        categoryMap.set(cat.attributes.slug, cat.id);
      });

      const migrationResults = [];

      for (const model of models) {
        try {
          console.log(`🔧 Migrating model: ${model.name}`);
          
          const categoryId = categoryMap.get(model.categoryId);
          if (!categoryId) {
            throw new Error(`Category not found: ${model.categoryId}`);
          }

          const strapiModel = {
            name: model.name,
            slug: model.id,
            category: categoryId,
            publishedAt: new Date().toISOString()
          };

          const result = await this.makeRequest('POST', '/api/product-models', {
            data: strapiModel
          });

          migrationResults.push({
            localId: model.id,
            strapiId: result.data.id,
            name: model.name,
            status: 'success'
          });

          console.log(`✅ Model "${model.name}" migrated successfully`);
          
        } catch (error) {
          console.error(`❌ Failed to migrate model "${model.name}":`, error.message);
          migrationResults.push({
            localId: model.id,
            name: model.name,
            status: 'failed',
            error: error.message
          });
        }
      }

      this.logMigrationStep('models', migrationResults);
      
      const successCount = migrationResults.filter(r => r.status === 'success').length;
      console.log(`✅ Model migration complete: ${successCount}/${models.length} successful`);
      
      return migrationResults;
      
    } catch (error) {
      console.error('❌ Model migration failed:', error.message);
      throw error;
    }
  }

  async migrateProducts() {
    console.log('📦 Starting product migration...');
    
    try {
      const products = await this.loadLocalData('products.ts');
      const categories = await this.makeRequest('GET', '/api/categories');
      const models = await this.makeRequest('GET', '/api/product-models');
      const mediaMapping = await this.loadMediaMapping();
      
      // Create mappings
      const categoryMap = new Map();
      categories.data.forEach(cat => {
        categoryMap.set(cat.attributes.slug, cat.id);
      });

      const modelMap = new Map();
      models.data.forEach(model => {
        modelMap.set(model.attributes.slug, model.id);
      });

      const migrationResults = [];
      
      // Process products in batches
      for (let i = 0; i < products.length; i += this.batchSize) {
        const batch = products.slice(i, i + this.batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(products.length / this.batchSize)}`);
        
        const batchPromises = batch.map(product => this.migrateProduct(product, categoryMap, modelMap, mediaMapping));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const product = batch[index];
          if (result.status === 'fulfilled') {
            migrationResults.push(result.value);
            console.log(`✅ Product "${product.title}" migrated successfully`);
          } else {
            console.error(`❌ Failed to migrate product "${product.title}":`, result.reason.message);
            migrationResults.push({
              localId: product.id,
              title: product.title,
              status: 'failed',
              error: result.reason.message
            });
          }
        });
        
        // Small delay between batches to avoid overwhelming Strapi
        if (i + this.batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.logMigrationStep('products', migrationResults);
      
      const successCount = migrationResults.filter(r => r.status === 'success').length;
      console.log(`✅ Product migration complete: ${successCount}/${products.length} successful`);
      
      return migrationResults;
      
    } catch (error) {
      console.error('❌ Product migration failed:', error.message);
      throw error;
    }
  }

  async migrateProduct(product, categoryMap, modelMap, mediaMapping) {
    const categoryId = categoryMap.get(product.categoryId);
    const modelId = modelMap.get(product.modelId);

    if (!categoryId) {
      throw new Error(`Category not found: ${product.categoryId}`);
    }

    if (!modelId) {
      throw new Error(`Model not found: ${product.modelId}`);
    }

    // Map media references
    const frontImageUrl = this.mapMediaReference(product.frontImage, mediaMapping);
    const imagesUrls = product.images ? product.images.map(img => this.mapMediaReference(img, mediaMapping)) : [];
    
    // Process color variants
    const colors = product.colors.map(color => ({
      colorName: color.colorName,
      quantity: color.quantity,
      hex: color.hex || null,
      mainImage: this.mapMediaReference(color.images.main, mediaMapping),
      additionalImages: color.images.additional ? 
        color.images.additional.map(img => this.mapMediaReference(img, mediaMapping)) : []
    }));

    // Process size variants
    const sizes = product.sizes ? product.sizes.map(size => ({
      value: size.value,
      available: size.available
    })) : [];

    // Process statuses
    const statuses = product.statuses.map(status => status.toString());

    const strapiProduct = {
      title: product.title,
      price: product.price,
      discountedPrice: product.discountedPrice || null,
      shortDescription: product.shortDescription || null,
      longDescription: Array.isArray(product.longDescription) ? 
        product.longDescription.join('\\n') : product.longDescription || null,
      frontImage: frontImageUrl,
      images: imagesUrls,
      videoSource: product.videoSource ? this.mapMediaReference(product.videoSource, mediaMapping) : null,
      warranty: product.warranty || null,
      returnPolicy: product.returnPolicy || null,
      isCustomizable: product.isCustomizable || false,
      dimensions: product.dimensions || null,
      colors: colors,
      sizes: sizes,
      statuses: statuses,
      category: categoryId,
      model: modelId,
      publishedAt: new Date().toISOString()
    };

    const result = await this.makeRequest('POST', '/api/products', {
      data: strapiProduct
    });

    return {
      localId: product.id,
      strapiId: result.data.id,
      title: product.title,
      status: 'success'
    };
  }

  mapMediaReference(localRef, mediaMapping) {
    if (typeof localRef === 'string') {
      return mediaMapping[localRef] || localRef;
    }
    
    // Handle require() statements
    if (localRef && typeof localRef === 'object' && localRef.uri) {
      return mediaMapping[localRef.uri] || localRef.uri;
    }
    
    // If it's already a URL, return as-is
    if (typeof localRef === 'string' && (localRef.startsWith('http') || localRef.startsWith('https'))) {
      return localRef;
    }
    
    console.warn(`Could not map media reference:`, localRef);
    return null;
  }

  async loadMediaMapping() {
    try {
      const mappingPath = path.join(__dirname, 'media-url-mapping.json');
      const mappingContent = await fs.readFile(mappingPath, 'utf8');
      const mapping = JSON.parse(mappingContent);
      
      console.log(`✅ Loaded media mapping with ${Object.keys(mapping.images || {}).length} image mappings`);
      return { ...mapping.images, ...mapping.videos };
      
    } catch (error) {
      console.warn('⚠️ Media mapping file not found, using empty mapping');
      return {};
    }
  }

  logMigrationStep(step, results) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      step,
      timestamp,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    };

    this.migrationLog.push(logEntry);
    
    // Write to log file
    this.saveMigrationLog();
  }

  async saveMigrationLog() {
    try {
      const logPath = path.join(__dirname, `migration-log-${Date.now()}.json`);
      await fs.writeFile(logPath, JSON.stringify(this.migrationLog, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not save migration log:', error.message);
    }
  }

  async generateReport() {
    console.log('\\n📊 Migration Report:');
    console.log('==================');
    
    for (const logEntry of this.migrationLog) {
      console.log(`\\n${logEntry.step.toUpperCase()}:`);
      console.log(`  Total: ${logEntry.summary.total}`);
      console.log(`  Successful: ${logEntry.summary.successful}`);
      console.log(`  Failed: ${logEntry.summary.failed}`);
      
      if (logEntry.summary.failed > 0) {
        console.log('  Failed items:');
        logEntry.results
          .filter(r => r.status === 'failed')
          .forEach(r => {
            console.log(`    - ${r.name || r.title}: ${r.error}`);
          });
      }
    }
    
    const totalSuccess = this.migrationLog.reduce((sum, log) => sum + log.summary.successful, 0);
    const totalItems = this.migrationLog.reduce((sum, log) => sum + log.summary.total, 0);
    
    console.log(`\\n🎯 Overall Success Rate: ${totalSuccess}/${totalItems} (${((totalSuccess/totalItems)*100).toFixed(1)}%)`);
  }

  async run(step = 'all') {
    try {
      await this.initialize();
      
      console.log(`\\n🚀 Starting migration step: ${step}`);
      
      switch (step) {
        case 'categories':
          await this.migrateCategories();
          break;
          
        case 'models':
          await this.migrateModels();
          break;
          
        case 'products':
          await this.migrateProducts();
          break;
          
        case 'all':
          await this.migrateCategories();
          await this.migrateModels();
          await this.migrateProducts();
          break;
          
        default:
          throw new Error(`Unknown migration step: ${step}`);
      }
      
      await this.generateReport();
      console.log('\\n✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('\\n❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const stepArg = args.find(arg => arg.startsWith('--step='));
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  
  const step = stepArg ? stepArg.split('=')[1] : 'all';
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 5;
  
  if (batchSizeArg) {
    process.env.MIGRATION_BATCH_SIZE = batchSize.toString();
  }
  
  const migrator = new ProductDataMigrator();
  migrator.run(step);
}

module.exports = ProductDataMigrator;