module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'default-admin-jwt-secret'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'default-api-token-salt'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'default-transfer-token-salt'),
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
});