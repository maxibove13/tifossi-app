export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {},

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
      console.log('Creating default admin user...');
      // Default admin creation logic would go here
      // This is typically done through Strapi CLI or admin panel
    }

    // Initialize default product statuses if they don't exist
    const productStatuses = await strapi.db.query('api::product-status.product-status').findMany();

    if (productStatuses.length === 0) {
      console.log('Creating default product statuses...');

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

      console.log('Default product statuses created');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

/**
 * Set up cron jobs for the application
 */
function setupCronJobs(strapi: any) {
  try {
    // Example: Clean up expired sessions daily
    strapi.cron.add({
      cleanupSessions: {
        task: ({ strapi }: { strapi: any }) => {
          console.log('Running session cleanup...');
          // Cleanup logic here
        },
        options: {
          rule: '0 0 * * *', // Daily at midnight
        },
      },
    });

    // Example: Update product analytics weekly
    strapi.cron.add({
      updateAnalytics: {
        task: ({ strapi }: { strapi: any }) => {
          console.log('Updating product analytics...');
          // Analytics update logic here
        },
        options: {
          rule: '0 0 * * 0', // Weekly on Sunday at midnight
        },
      },
    });

    console.log('Cron jobs initialized');
  } catch (error) {
    console.error('Error setting up cron jobs:', error);
  }
}

/**
 * Initialize external services
 */
async function initializeExternalServices(strapi: any) {
  try {
    // Initialize MercadoPago if enabled
    if (process.env.FEATURE_PAYMENTS_ENABLED === 'true') {
      console.log('Initializing MercadoPago service...');
      // MercadoPago initialization would be handled in the payment service
    }

    // Initialize email service if enabled
    if (process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true') {
      console.log('Initializing email service...');
      // Email service initialization
    }

    // Test database connection
    await strapi.db.connection.raw('SELECT 1');
    console.log('Database connection established');

    console.log('External services initialized');
  } catch (error) {
    console.error('Error initializing external services:', error);
    // Don't throw - let the app start even if some services fail
  }
}
