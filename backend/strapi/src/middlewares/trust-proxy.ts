const FALLBACK_PROTO = 'https';

const normalizeHeader = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(normalizeHeader);
  }

  return String(value)
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
};

export default (_config: unknown, { strapi }: { strapi: any }) => {
  const isProxied = Boolean(strapi?.config?.get?.('server.proxy', false));

  if (isProxied) {
    strapi.log.info('[trust-proxy] Proxy mode enabled; enforcing HTTPS headers');
  } else {
    strapi.log.warn('[trust-proxy] Proxy mode disabled; secure cookies may fail behind proxies');
  }

  return async (ctx: any, next: () => Promise<void>) => {
    if (isProxied && ctx?.request) {
      const beforeProto = ctx.protocol;
      const beforeEncrypted = ctx.req?.socket?.encrypted ?? ctx.req?.connection?.encrypted ?? false;
      const existing = normalizeHeader(
        ctx.get?.('x-forwarded-proto') ?? ctx.request?.header?.['x-forwarded-proto']
      );

      if (!existing.includes(FALLBACK_PROTO)) {
        const headerValue = FALLBACK_PROTO;

        if (ctx.request.headers) {
          ctx.request.headers['x-forwarded-proto'] = headerValue;
        }
        if (ctx.req?.headers) {
          ctx.req.headers['x-forwarded-proto'] = headerValue;
        }

        if (ctx.req) {
          ctx.req.protocol = headerValue;
          if (ctx.req.socket) {
            ctx.req.socket.encrypted = true;
          }
        }

        strapi.log.info(
          `[trust-proxy] Adjusted protocol for ${ctx.path}: ` +
            `${beforeProto}→${FALLBACK_PROTO}, encrypted=${beforeEncrypted}→${ctx.req?.socket?.encrypted ?? ctx.req?.connection?.encrypted ?? false}`
        );
      } else if (ctx.path.startsWith('/admin')) {
        strapi.log.info(
          `[trust-proxy] Forwarded proto already https for ${ctx.path}; encrypted=${beforeEncrypted}`
        );
      }
    }

    await next();
  };
};
