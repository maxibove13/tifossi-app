/**
 * Optional JWT Authentication Middleware
 *
 * Validates JWT tokens and populates ctx.state.user if a valid token is provided.
 * Unlike jwt-auth, this middleware allows requests without tokens to proceed.
 * Use for endpoints that support both authenticated and guest access.
 */

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const authHeader = ctx.request.header?.authorization;

    // No auth header - continue without user (guest flow)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await next();
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Use Strapi's built-in JWT service to verify and decode the token
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      const { id } = await jwtService.verify(token);

      if (id) {
        // Fetch the user from the database
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id },
        });

        if (user) {
          // Populate ctx.state.user like Strapi's built-in auth does
          ctx.state.user = user;
        }
      }
    } catch (error: any) {
      // Invalid token - log but continue as guest
      // This allows expired tokens to fall back to guest flow with email verification
      strapi.log.debug(`[jwt-auth-optional] Token validation failed: ${error?.message}`);
    }

    await next();
  };
};
