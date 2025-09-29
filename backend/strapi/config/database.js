module.exports = ({ env }) => {
  const databaseUrl = env('DATABASE_URL');

  // If DATABASE_URL is provided (Render), use connection string exclusively
  // Otherwise use individual parameters for local development
  const connectionConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        },
      }
    : {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'tifossi_dev'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi123'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      };

  return {
    connection: {
      client: 'postgres',
      connection: connectionConfig,
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      debug: env.bool('DATABASE_DEBUG', false),
    },
  };
};