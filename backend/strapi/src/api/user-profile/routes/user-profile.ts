/**
 * User Profile Routes
 * Custom routes for authenticated user profile operations
 */

export default {
  routes: [
    {
      method: 'PUT',
      path: '/users/me',
      handler: 'user-profile.updateMe',
      config: {
        prefix: '',
        policies: ['plugin::users-permissions.isAuthenticated'],
        middlewares: [],
      },
    },
  ],
};
