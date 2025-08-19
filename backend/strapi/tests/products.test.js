/**
 * Products API tests
 */

const request = require('supertest');

describe('Products API', () => {
  let strapi;
  let authToken;
  let testCategory;
  let testProductModel;
  let testProductStatus;

  beforeAll(async () => {
    strapi = await setupStrapi();
    
    // Create test user and authenticate
    const testUser = await createTestUser({
      username: 'producttest',
      email: 'producttest@example.com',
    });
    authToken = await authenticateUser(testUser);

    // Create test data
    testCategory = await strapi.db.query('api::category.category').create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        isActive: true,
        publishedAt: new Date(),
      },
    });

    testProductModel = await strapi.db.query('api::product-model.product-model').create({
      data: {
        name: 'Test Model',
        slug: 'test-model',
        category: testCategory.id,
        isActive: true,
        publishedAt: new Date(),
      },
    });

    testProductStatus = await strapi.db.query('api::product-status.product-status').create({
      data: {
        name: 'new',
        priority: 1,
        labelEs: 'NUEVO',
        labelEn: 'NEW',
        color: '#FFFFFF',
        backgroundColor: '#FF6B35',
        isActive: true,
        publishedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await cleanupDatabase();
    await cleanupStrapi();
  });

  describe('GET /api/products', () => {
    it('should return empty products list initially', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return products with pagination', async () => {
      // Create test product first
      const testProduct = await strapi.db.query('api::product.product').create({
        data: {
          title: 'Test Product',
          slug: 'test-product',
          price: 29.99,
          category: testCategory.id,
          model: testProductModel.id,
          colors: [
            {
              name: 'Red',
              hexCode: '#FF0000',
              isActive: true,
              displayOrder: 1,
            },
          ],
          totalStock: 10,
          isActive: true,
          publishedAt: new Date(),
        },
      });

      const response = await request(strapi.server.httpServer)
        .get('/api/products')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0].attributes).toHaveProperty('title', 'Test Product');
      expect(response.body.data[0].attributes).toHaveProperty('price', '29.99');
    });
  });

  describe('POST /api/products', () => {
    it('should require authentication for creating products', async () => {
      const productData = {
        data: {
          title: 'New Product',
          price: 39.99,
          category: testCategory.id,
          colors: [
            {
              name: 'Blue',
              hexCode: '#0000FF',
              isActive: true,
              displayOrder: 1,
            },
          ],
        },
      };

      await request(strapi.server.httpServer)
        .post('/api/products')
        .send(productData)
        .expect(401);
    });

    it('should create product with valid data when authenticated', async () => {
      const productData = {
        data: {
          title: 'Authenticated Product',
          price: 49.99,
          category: testCategory.id,
          model: testProductModel.id,
          colors: [
            {
              name: 'Green',
              hexCode: '#00FF00',
              isActive: true,
              displayOrder: 1,
            },
          ],
          totalStock: 15,
          isActive: true,
        },
      };

      const response = await request(strapi.server.httpServer)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.attributes).toHaveProperty('title', 'Authenticated Product');
      expect(response.body.data.attributes).toHaveProperty('price', '49.99');
    });
  });

  describe('GET /api/products/:id', () => {
    let testProductId;

    beforeAll(async () => {
      const testProduct = await strapi.db.query('api::product.product').create({
        data: {
          title: 'Single Product Test',
          slug: 'single-product-test',
          price: 19.99,
          category: testCategory.id,
          model: testProductModel.id,
          colors: [
            {
              name: 'Yellow',
              hexCode: '#FFFF00',
              isActive: true,
              displayOrder: 1,
            },
          ],
          totalStock: 5,
          isActive: true,
          publishedAt: new Date(),
        },
      });
      testProductId = testProduct.id;
    });

    it('should return single product by ID', async () => {
      const response = await request(strapi.server.httpServer)
        .get(`/api/products/${testProductId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id', testProductId);
      expect(response.body.data.attributes).toHaveProperty('title', 'Single Product Test');
    });

    it('should return 404 for non-existent product', async () => {
      await request(strapi.server.httpServer)
        .get('/api/products/99999')
        .expect(404);
    });
  });

  describe('Product relationships', () => {
    it('should populate category and model relationships', async () => {
      const testProduct = await strapi.db.query('api::product.product').create({
        data: {
          title: 'Relationship Test Product',
          slug: 'relationship-test-product',
          price: 59.99,
          category: testCategory.id,
          model: testProductModel.id,
          colors: [
            {
              name: 'Purple',
              hexCode: '#800080',
              isActive: true,
              displayOrder: 1,
            },
          ],
          totalStock: 8,
          isActive: true,
          publishedAt: new Date(),
        },
      });

      const response = await request(strapi.server.httpServer)
        .get(`/api/products/${testProduct.id}?populate=*`)
        .expect(200);

      expect(response.body.data.attributes).toHaveProperty('category');
      expect(response.body.data.attributes).toHaveProperty('model');
      expect(response.body.data.attributes.category.data).toHaveProperty('id', testCategory.id);
      expect(response.body.data.attributes.model.data).toHaveProperty('id', testProductModel.id);
    });
  });
});