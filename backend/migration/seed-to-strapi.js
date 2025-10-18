#!/usr/bin/env node

/**
 * Seed to Strapi Migration Script
 * Uploads seed data from JSON files to production Strapi
 *
 * Usage:
 *   node seed-to-strapi.js --step=all
 *   node seed-to-strapi.js --step=categories
 *   node seed-to-strapi.js --step=statuses
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class SeedToStrapiMigrator {
  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.strapiToken = process.env.STRAPI_API_TOKEN;
    this.seedPath = path.join(__dirname, '../strapi/seed');
    this.mediaMapping = null;

    if (!this.strapiToken) {
      throw new Error('STRAPI_API_TOKEN environment variable is required');
    }
  }

  async initialize() {
    console.log('🚀 Initializing Seed Migrator...');
    console.log(`📡 Strapi URL: ${this.strapiUrl}`);
    console.log(`📁 Seed Path: ${this.seedPath}`);

    // Test connection
    try {
      await this.makeRequest('GET', '/api/upload/files?pagination[pageSize]=1');
      console.log('✅ Strapi connection successful');
    } catch (error) {
      console.error('❌ Failed to connect to Strapi:', error.message);
      throw error;
    }

    // Load media mapping
    await this.loadMediaMapping();
  }

  async makeRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.strapiUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
        'Content-Type': 'application/json',
      },
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

  async loadMediaMapping() {
    try {
      const mappingPath = path.join(__dirname, 'media-url-mapping.json');
      const content = await fs.readFile(mappingPath, 'utf8');
      const mapping = JSON.parse(content);
      this.mediaMapping = mapping.images || {};
      console.log(`✅ Loaded ${Object.keys(this.mediaMapping).length} media mappings`);
    } catch (error) {
      console.warn('⚠️  No media mapping file found');
      this.mediaMapping = {};
    }
  }

  async loadSeedFile(filename) {
    const filePath = path.join(this.seedPath, filename);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  async seedProductStatuses() {
    console.log('\n🏷️  Seeding product statuses...');

    const statuses = await this.loadSeedFile('product-statuses.json');
    let created = 0;
    let skipped = 0;

    for (const status of statuses) {
      try {
        // Check if already exists
        const existing = await this.makeRequest(
          'GET',
          `/api/product-statuses?filters[name][$eq]=${status.name}`
        );

        if (existing.data && existing.data.length > 0) {
          console.log(`   ⏭️   Skipping ${status.name} (already exists)`);
          skipped++;
          continue;
        }

        const strapiStatus = {
          name: status.name,
          priority: status.priority,
          labelEs: status.labelEs,
          labelEn: status.labelEn,
          color: status.color,
          backgroundColor: status.backgroundColor,
          isActive: status.isActive,
          publishedAt: new Date().toISOString(),
        };

        await this.makeRequest('POST', '/api/product-statuses', { data: strapiStatus });
        console.log(`   ✅ Created status: ${status.labelEs}`);
        created++;

        // Delay to avoid overwhelming server
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Failed to create status ${status.name}:`, error.message);
      }
    }

    console.log(`✅ Product statuses: ${created} created, ${skipped} skipped`);
  }

  async seedCategories() {
    console.log('\n📂 Seeding categories...');

    const categories = await this.loadSeedFile('categories.json');
    let created = 0;
    let skipped = 0;

    for (const category of categories) {
      try {
        // Check if already exists
        const existing = await this.makeRequest(
          'GET',
          `/api/categories?filters[slug][$eq]=${category.slug}`
        );

        if (existing.data && existing.data.length > 0) {
          console.log(`   ⏭️   Skipping ${category.name} (already exists)`);
          skipped++;
          continue;
        }

        const strapiCategory = {
          name: category.name,
          slug: category.slug,
          displayOrder: category.displayOrder,
          description: category.description,
          isActive: category.isActive,
          publishedAt: new Date().toISOString(),
        };

        await this.makeRequest('POST', '/api/categories', { data: strapiCategory });
        console.log(`   ✅ Created category: ${category.name}`);
        created++;

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Failed to create category ${category.name}:`, error.message);
      }
    }

    console.log(`✅ Categories: ${created} created, ${skipped} skipped`);
  }

  async seedProductModels() {
    console.log('\n🏃 Seeding product models...');

    const models = await this.loadSeedFile('product-models.json');
    const categories = await this.makeRequest('GET', '/api/categories');

    // Debug: Log the response structure
    console.log('Categories API response structure:', JSON.stringify(categories, null, 2).substring(0, 500));

    // Create category slug -> ID mapping
    const categoryMap = new Map();
    categories.data.forEach((cat) => {
      // Handle both Strapi v4 and v5 formats
      const slug = cat.attributes ? cat.attributes.slug : cat.slug;
      const id = cat.id || cat.documentId;
      categoryMap.set(slug, id);
    });

    let created = 0;
    let skipped = 0;

    for (const model of models) {
      try {
        // Check if already exists
        const existing = await this.makeRequest(
          'GET',
          `/api/product-models?filters[slug][$eq]=${model.slug}`
        );

        if (existing.data && existing.data.length > 0) {
          console.log(`   ⏭️   Skipping ${model.name} (already exists)`);
          skipped++;
          continue;
        }

        const categoryId = categoryMap.get(model.categorySlug);
        if (!categoryId) {
          console.warn(`   ⚠️  Category not found for ${model.name}: ${model.categorySlug}`);
          continue;
        }

        const strapiModel = {
          name: model.name,
          slug: model.slug,
          description: model.description,
          displayOrder: model.displayOrder,
          isActive: model.isActive,
          category: categoryId,
          publishedAt: new Date().toISOString(),
        };

        await this.makeRequest('POST', '/api/product-models', { data: strapiModel });
        console.log(`   ✅ Created model: ${model.name}`);
        created++;

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Failed to create model ${model.name}:`, error.message);
      }
    }

    console.log(`✅ Product models: ${created} created, ${skipped} skipped`);
  }

  async seedStoreLocations() {
    console.log('\n🏪 Seeding store locations...');

    const stores = await this.loadSeedFile('store-locations.json');
    let created = 0;
    let skipped = 0;

    for (const store of stores) {
      try {
        // Check if already exists
        const existing = await this.makeRequest(
          'GET',
          `/api/store-locations?filters[code][$eq]=${store.code}`
        );

        if (existing.data && existing.data.length > 0) {
          console.log(`   ⏭️   Skipping ${store.name} (already exists)`);
          skipped++;
          continue;
        }

        // Transform address to match shared.address component schema
        const transformedAddress = {
          firstName: store.address.name?.split(' ')[0] || 'Tifossi',
          lastName: store.address.name?.split(' ').slice(1).join(' ') || 'Store',
          company: store.name,
          addressLine1: `${store.address.street} ${store.address.number}`,
          addressLine2: store.address.neighborhood,
          city: store.address.city,
          state: store.address.department,
          postalCode: '',
          country: 'UY',
          phoneNumber: store.address.phoneNumber,
          isDefault: store.address.isDefault || false,
          type: store.address.addressType === 'work' ? 'both' : 'both',
        };

        // Transform operating hours to match store.operating-hours component schema
        const transformedHours = (store.operatingHours || []).map((hour) => ({
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.isOpen ? hour.openTime : undefined,
          closeTime: hour.isOpen ? hour.closeTime : undefined,
          isClosed: !hour.isOpen,
          notes: hour.notes || undefined,
        }));

        const strapiStore = {
          name: store.name,
          slug: store.slug,
          code: store.code,
          description: store.description,
          address: transformedAddress,
          phoneNumber: store.phoneNumber,
          email: store.email,
          operatingHours: transformedHours,
          hasPickupService: store.hasPickupService,
          hasParking: store.hasParking,
          isAccessible: store.isAccessible,
          maxPickupItems: store.maxPickupItems,
          isActive: store.isActive,
          displayOrder: store.displayOrder,
          publishedAt: new Date().toISOString(),
        };

        await this.makeRequest('POST', '/api/store-locations', { data: strapiStore });
        console.log(`   ✅ Created store: ${store.name}`);
        created++;

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Failed to create store ${store.name}:`, error.message);
      }
    }

    console.log(`✅ Store locations: ${created} created, ${skipped} skipped`);
  }

  async run(step = 'all') {
    try {
      await this.initialize();

      console.log(`\n🚀 Starting migration step: ${step}\n`);

      switch (step) {
        case 'statuses':
          await this.seedProductStatuses();
          break;

        case 'categories':
          await this.seedCategories();
          break;

        case 'models':
          await this.seedProductModels();
          break;

        case 'stores':
          await this.seedStoreLocations();
          break;

        case 'all':
          await this.seedProductStatuses();
          await this.seedCategories();
          await this.seedProductModels();
          await this.seedStoreLocations();
          break;

        default:
          throw new Error(`Unknown step: ${step}. Use: all, statuses, categories, models, stores`);
      }

      console.log('\n✅ Migration completed successfully!');
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const stepArg = args.find((arg) => arg.startsWith('--step='));
const step = stepArg ? stepArg.split('=')[1] : 'all';

const migrator = new SeedToStrapiMigrator();
migrator.run(step);
