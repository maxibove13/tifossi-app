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
        // No auth: false means Strapi uses default JWT validation
        // which populates ctx.state.user automatically
      },
    },
  ],
};
