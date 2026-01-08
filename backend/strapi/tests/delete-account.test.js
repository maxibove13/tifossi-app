/**
 * Tests for account deletion endpoints
 * POST /api/user-profile/me/delete
 * POST /api/user-profile/report-orphan
 */

const jwt = require('jsonwebtoken');
const controller = require('../src/api/user-profile/controllers/user-profile.ts').default;

// Must match the fallback secret in the controller (used when DELETION_SECRET env var is not set)
const TEST_SECRET = 'dev-deletion-secret-do-not-use-in-prod';

function createCtx({ body = {}, authHeader = null, user = null } = {}) {
  const ctx = {
    state: { user },
    request: {
      body,
      header: authHeader ? { authorization: authHeader } : {},
    },
    params: {},
    body: undefined,
    status: undefined,
    badRequest: jest.fn(function (msg) {
      this.status = 400;
      this.body = { error: msg };
    }),
    unauthorized: jest.fn(function (msg) {
      this.status = 401;
      this.body = { error: msg };
    }),
    notFound: jest.fn(function (msg) {
      this.status = 404;
      this.body = { error: msg };
    }),
    internalServerError: jest.fn(function (msg) {
      this.status = 500;
      this.body = { error: msg };
    }),
  };
  return ctx;
}

function createStrapiMock({ user = null, orders = [] } = {}) {
  const userQuery = {
    findOne: jest.fn(async () => user),
    delete: jest.fn(async () => user),
  };

  const orderQuery = {
    updateMany: jest.fn(async () => ({ count: orders.length })),
  };

  const jwtService = {
    verify: jest.fn((token) => {
      if (token === 'valid-token') return { id: 1 };
      if (token === 'deleted-user-token') return { id: 999 };
      throw new Error('Invalid token');
    }),
  };

  const uploadService = {
    remove: jest.fn(async () => {}),
  };

  global.strapi = {
    db: {
      query: jest.fn((model) => {
        if (model === 'plugin::users-permissions.user') return userQuery;
        if (model === 'api::order.order') return orderQuery;
        return {};
      }),
    },
    plugin: jest.fn(() => ({
      service: jest.fn(() => jwtService),
    })),
    plugins: {
      upload: {
        services: {
          upload: uploadService,
        },
      },
    },
    log: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };

  return { userQuery, orderQuery, jwtService, uploadService };
}

describe('deleteAccount', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const ctx = createCtx();
    createStrapiMock();

    await controller.deleteAccount(ctx);

    expect(ctx.unauthorized).toHaveBeenCalledWith('Missing authorization');
  });

  it('returns 401 when authorization header is malformed', async () => {
    const ctx = createCtx({ authHeader: 'InvalidHeader' });
    createStrapiMock();

    await controller.deleteAccount(ctx);

    expect(ctx.unauthorized).toHaveBeenCalledWith('Missing authorization');
  });

  it('returns 401 when token is invalid', async () => {
    const ctx = createCtx({ authHeader: 'Bearer invalid-token' });
    createStrapiMock();

    await controller.deleteAccount(ctx);

    expect(ctx.unauthorized).toHaveBeenCalledWith('Invalid token');
  });

  it('returns success with alreadyDeleted when user does not exist (idempotency)', async () => {
    const ctx = createCtx({ authHeader: 'Bearer deleted-user-token' });
    createStrapiMock({ user: null });

    await controller.deleteAccount(ctx);

    expect(ctx.body).toEqual({ success: true, alreadyDeleted: true });
  });

  it('deletes user and anonymizes orders', async () => {
    const mockUser = {
      id: 1,
      firebaseUid: 'firebase-uid-123',
      profilePicture: null,
    };
    const ctx = createCtx({ authHeader: 'Bearer valid-token' });
    const { userQuery, orderQuery } = createStrapiMock({ user: mockUser });

    await controller.deleteAccount(ctx);

    // Verify orders were anonymized
    expect(orderQuery.updateMany).toHaveBeenCalledWith({
      where: { user: 1 },
      data: expect.objectContaining({
        user: null,
        shippingAddress: null,
        customerNotes: null,
        notes: null,
      }),
    });
    expect(orderQuery.updateMany.mock.calls[0][0].data.guestEmail).toMatch(
      /^deleted_\d+@deleted\.tifossi\.app$/
    );

    // Verify user was deleted
    expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 1 } });

    // Verify response
    expect(ctx.body.success).toBe(true);
    expect(ctx.body.deletionReceipt).toBeDefined();

    // Verify receipt is valid JWT with uid
    const decoded = jwt.verify(ctx.body.deletionReceipt, TEST_SECRET);
    expect(decoded.uid).toBe('firebase-uid-123');
  });

  it('deletes profile picture when present', async () => {
    const mockProfilePic = { id: 42, url: '/uploads/pic.jpg' };
    const mockUser = {
      id: 1,
      firebaseUid: 'firebase-uid-123',
      profilePicture: mockProfilePic,
    };
    const ctx = createCtx({ authHeader: 'Bearer valid-token' });
    const { uploadService } = createStrapiMock({ user: mockUser });

    await controller.deleteAccount(ctx);

    expect(uploadService.remove).toHaveBeenCalledWith(mockProfilePic);
    expect(ctx.body.success).toBe(true);
  });

  it('continues deletion even if profile picture removal fails', async () => {
    const mockProfilePic = { id: 42, url: '/uploads/pic.jpg' };
    const mockUser = {
      id: 1,
      firebaseUid: 'firebase-uid-123',
      profilePicture: mockProfilePic,
    };
    const ctx = createCtx({ authHeader: 'Bearer valid-token' });
    const { uploadService, userQuery } = createStrapiMock({ user: mockUser });
    uploadService.remove.mockRejectedValue(new Error('Storage error'));

    await controller.deleteAccount(ctx);

    // User should still be deleted
    expect(userQuery.delete).toHaveBeenCalled();
    expect(ctx.body.success).toBe(true);
    expect(strapi.log.error).toHaveBeenCalledWith(
      '[deleteAccount] Failed to remove profile picture:',
      expect.any(Error)
    );
  });
});

describe('reportOrphan', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 when deletionReceipt is missing', async () => {
    const ctx = createCtx({ body: {} });
    createStrapiMock();

    await controller.reportOrphan(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('Missing deletionReceipt');
  });

  it('returns 400 when deletionReceipt is invalid', async () => {
    const ctx = createCtx({ body: { deletionReceipt: 'invalid-jwt' } });
    createStrapiMock();

    await controller.reportOrphan(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('Invalid or expired deletionReceipt');
  });

  it('returns 400 when deletionReceipt is expired', async () => {
    const expiredReceipt = jwt.sign({ uid: 'test-uid' }, TEST_SECRET, { expiresIn: '-1h' });
    const ctx = createCtx({ body: { deletionReceipt: expiredReceipt } });
    createStrapiMock();

    await controller.reportOrphan(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('Invalid or expired deletionReceipt');
  });

  it('logs orphan UID and returns success for valid receipt', async () => {
    const validReceipt = jwt.sign({ uid: 'orphan-firebase-uid' }, TEST_SECRET, { expiresIn: '1h' });
    const ctx = createCtx({ body: { deletionReceipt: validReceipt } });
    createStrapiMock();

    await controller.reportOrphan(ctx);

    expect(ctx.body).toEqual({ success: true });
    expect(strapi.log.warn).toHaveBeenCalledWith('[orphan] Firebase UID: orphan-firebase-uid');
  });
});
