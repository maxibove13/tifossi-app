/**
 * Middleware to serve apple-app-site-association file with correct content type
 * Required for iOS Universal Links to work properly
 */

import fs from 'fs';
import path from 'path';

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (ctx.path === '/.well-known/apple-app-site-association') {
      const filePath = path.resolve(process.cwd(), 'public/.well-known/apple-app-site-association');

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        ctx.type = 'application/json';
        ctx.body = content;
        return;
      }
    }

    await next();
  };
};
