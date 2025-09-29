module.exports = ({ env }) => ({
  // Users & Permissions Plugin
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['firstName', 'lastName', 'phoneNumber'],
      },
      jwt: {
        expiresIn: env('JWT_SECRET_EXPIRES', '7d'),
      },
      ratelimit: {
        enabled: env.bool('RATE_LIMIT_ENABLED', false),
        max: env.int('AUTH_RATE_LIMIT_MAX', 5),
        duration: env.int('AUTH_RATE_LIMIT_DURATION', 60000),
      },
    },
  },

  // Upload Plugin Configuration
  upload: {
    config: {
      provider: env('UPLOAD_PROVIDER', 'local'),
      providerOptions: env('UPLOAD_PROVIDER') === 'cloudinary' ? {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
        secure: true,
        folder: env('CLOUDINARY_FOLDER', 'tifossi'),
        use_filename: true,
        unique_filename: false,
      } : env('UPLOAD_PROVIDER') === 'aws-s3' ? {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        bucket: env('AWS_BUCKET'),
        upload: {
          ACL: 'public-read',
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
        },
      } : {
        sizeLimit: env.int('UPLOAD_SIZE_LIMIT', 200 * 1024 * 1024), // 200MB
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
    },
  },

  // Email Plugin Configuration
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'localhost'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        secure: env.bool('SMTP_SECURE', false),
        tls: {
          rejectUnauthorized: env.bool('SMTP_REJECT_UNAUTHORIZED', true),
        },
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@tifossi.com'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'support@tifossi.com'),
        testAddress: env('EMAIL_TEST_ADDRESS'),
      },
    },
  },

  // GraphQL Plugin (Optional)
  graphql: {
    enabled: env.bool('GRAPHQL_ENABLED', false),
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: env.bool('GRAPHQL_PLAYGROUND_ALWAYS', false),
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: env.bool('GRAPHQL_TRACING', false),
      },
    },
  },

  // Documentation Plugin
  documentation: {
    enabled: env.bool('API_DOCUMENTATION_ENABLED', true),
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Tifossi E-commerce API',
        description: 'API documentation for Tifossi e-commerce backend',
        termsOfService: 'https://tifossi.app/terms',
        contact: {
          name: 'Tifossi API Support',
          email: 'api@tifossi.com',
          url: 'https://tifossi.app/support',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      'x-strapi-config': {
        mutateDocumentation: (generatedDoc) => {
          // Custom documentation modifications
          generatedDoc.info['x-logo'] = {
            url: 'https://tifossi.app/logo.png',
            altText: 'Tifossi Logo',
          };
          return generatedDoc;
        },
      },
      servers: [
        {
          url: env('API_URL', 'http://localhost:1337/api'),
          description: 'Development server',
        },
        {
          url: 'https://staging-api.tifossi.app/api',
          description: 'Staging server',
        },
        {
          url: 'https://api.tifossi.app/api',
          description: 'Production server',
        },
      ],
    },
  },

  // Internationalization Plugin
  i18n: {
    enabled: env.bool('I18N_ENABLED', true),
    config: {
      defaultLocale: env('DEFAULT_LOCALE', 'es'),
      locales: env.array('SUPPORTED_LOCALES', ['es', 'en', 'pt']),
    },
  },

  // Redis Plugin for Caching (if using Redis)
  ...((env('REDIS_URL') || env('REDIS_HOST')) && {
    redis: {
      config: {
        connections: {
          default: {
            connection: {
              host: env('REDIS_HOST', 'localhost'),
              port: env.int('REDIS_PORT', 6379),
              db: env.int('REDIS_DB', 0),
              password: env('REDIS_PASSWORD'),
            },
            settings: {
              debug: env.bool('REDIS_DEBUG', false),
            },
          },
        },
      },
    },
  }),

  // Sentry Plugin for Error Monitoring (if using Sentry)
  ...((env('SENTRY_DSN')) && {
    sentry: {
      enabled: true,
      config: {
        dsn: env('SENTRY_DSN'),
        sendMetadata: true,
        init: {
          dsn: env('SENTRY_DSN'),
          environment: env('NODE_ENV', 'development'),
          sampleRate: env.float('SENTRY_SAMPLE_RATE', 1.0),
          tracesSampleRate: env.float('SENTRY_TRACES_SAMPLE_RATE', 0.1),
        },
      },
    },
  }),
});