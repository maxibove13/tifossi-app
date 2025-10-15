const dotenv = require('dotenv');
dotenv.config();

// Simulate Strapi's env function
const env = (key, defaultValue) => process.env[key] || defaultValue;
env.int = (key, defaultValue) => parseInt(process.env[key] || defaultValue, 10);
env.bool = (key, defaultValue) =>
  process.env[key] === 'true' || (process.env[key] === undefined && defaultValue);

// Load the database config
const databaseConfig = require('./config/database.js')({ env });

console.log('=== Database Config ===');
console.log(JSON.stringify(databaseConfig, null, 2));

console.log('\n=== What Strapi sees after spreading ===');
const strapiConfig = {
  ...databaseConfig,
  models: [], // Strapi adds models
};
console.log(JSON.stringify(strapiConfig, null, 2));

console.log('\n=== What Database constructor receives ===');
console.log('strapiConfig.connection:', strapiConfig.connection);
console.log('strapiConfig.connection.client:', strapiConfig.connection?.client);
console.log('strapiConfig.connection.connection:', strapiConfig.connection?.connection);
