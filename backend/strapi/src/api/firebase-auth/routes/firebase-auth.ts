/**
 * Firebase Auth Routes
 * Public endpoint for Firebase token exchange
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/firebase-exchange',
      handler: 'firebase-auth.exchange',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/auth/validate',
      handler: 'firebase-auth.validate',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
  ],
};
