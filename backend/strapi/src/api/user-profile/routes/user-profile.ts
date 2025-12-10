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
        auth: false, // Disable Strapi's permission-based auth
        middlewares: ['global::jwt-auth'], // Use custom JWT middleware instead
      },
    },
  ],
};
