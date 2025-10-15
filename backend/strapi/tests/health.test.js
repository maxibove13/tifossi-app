/**
 * Health endpoint tests
 */

const request = require('supertest');

describe('Health Endpoints', () => {
  let strapi;

  beforeAll(async () => {
    strapi = await setupStrapi();
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const response = await request(strapi.server.httpServer).get('/api/health').expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('system');

      // Check services
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('upload');
      expect(response.body.services).toHaveProperty('email');

      // Check memory information
      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('total');

      // Check system information
      expect(response.body.system).toHaveProperty('platform');
      expect(response.body.system).toHaveProperty('arch');
      expect(response.body.system).toHaveProperty('nodeVersion');
    });
  });
});
