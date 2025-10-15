import fs from 'fs';
import path from 'path';

export default ({ env }: { env: any }) => {
  const publicDir = env('PUBLIC_DIR', './public');
  const faviconPath = path.resolve(process.cwd(), publicDir, 'favicon.ico');
  const middlewares: any[] = [
    'global::health-check',
    'global::trust-proxy',
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
            'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        header: '*',
        origin: env.array('CORS_ORIGINS', [
          'http://localhost:3000',
          'http://localhost:8081',
          'exp://localhost:8081',
        ]),
        expose: ['WWW-Authenticate', 'Server-Authorization', 'x-total-count'],
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
  ];

  if (fs.existsSync(faviconPath)) {
    middlewares.push({
      name: 'strapi::favicon',
      config: {
        path: faviconPath,
      },
    });
  }

  middlewares.push('strapi::public');

  return middlewares;
};
