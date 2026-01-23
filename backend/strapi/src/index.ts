export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi: _strapi }: { strapi: any }) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Bootstrap logic for Tifossi e-commerce

    strapi.log.info('Tifossi Strapi Backend is starting up...');

    const proxyEnabled = strapi.config.get('server.proxy', false);
    if (proxyEnabled && strapi.server?.app && strapi.server.app.proxy !== true) {
      strapi.server.app.proxy = true;
    }
    const koaProxy = strapi.server?.app?.proxy ?? false;
    strapi.log.info(
      `Reverse proxy trusted: config=${proxyEnabled} koa=${koaProxy} (IS_PROXIED=${process.env.IS_PROXIED ?? 'undefined'})`
    );
    strapi.log.info(`Resolved PUBLIC_URL: ${strapi.config.get('server.url')}`);

    // Initialize default data if needed
    await initializeDefaultData(strapi);

    // Initialize public permissions for API access
    await initializePublicPermissions(strapi);

    // Set up cron jobs
    setupCronJobs(strapi);

    // Initialize external services
    await initializeExternalServices(strapi);

    strapi.log.info('Tifossi Strapi Backend bootstrap completed');
  },
};

/**
 * Initialize default data for the application
 */
async function initializeDefaultData(strapi: any) {
  try {
    // Check if we need to create default admin user
    const adminUsers = await strapi.db.query('admin::user').findMany();

    if (adminUsers.length === 0) {
      strapi.log.info('Creating default admin user...');
      // Default admin creation logic would go here
      // This is typically done through Strapi CLI or admin panel
    }

    // Initialize default product statuses if they don't exist
    const productStatuses = await strapi.db.query('api::product-status.product-status').findMany();

    if (productStatuses.length === 0) {
      strapi.log.info('Creating default product statuses...');

      const defaultStatuses = [
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
      ];

      for (const status of defaultStatuses) {
        await strapi.db.query('api::product-status.product-status').create({
          data: status,
        });
      }

      strapi.log.info('Default product statuses created');
    }

    // Ensure app settings single type exists to avoid 404 on /app-settings
    const appSettings = await strapi.db
      .query('api::app-setting.app-setting')
      .findMany({ limit: 1 });

    if (appSettings.length === 0) {
      await strapi.db.query('api::app-setting.app-setting').create({
        data: {
          supportPhoneNumber: '+59899000000',
          businessName: 'Tifossi',
        },
      });
      strapi.log.info('Default app settings created');
    }
  } catch (error) {
    strapi.log.error('Error initializing default data:', error);
  }
}

/**
 * Initialize public permissions for API endpoints
 * This ensures mobile app can access product data without authentication
 */
async function initializePublicPermissions(strapi: any) {
  try {
    strapi.log.info('Initializing public API permissions...');

    // Get the Public role
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      strapi.log.error('Public role not found!');
      return;
    }

    // Define required permissions for mobile app
    const requiredPermissions = [
      // Products - read access
      'api::product.product.find',
      'api::product.product.findOne',

      // Categories - read access
      'api::category.category.find',
      'api::category.category.findOne',

      // Product Models - read access
      'api::product-model.product-model.find',
      'api::product-model.product-model.findOne',

      // Product Statuses - read access
      'api::product-status.product-status.find',
      'api::product-status.product-status.findOne',

      // Store Locations - read access
      'api::store-location.store-location.find',
      'api::store-location.store-location.findOne',

      // Upload (media files) - read access
      'plugin::upload.content-api.find',
    ];

    let createdCount = 0;
    let existingCount = 0;
    let activatedCount = 0;

    for (const action of requiredPermissions) {
      // Check if permission already exists
      const existingPermission = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            action,
            role: publicRole.id,
          },
        });

      if (!existingPermission) {
        // Create the permission
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action,
            role: publicRole.id,
            enabled: true,
          },
        });
        createdCount++;
        strapi.log.debug(`✅ Created permission: ${action}`);
      } else if (!existingPermission.enabled) {
        await strapi.db.query('plugin::users-permissions.permission').update({
          where: { id: existingPermission.id },
          data: { enabled: true },
        });
        activatedCount++;
        strapi.log.debug(`✅ Enabled permission: ${action}`);
      } else {
        existingCount++;
      }
    }

    if (createdCount > 0) {
      strapi.log.info(`✅ Created ${createdCount} new public permissions`);
    }
    if (activatedCount > 0) {
      strapi.log.info(`✅ Enabled ${activatedCount} existing permissions`);
    }
    if (existingCount > 0) {
      strapi.log.info(`ℹ️  ${existingCount} permissions already active`);
    }

    strapi.log.info('Public API permissions initialized successfully');
  } catch (error) {
    strapi.log.error('Error initializing public permissions:', error);
    // Don't throw - allow app to start even if this fails
    // Permissions can be set manually via admin panel if needed
  }
}

