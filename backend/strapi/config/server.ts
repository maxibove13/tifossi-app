export default ({ env }: { env: any }) => {
  const nodeEnv = env('NODE_ENV', 'development');
  const configuredAppKeys = env.array('APP_KEYS');
  const isDevelopment = nodeEnv === 'development';

  const hasConfiguredKeys = Array.isArray(configuredAppKeys) && configuredAppKeys.length > 0;
  const usesPlaceholderKeys = hasConfiguredKeys
    ? configuredAppKeys.some((key) => key.startsWith('default-key'))
    : false;

  if (!isDevelopment && (!hasConfiguredKeys || usesPlaceholderKeys)) {
    throw new Error(
      'APP_KEYS environment variable must be set to secure values in production.'
    );
  }

  const appKeys = hasConfiguredKeys
    ? configuredAppKeys
    : ['dev-key-1', 'dev-key-2', 'dev-key-3', 'dev-key-4'];

  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys: appKeys,
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
    url: env('PUBLIC_URL', `http://${env('HOST', '0.0.0.0')}:${env.int('PORT', 1337)}`),
    proxy: env.bool('IS_PROXIED', false),
    cron: {
      enabled: env.bool('CRON_ENABLED', true),
    },
    dirs: {
      public: env('PUBLIC_DIR', './public'),
    },
    transfer: {
      remote: {
        enabled: env.bool('STRAPI_TRANSFER_REMOTE_ENABLED', true),
      },
    },
    emitErrors: env.bool('EMIT_ERRORS', false),
  };
};
