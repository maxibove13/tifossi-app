/**
 * User Profile Routes
 * Custom routes for authenticated user profile operations
 */

export default {
  routes: [
    {
      method: 'PUT',
      path: '/user-profile/me',
      handler: 'user-profile.updateMe',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    // Address CRUD routes
    {
      method: 'GET',
      path: '/user-profile/me/addresses',
      handler: 'user-profile.getAddresses',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'POST',
      path: '/user-profile/me/addresses',
      handler: 'user-profile.createAddress',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'PUT',
      path: '/user-profile/me/addresses/:index',
      handler: 'user-profile.updateAddress',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'DELETE',
      path: '/user-profile/me/addresses/:index',
      handler: 'user-profile.deleteAddress',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'PUT',
      path: '/user-profile/me/addresses/:index/default',
      handler: 'user-profile.setDefaultAddress',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    // Account deletion routes
    {
      method: 'POST',
      path: '/user-profile/me/delete',
      handler: 'user-profile.deleteAccount',
      config: {
        // Custom auth handling in controller for explicit idempotency
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/user-profile/report-orphan',
      handler: 'user-profile.reportOrphan',
      config: {
        // Uses signed deletionReceipt - no auth needed
        auth: false,
      },
    },
  ],
};