/**
 * Set up cron jobs for the application
 */
function setupCronJobs(strapi: any) {
  try {
    // Process webhook queue every 30 seconds
    strapi.cron.add({
      processWebhookQueue: {
        task: async ({ strapi }: { strapi: any }) => {
          try {
            strapi.log.debug('Processing webhook queue...');
            const { WebhookProcessor } = require('./lib/payment/webhook-processor');
            const processor = new WebhookProcessor();
            await processor.processQueue();
          } catch (error) {
            strapi.log.error('Error in webhook queue processor:', error);
          }
        },
        options: {
          rule: '*/10 * * * * *', // Every 10 seconds for faster payment confirmation
        },
      },
    });

    // Clean up old webhook logs and queued items (90 days retention)
    strapi.cron.add({
      cleanupWebhooks: {
        task: async ({ strapi }: { strapi: any }) => {
          try {
            strapi.log.info('Cleaning up old webhook logs and completed queue items...');

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            // Clean up old webhook logs
            await strapi.db.query('api::webhook-log.webhook-log').deleteMany({
              where: {
                processedAt: {
                  $lt: ninetyDaysAgo.toISOString(),
                },
              },
            });

            // Clean up completed/failed webhook queue items older than 90 days
            await strapi.db.query('api::webhook-queue.webhook-queue').deleteMany({
              where: {
                processedAt: {
                  $lt: ninetyDaysAgo.toISOString(),
                },
                status: {
                  $in: ['completed', 'failed'],
                },
              },
            });

            strapi.log.info('Webhook cleanup completed');
          } catch (error) {
            strapi.log.error('Error cleaning up webhooks:', error);
          }
        },
        options: {
          rule: '0 2 * * *', // Daily at 2 AM
        },
      },
    });

    // Example: Update product analytics weekly
    strapi.cron.add({
      updateAnalytics: {
        task: ({ strapi }: { strapi: any }) => {
          strapi.log.info('Updating product analytics...');
          // Analytics update logic here
        },
        options: {
          rule: '0 0 * * 0', // Weekly on Sunday at midnight
        },
      },
    });

    strapi.log.info('Cron jobs initialized');
  } catch (error) {
    strapi.log.error('Error setting up cron jobs:', error);
  }
}

/**
 * Initialize external services
 */
async function initializeExternalServices(strapi: any) {
  try {
    // Initialize MercadoPago service (always enabled)
    strapi.log.info('Validating MercadoPago configuration...');

    try {
      // This will throw if credentials are missing
      const MercadoPagoService = require('./lib/payment/mercadopago-service').MercadoPagoService;
      const mpService = new MercadoPagoService();

      const status = mpService.getServiceStatus();
      strapi.log.info('✅ MercadoPago service initialized successfully', {
        mode: status.isProduction ? 'PRODUCTION' : 'TEST',
        accessTokenSet: status.accessTokenSet,
        publicKeySet: status.publicKeySet,
        webhookSecretSet: status.webhookSecretSet,
      });

      // Store service instance for reuse
      strapi.mercadoPago = mpService;
    } catch (error: any) {
      strapi.log.error('❌ MercadoPago configuration is invalid:', error.message);
      strapi.log.error('Please check your environment variables:');
      strapi.log.error(
        '- MP_MODE: "production" for real payments, omit or set to "test" for sandbox'
      );
      strapi.log.error('- MP_TEST_ACCESS_TOKEN (used when MP_MODE != production)');
      strapi.log.error('- MP_TEST_PUBLIC_KEY (used when MP_MODE != production)');
      strapi.log.error('- MP_ACCESS_TOKEN (used when MP_MODE = production)');
      strapi.log.error('- MP_PUBLIC_KEY (used when MP_MODE = production)');
      strapi.log.error('- MP_WEBHOOK_SECRET (required for both modes)');

      // Fail startup to prevent running with broken configuration
      throw new Error('MercadoPago configuration validation failed. Cannot start application.');
    }

    // Initialize email service if enabled
    if (process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true') {
      strapi.log.info('Initializing email service...');
      // Email service initialization
    }

    // Test database connection
    await strapi.db.connection.raw('SELECT 1');
    strapi.log.info('Database connection established');

    strapi.log.info('External services initialized');
  } catch (error) {
    strapi.log.error('Error initializing external services:', error);
    // Throw the error to halt startup if critical services fail
    throw error;
  }
}
