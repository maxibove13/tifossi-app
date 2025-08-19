module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'res.cloudinary.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      header: '*',
      origin: env.array('CORS_ORIGINS', [
        'http://localhost:3000',
        'http://localhost:8081',
        'exp://localhost:8081',
      ]),
      expose: [
        'WWW-Authenticate',
        'Server-Authorization',
        'x-total-count',
      ],
      maxAge: 31536000,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'X-Requested-With',
        'X-HTTP-Method-Override',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: env('MAX_REQUEST_SIZE', '10mb'),
      jsonLimit: env('MAX_JSON_SIZE', '10mb'),
      textLimit: env('MAX_TEXT_SIZE', '10mb'),
      formidable: {
        maxFileSize: env.int('UPLOAD_SIZE_LIMIT', 200 * 1024 * 1024), // 200MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::rate-limit',
    config: {
      enabled: env.bool('RATE_LIMIT_ENABLED', false),
      max: env.int('RATE_LIMIT_MAX_REQUESTS', 1000),
      duration: env.int('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    },
  },
  {
    name: 'global::logging',
    config: {
      enabled: true,
      level: env('LOG_LEVEL', 'info'),
    },
  },
];