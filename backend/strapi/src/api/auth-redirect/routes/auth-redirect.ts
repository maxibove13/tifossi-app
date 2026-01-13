/**
 * Auth redirect routes - handles Firebase email action deep links
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/auth/email-action',
      handler: 'auth-redirect.emailAction',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
