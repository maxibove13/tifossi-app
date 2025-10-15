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

  return async (ctx: any, next: () => Promise<void>) => {
    if (isProxied && ctx?.request) {
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
      }
    }

    await next();
  };
};
