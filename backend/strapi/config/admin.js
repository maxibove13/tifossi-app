module.exports = ({ env }) => {
  const nodeEnv = env('NODE_ENV', 'development');
  const isDevelopment = nodeEnv === 'development';

  const resolveSecret = (name, devFallback) => {
    const value = env(name);
    const isPlaceholder = typeof value === 'string' && value.startsWith('default-');

    if (!isDevelopment && (!value || isPlaceholder)) {
      throw new Error(`${name} environment variable must be set to a secure value in production.`);
    }

    return value || devFallback;
  };

  const adminJwtSecret = resolveSecret('ADMIN_JWT_SECRET', 'dev-admin-jwt-secret');
  const apiTokenSalt = resolveSecret('API_TOKEN_SALT', 'dev-api-token-salt');
  const transferTokenSalt = resolveSecret('TRANSFER_TOKEN_SALT', 'dev-transfer-token-salt');

  return {
    auth: {
      secret: adminJwtSecret,
    },
    apiToken: {
      salt: apiTokenSalt,
    },
    transfer: {
      token: {
        salt: transferTokenSalt,
      },
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
    url: env('ADMIN_URL', '/admin'),
    serveAdminPanel: env.bool('ADMIN_PANEL_ENABLED', true),
    autoOpen: env.bool('ADMIN_AUTO_OPEN', false),
    watchIgnoreFiles: [
      './src/**/*.ts',
      './dist/**/*',
      './.cache/**/*',
    ],
    host: env('ADMIN_HOST', 'localhost'),
    port: env.int('ADMIN_PORT', 1337),
  };
};
