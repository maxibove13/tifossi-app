export default {
  routes: [
    {
      method: 'GET',
      path: '/app-settings',
      handler: 'app-settings.find',
      config: {
        policies: [],
        auth: false, // Public access for reading settings
      },
    },
    {
      method: 'PUT',
      path: '/app-settings',
      handler: 'app-settings.update',
      config: {
        policies: [],
      },
    },
  ],
};
