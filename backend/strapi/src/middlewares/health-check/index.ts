import { buildBasicHealthPayload } from '../../utils/health-response';

const allowedMethods = new Set(['GET', 'HEAD']);

const normalizePath = (rawPath: string): string => {
  const withLeadingSlash = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (withLeadingSlash === '/') {
    return withLeadingSlash;
  }
  return withLeadingSlash.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
};

export default () => {
  const configuredPath = process.env.HEALTH_CHECK_PATH || '/api/health';
  const healthPath = normalizePath(configuredPath);

  return async (ctx: any, next: () => Promise<void>) => {
    if (!allowedMethods.has(ctx.method)) {
      return next();
    }

    const requestPath = normalizePath(ctx.path || ctx.request?.path || '/');

    if (requestPath !== healthPath) {
      return next();
    }

    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (ctx.method === 'GET') {
      ctx.type = 'application/json';
      ctx.body = buildBasicHealthPayload();
    } else {
      ctx.body = null;
    }
  };
};
