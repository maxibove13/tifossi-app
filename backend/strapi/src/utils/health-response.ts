export interface BasicHealthPayload {
  status: 'ok';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export const buildBasicHealthPayload = (): BasicHealthPayload => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
});
