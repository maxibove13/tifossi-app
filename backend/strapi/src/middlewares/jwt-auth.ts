/**
 * JWT Authentication Middleware
 *
 * Manually validates JWT tokens and populates ctx.state.user for custom routes.
 * This is needed because Strapi v5 only runs authentication for routes with
 * configured permissions in the admin panel.
 *
 * @see https://dev.to/ihesami/strapi-tips-1-adding-custom-jwt-protection-to-your-api-12l3
 */

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const logUnauthorized = (reason: string, errorMessage?: string) => {
      const requestId = ctx.request.header?.['x-request-id'] || ctx.request.header?.['x-requestid'];
      const method = ctx.request.method;
      const path = ctx.request.path;
      const requestInfo = requestId ? ` requestId=${requestId}` : '';
      const errorInfo = errorMessage ? ` error=${errorMessage}` : '';

      strapi.log.warn(
        `[jwt-auth] Unauthorized (${reason}) ${method} ${path}${requestInfo}${errorInfo}`
      );
    };

    const authHeader = ctx.request.header?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logUnauthorized('missing-auth-header');
      return ctx.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Use Strapi's built-in JWT service to verify and decode the token
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      const { id } = await jwtService.verify(token);

      if (!id) {
        logUnauthorized('invalid-token-payload');
        return ctx.unauthorized('Invalid token payload');
      }

      // Fetch the user from the database
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id },
      });

      if (!user) {
        logUnauthorized('user-not-found');
        return ctx.unauthorized('User not found');
      }

      // Populate ctx.state.user like Strapi's built-in auth does
      ctx.state.user = user;

      await next();
    } catch (error: any) {
      logUnauthorized('token-verification-failed', error?.message);
      return ctx.unauthorized('Invalid or expired token');
    }
  };
};
