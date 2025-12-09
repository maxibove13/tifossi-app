/**
 * Tests for /users/me controller (favorites resolution and validation)
 */

const controller = require('../src/api/user-profile/controllers/user-profile.ts').default;

function createCtx(body = {}) {
  const ctx = {
    state: { user: { id: 1 } },
    request: { body },
    body: undefined,
    status: undefined,
    badRequest: jest.fn(function (msg) {
      this.status = 400;
      this.body = { error: msg };
    }),
    unauthorized: jest.fn(),
    internalServerError: jest.fn(),
  };
  return ctx;
}

function createStrapiMock({ numericProducts = [], documentProducts = [] } = {}) {
  const productQuery = {
    findMany: jest.fn(async ({ where }) => {
      if (where?.id) return numericProducts;
      if (where?.documentId) return documentProducts;
      return [];
    }),
  };

  const userUpdate = jest.fn(async ({ data }) => ({
    id: 1,
    email: 'test@example.com',
    username: 'user',
    cart: data.cart,
    favorites: data.favorites,
  }));

  global.strapi = {
    db: {
      query: jest.fn((model) => {
        if (model === 'api::product.product') return productQuery;
        if (model === 'plugin::users-permissions.user') {
          return { update: userUpdate };
        }
        return {};
      }),
    },
    log: {
      warn: jest.fn(),
      error: jest.fn(),
    },
  };

  return { productQuery, userUpdate };
}

describe('user-profile controller - favorites resolution', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('resolves numeric and documentId favorites via batched queries', async () => {
    const ctx = createCtx({
      favorites: { set: ['abc-doc', 2] },
    });

    const { productQuery, userUpdate } = createStrapiMock({
      numericProducts: [{ id: 2 }],
      documentProducts: [{ id: 5, documentId: 'abc-doc' }],
    });

    await controller.updateMe(ctx);

    expect(productQuery.findMany).toHaveBeenCalledTimes(2);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          favorites: { set: [2, 5] },
        }),
      })
    );
    expect(ctx.body.favorites.set).toEqual([2, 5]);
  });

  it('fails when no favorites can be resolved', async () => {
    const ctx = createCtx({
      favorites: { set: ['missing-doc', 999] },
    });

    const { productQuery, userUpdate } = createStrapiMock({
      numericProducts: [],
      documentProducts: [],
    });

    await controller.updateMe(ctx);

    expect(productQuery.findMany).toHaveBeenCalledTimes(2);
    expect(userUpdate).not.toHaveBeenCalled();
    expect(ctx.status).toBe(400);
    expect(ctx.body.error).toMatch(/could be resolved/i);
  });

  it('clears favorites when set is empty without DB lookups', async () => {
    const ctx = createCtx({
      favorites: { set: [] },
    });

    const { productQuery, userUpdate } = createStrapiMock();

    await controller.updateMe(ctx);

    expect(productQuery.findMany).not.toHaveBeenCalled();
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          favorites: { set: [] },
        }),
      })
    );
    expect(ctx.body.favorites.set).toEqual([]);
  });
});
