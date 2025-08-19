#!/usr/bin/env node

/**
 * Database seeding script for Tifossi Strapi Backend
 * This script populates the database with initial data for development and testing
 */

const { execSync } = require('child_process');
const path = require('path');

async function seedDatabase() {
  console.log('🌱 Starting database seeding process...');

  try {
    // Set up environment
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Bootstrap Strapi
    const strapi = require('@strapi/strapi');
    const app = await strapi().load();

    console.log('🗄️ Database connection established');

    // Seed Categories
    await seedCategories(app);
    
    // Seed Product Models
    await seedProductModels(app);
    
    // Seed Product Statuses
    await seedProductStatuses(app);
    
    // Seed Store Locations
    await seedStoreLocations(app);
    
    // Seed Sample Products (optional)
    if (process.env.SEED_SAMPLE_PRODUCTS === 'true') {
      await seedSampleProducts(app);
    }

    console.log('✅ Database seeding completed successfully!');
    
    await app.destroy();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

/**
 * Seed Categories
 */
async function seedCategories(strapi) {
  console.log('📂 Seeding categories...');
  
  const categories = [
    {
      name: 'Camisetas',
      slug: 'camisetas',
      displayOrder: 1,
      description: 'Camisetas deportivas de alta calidad',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Pantalones',
      slug: 'pantalones', 
      displayOrder: 2,
      description: 'Pantalones y shorts deportivos',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Calzado',
      slug: 'calzado',
      displayOrder: 3,
      description: 'Zapatillas y calzado deportivo',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Accesorios',
      slug: 'accesorios',
      displayOrder: 4,
      description: 'Accesorios deportivos y complementos',
      isActive: true,
      publishedAt: new Date(),
    },
  ];

  for (const category of categories) {
    const existing = await strapi.db.query('api::category.category').findOne({
      where: { slug: category.slug },
    });

    if (!existing) {
      await strapi.db.query('api::category.category').create({
        data: category,
      });
      console.log(`   ✓ Created category: ${category.name}`);
    } else {
      console.log(`   → Category already exists: ${category.name}`);
    }
  }
}

/**
 * Seed Product Models
 */
async function seedProductModels(strapi) {
  console.log('🏃 Seeding product models...');
  
  const categories = await strapi.db.query('api::category.category').findMany();
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {});

  const models = [
    {
      name: 'Fast',
      slug: 'fast',
      description: 'Línea fast para deportes de velocidad',
      displayOrder: 1,
      isActive: true,
      category: categoryMap['camisetas'],
      publishedAt: new Date(),
    },
    {
      name: 'Classic',
      slug: 'classic',
      description: 'Línea clásica atemporal',
      displayOrder: 2,
      isActive: true,
      category: categoryMap['camisetas'],
      publishedAt: new Date(),
    },
    {
      name: 'Sport',
      slug: 'sport',
      description: 'Línea deportiva de alto rendimiento',
      displayOrder: 3,
      isActive: true,
      category: categoryMap['pantalones'],
      publishedAt: new Date(),
    },
  ];

  for (const model of models) {
    const existing = await strapi.db.query('api::product-model.product-model').findOne({
      where: { slug: model.slug },
    });

    if (!existing) {
      await strapi.db.query('api::product-model.product-model').create({
        data: model,
      });
      console.log(`   ✓ Created product model: ${model.name}`);
    } else {
      console.log(`   → Product model already exists: ${model.name}`);
    }
  }
}

/**
 * Seed Product Statuses
 */
async function seedProductStatuses(strapi) {
  console.log('🏷️ Seeding product statuses...');
  
  const statuses = [
    {
      name: 'new',
      priority: 1,
      labelEs: 'NUEVO',
      labelEn: 'NEW',
      color: '#FFFFFF',
      backgroundColor: '#FF6B35',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'sale',
      priority: 2,
      labelEs: 'OFERTA',
      labelEn: 'SALE',
      color: '#FFFFFF',
      backgroundColor: '#E74C3C',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'featured',
      priority: 3,
      labelEs: 'DESTACADO',
      labelEn: 'FEATURED',
      color: '#FFFFFF',
      backgroundColor: '#F39C12',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'opportunity',
      priority: 4,
      labelEs: 'OPORTUNIDAD',
      labelEn: 'OPPORTUNITY',
      color: '#FFFFFF',
      backgroundColor: '#9B59B6',
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'recommended',
      priority: 5,
      labelEs: 'RECOMENDADO',
      labelEn: 'RECOMMENDED',
      color: '#FFFFFF',
      backgroundColor: '#2ECC71',
      isActive: true,
      publishedAt: new Date(),
    },
  ];

  for (const status of statuses) {
    const existing = await strapi.db.query('api::product-status.product-status').findOne({
      where: { name: status.name },
    });

    if (!existing) {
      await strapi.db.query('api::product-status.product-status').create({
        data: status,
      });
      console.log(`   ✓ Created product status: ${status.name}`);
    } else {
      console.log(`   → Product status already exists: ${status.name}`);
    }
  }
}

/**
 * Seed Store Locations
 */
async function seedStoreLocations(strapi) {
  console.log('🏪 Seeding store locations...');
  
  const storeLocations = [
    {
      name: 'Tifossi Montevideo Centro',
      slug: 'montevideo-centro',
      code: 'MVD-CENTRO',
      description: 'Tienda principal en el centro de Montevideo',
      address: {
        firstName: 'Tifossi',
        lastName: 'Store',
        addressLine1: '18 de Julio 1234',
        city: 'Montevideo',
        postalCode: '11100',
        country: 'UY',
        phoneNumber: '+598 2XXX XXXX',
      },
      phoneNumber: '+598 2XXX XXXX',
      email: 'centro@tifossi.com',
      hasPickupService: true,
      hasParking: false,
      isAccessible: true,
      maxPickupItems: 50,
      isActive: true,
      displayOrder: 1,
      publishedAt: new Date(),
    },
    {
      name: 'Tifossi Punta del Este',
      slug: 'punta-del-este',
      code: 'PDE-MAIN',
      description: 'Tienda en Punta del Este',
      address: {
        firstName: 'Tifossi',
        lastName: 'Store',
        addressLine1: 'Avenida Gorlero 567',
        city: 'Punta del Este',
        postalCode: '20100',
        country: 'UY',
        phoneNumber: '+598 42XX XXXX',
      },
      phoneNumber: '+598 42XX XXXX',
      email: 'puntadeleste@tifossi.com',
      hasPickupService: true,
      hasParking: true,
      isAccessible: true,
      maxPickupItems: 30,
      isActive: true,
      displayOrder: 2,
      publishedAt: new Date(),
    },
  ];

  for (const store of storeLocations) {
    const existing = await strapi.db.query('api::store-location.store-location').findOne({
      where: { code: store.code },
    });

    if (!existing) {
      await strapi.db.query('api::store-location.store-location').create({
        data: store,
      });
      console.log(`   ✓ Created store location: ${store.name}`);
    } else {
      console.log(`   → Store location already exists: ${store.name}`);
    }
  }
}

/**
 * Seed Sample Products (optional)
 */
async function seedSampleProducts(strapi) {
  console.log('👕 Seeding sample products...');
  
  const categories = await strapi.db.query('api::category.category').findMany();
  const models = await strapi.db.query('api::product-model.product-model').findMany();
  const statuses = await strapi.db.query('api::product-status.product-status').findMany();

  if (categories.length === 0 || models.length === 0) {
    console.log('   → Skipping sample products - categories or models not found');
    return;
  }

  const sampleProducts = [
    {
      title: 'Camiseta Deportiva Fast',
      slug: 'camiseta-deportiva-fast',
      price: 45.99,
      shortDescription: {
        line1: 'Camiseta deportiva de alta calidad',
        line2: 'Perfecta para entrenamientos',
      },
      longDescription: 'Camiseta deportiva de la línea Fast, fabricada con materiales de primera calidad...',
      category: categories.find(c => c.slug === 'camisetas')?.id,
      model: models.find(m => m.slug === 'fast')?.id,
      statuses: statuses.filter(s => ['new', 'featured'].includes(s.name)).map(s => s.id),
      colors: [
        { name: 'Rojo', hexCode: '#FF0000', isActive: true, displayOrder: 1 },
        { name: 'Azul', hexCode: '#0000FF', isActive: true, displayOrder: 2 },
        { name: 'Negro', hexCode: '#000000', isActive: true, displayOrder: 3 },
      ],
      sizes: [
        { name: 'S', stock: 10, isActive: true, displayOrder: 1 },
        { name: 'M', stock: 15, isActive: true, displayOrder: 2 },
        { name: 'L', stock: 12, isActive: true, displayOrder: 3 },
        { name: 'XL', stock: 8, isActive: true, displayOrder: 4 },
      ],
      totalStock: 45,
      isActive: true,
      publishedAt: new Date(),
    },
  ];

  for (const product of sampleProducts) {
    const existing = await strapi.db.query('api::product.product').findOne({
      where: { slug: product.slug },
    });

    if (!existing) {
      await strapi.db.query('api::product.product').create({
        data: product,
      });
      console.log(`   ✓ Created sample product: ${product.title}`);
    } else {
      console.log(`   → Sample product already exists: ${product.title}`);
    }
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };