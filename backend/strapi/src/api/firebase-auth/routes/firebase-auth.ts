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
        policies: [],
        middlewares: [],
      },
    },
  ],
};
