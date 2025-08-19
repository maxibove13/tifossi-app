module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['default-key-1', 'default-key-2']),
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
});