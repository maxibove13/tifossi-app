/**
 * `is-authenticated` policy
 *
 * Checks if the user is authenticated via JWT token.
 * The JWT token is validated by Strapi's users-permissions plugin,
 * which populates policyContext.state.user when a valid token is present.
 *
 * Usage in routes:
 * ```
 * config: {
 *   policies: ['global::is-authenticated']
 * }
 * ```
 */

export default (policyContext: any, config: any, { strapi }: any) => {
  // Check if a user session exists (JWT was validated by users-permissions plugin)
  if (policyContext.state.user) {
    return true; // User is authenticated, allow request
  }

  // No valid JWT token found, block request
  return false;
};
