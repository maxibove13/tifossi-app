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
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
  ],
};
