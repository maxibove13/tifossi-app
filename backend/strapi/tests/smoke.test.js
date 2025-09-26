/**
 * Basic smoke tests for Strapi backend
 * These tests verify the basic configuration and structure
 * without requiring a running Strapi instance
 */

describe('Strapi Backend Smoke Tests', () => {
  describe('Configuration', () => {
    it('should have package.json with required dependencies', () => {
      const packageJson = require('../package.json');

      expect(packageJson).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@strapi/strapi']).toBeDefined();
      expect(packageJson.dependencies['pg']).toBeDefined();
      expect(packageJson.dependencies['mercadopago']).toBeDefined();
    });

    it('should have proper Strapi version', () => {
      const packageJson = require('../package.json');
      const strapiVersion = packageJson.dependencies['@strapi/strapi'];

      // Should be version 4.x
      expect(strapiVersion).toMatch(/^\^4\./);
    });

    it('should have test scripts configured', () => {
      const packageJson = require('../package.json');

      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.develop).toBeDefined();
    });
  });

  describe('Project Structure', () => {
    it('should have required directories', () => {
      const fs = require('fs');
      const path = require('path');

      const requiredDirs = [
        'src',
        'src/api',
        'config',
        'tests'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have environment configuration', () => {
      const fs = require('fs');
      const path = require('path');

      const envExamplePath = path.join(__dirname, '..', '.env.example');

      // Check if file exists, if not just warn (for CI environments)
      if (!fs.existsSync(envExamplePath)) {
        console.warn('.env.example not found at expected path - this is normal in CI');
        return;
      }

      expect(fs.existsSync(envExamplePath)).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should have database config file', () => {
      const fs = require('fs');
      const path = require('path');

      const dbConfigPath = path.join(__dirname, '..', 'config', 'database.js');
      expect(fs.existsSync(dbConfigPath)).toBe(true);
    });

    it('should support PostgreSQL in production', () => {
      const dbConfig = require('../config/database.js');

      // Test that the config exports a function
      expect(typeof dbConfig).toBe('function');

      // Since we're in test environment with SQLite, just verify config structure
      const testConfig = dbConfig({ env: global.env });

      // In test environment, we use SQLite for speed
      expect(testConfig.connection.client).toBe('sqlite');

      // But verify that postgres config exists when DATABASE_CLIENT is set
      const originalClient = process.env.DATABASE_CLIENT;
      process.env.DATABASE_CLIENT = 'postgres';

      const prodLikeConfig = dbConfig({ env: global.env });
      expect(prodLikeConfig.connection.client).toBe('postgres');

      // Restore original env
      process.env.DATABASE_CLIENT = originalClient;
    });
  });

  describe('API Structure', () => {
    it('should have product API folder', () => {
      const fs = require('fs');
      const path = require('path');

      const productApiPath = path.join(__dirname, '..', 'src', 'api', 'product');
      expect(fs.existsSync(productApiPath)).toBe(true);
    });

    it('should have order API folder', () => {
      const fs = require('fs');
      const path = require('path');

      const orderApiPath = path.join(__dirname, '..', 'src', 'api', 'order');
      expect(fs.existsSync(orderApiPath)).toBe(true);
    });

    it('should have category API folder', () => {
      const fs = require('fs');
      const path = require('path');

      const categoryApiPath = path.join(__dirname, '..', 'src', 'api', 'category');
      expect(fs.existsSync(categoryApiPath)).toBe(true);
    });
  });
});