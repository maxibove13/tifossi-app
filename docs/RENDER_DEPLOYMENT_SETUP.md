# Render.com Deployment Setup Guide for Tifossi

## Overview

This guide explains how to deploy the Tifossi backend to Render.com and configure the mobile app to connect to it.

## Backend Deployment URL

When deployed to Render.com, your Strapi backend will be available at:
```
https://tifossi-strapi-backend.onrender.com
```

*Note: The actual URL may vary if the service name is changed during deployment.*

## Environment Variables Configuration

### For Mobile App (React Native/Expo)

The app requires the following environment variables to connect to the backend:

#### Option 1: Using Environment Variables (Recommended)

Create a `.env` file in the root of the Tifossi mobile app directory:

```bash
# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com

# OR if you prefer to keep the /api prefix separate:
EXPO_PUBLIC_BACKEND_URL=https://tifossi-strapi-backend.onrender.com
```

#### Option 2: Build-Time Configuration

When building for production using EAS Build, set the environment variables:

```bash
# For production builds
eas build --platform ios --profile production \
  --env-var EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com

# For staging/testing
eas build --platform ios --profile preview \
  --env-var EXPO_PUBLIC_API_BASE_URL=https://staging-tifossi-strapi.onrender.com
```

### For Strapi Backend (on Render)

The following environment variables need to be configured in the Render dashboard:

#### Required Variables

```bash
# Database (automatically provided by Render PostgreSQL)
DATABASE_URL=<automatically-provided-by-render>

# Strapi Security Keys (generate unique values)
APP_KEYS=<generate-with-node-crypto>
API_TOKEN_SALT=<generate-with-node-crypto>
ADMIN_JWT_SECRET=<generate-with-node-crypto>
TRANSFER_TOKEN_SALT=<generate-with-node-crypto>
JWT_SECRET=<generate-with-node-crypto>

# MercadoPago Production Credentials
MERCADO_PAGO_ACCESS_TOKEN=<your-production-access-token>
MERCADO_PAGO_PUBLIC_KEY=<your-production-public-key>
MERCADO_PAGO_WEBHOOK_SECRET=<your-webhook-secret>

# Cloudinary Configuration
CLOUDINARY_NAME=<your-cloudinary-name>
CLOUDINARY_KEY=<your-cloudinary-key>
CLOUDINARY_SECRET=<your-cloudinary-secret>

# Email Service (optional but recommended)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USERNAME=<your-smtp-username>
SMTP_PASSWORD=<your-smtp-password>
EMAIL_FROM=noreply@tifossi.com
EMAIL_REPLY_TO=support@tifossi.com
```

#### Generate Security Keys

Use this Node.js command to generate secure random keys:
```javascript
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Pre-Deployment Validation

Before deploying to Render, validate your Strapi build locally to catch issues early.

### Local Build Verification

```bash
cd backend/strapi

# 1. Clean previous builds
rm -rf dist/ build/ .cache/

# 2. Install dependencies
npm ci

# 3. Build with production settings (Strapi v5)
NODE_ENV=production npm run build

# 4. Verify content-types compiled to dist/
ls -la dist/api/*/content-types/*/index.js

# 5. Verify components compiled to dist/
ls -la dist/components/*/*

# 6. Check for any compilation errors
echo $?  # Should be 0 for success
```

### Strapi v5 Requirements Checklist

Before deploying, ensure:

- [ ] All content-types have both `schema.json` AND `index.ts` files
- [ ] All components have both `.json` AND `.ts` export files
- [ ] Components use flat structure (not nested in subdirectories)
- [ ] Build completes successfully with `npm run build`
- [ ] `dist/` folder contains compiled content-types and components
- [ ] All environment variables are configured in Render dashboard

### Check for Missing TypeScript Files

Run this script to find missing `index.ts` files:

```bash
# Check for content-types missing index.ts
find backend/strapi/src/api -name "schema.json" -not -path "*/node_modules/*" | while read schema; do
  dir=$(dirname "$schema")
  if [ ! -f "$dir/index.ts" ]; then
    echo "⚠️  Missing index.ts in: $dir"
  fi
done

# Check for components missing .ts files
find backend/strapi/src/components -name "*.json" -not -path "*/node_modules/*" | while read comp; do
  ts_file="${comp%.json}.ts"
  if [ ! -f "$ts_file" ]; then
    echo "⚠️  Missing .ts file for: $comp"
  fi
done
```

If any files are missing, create them with this format:

```typescript
// For content-types (index.ts)
import schema from './schema.json';

export default {
  schema,
};

// For components ({name}.ts)
import schema from './{name}.json';

export default {
  schema,
};
```

## Deployment Steps

### 1. Deploy Backend to Render

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Create a new Web Service with these settings:
   - **Name**: `tifossi-strapi-backend`
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Starter ($7/month)

4. Create a PostgreSQL database:
   - **Name**: `tifossi-postgres`
   - **Plan**: Starter
   - **Size**: 1GB

5. Configure environment variables in Render dashboard (see above)

### 2. Configure Mobile App

1. Update `.env` file with production URL:
```bash
EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com
```

2. Build the app for production:
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 3. Configure Webhooks

After deployment, configure MercadoPago webhooks to point to:
```
https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago
```

## Testing the Connection

### From Development Environment

Test the API connection:
```bash
# Check health endpoint
curl https://tifossi-strapi-backend.onrender.com/api/health

# Test products endpoint (public)
curl https://tifossi-strapi-backend.onrender.com/api/products
```

### From Mobile App

Set environment variable and restart Expo:
```bash
export EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com
npx expo start --clear
```

## Troubleshooting

### Common Issues

1. **Connection Refused / Timeout**
   - Check if the backend is running on Render
   - Verify the URL is correct
   - Ensure CORS is configured properly in Strapi

2. **401 Unauthorized**
   - Check if authentication tokens are being sent
   - Verify JWT secrets match between services
   - Ensure Firebase authentication is configured

3. **CORS Errors**
   - Update CORS configuration in `render.yaml`
   - Add your app domains to `CORS_ORIGINS`

4. **Environment Variables Not Working**
   - Clear Expo cache: `npx expo start --clear`
   - Verify variables are prefixed with `EXPO_PUBLIC_`
   - Check if build includes the variables

5. **Favicon 500 Errors**
   - **Symptom**: `/favicon.ico` requests return 500 errors
   - **Check**: Verify favicon.ico exists in `backend/strapi/public/`
   - **Verify**: Path resolution uses `process.cwd()` not `__dirname`
   - **Note**: This is critical for TypeScript projects where code compiles to `dist/`
   - **Optional**: Set `PUBLIC_DIR` environment variable for custom paths

### Strapi v5 Specific Issues

6. **"Content type not found" errors in production**
   - **Symptom**: API endpoints return 404 or content type errors after deployment
   - **Cause**: Missing `index.ts` file in content-type directory
   - **Solution**:
     ```bash
     # Check locally first
     npm run build
     ls -la dist/api/*/content-types/*/index.js

     # If missing, add index.ts to the content-type folder:
     # backend/strapi/src/api/{api}/content-types/{type}/index.ts
     ```
   - See "Pre-Deployment Validation" section above for details

7. **Build fails on Render with TypeScript errors**
   - **Symptom**: Build process fails during `npm run build`
   - **Cause**: Missing TypeScript export files or compilation errors
   - **Solution**:
     1. Run `npm run build` locally to see the exact error
     2. Verify all content-types have `index.ts` files
     3. Verify all components have `.ts` export files
     4. Check for TypeScript syntax errors in your code
     5. Ensure `TRANSFER_TOKEN_SALT` is set in Render environment variables

8. **"Metadata for component not found" during startup**
   - **Symptom**: Strapi fails to start with component metadata errors
   - **Cause**: Component structure issues (nested folders or missing `.ts` files)
   - **Solution**:
     - Use flat structure: `src/components/{category}/{name}.json` ✓
     - NOT nested: `src/components/{category}/{name}/schema.json` ✗
     - Ensure every `.json` component has a matching `.ts` file
     - Rebuild and verify: `npm run build && ls -la dist/components/*/*`

9. **Plugin controller "handler not found" errors**
   - **Symptom**: Routes exist but return handler not found
   - **Cause**: Controller not registered in plugin extension file
   - **Solution**: Check `src/extensions/{plugin}/strapi-server.ts` registers the controller:
     ```typescript
     plugin.controllers = {
       ...plugin.controllers,
       controllerName: controllerFunction({ strapi }),
     };
     ```

10. **Policy not found errors**
   - **Symptom**: Routes fail with "Policy global::policy-name not found"
   - **Cause**: Policy file missing or incorrect reference
   - **Solution**:
     - Ensure policy is in `src/policies/{policy-name}.ts`
     - Reference as `global::policy-name` in routes (not just `policy-name`)
     - Verify policy export format matches Strapi v5 requirements

## Monitoring

### Render Dashboard

Monitor your services at:
- Web Service: `https://dashboard.render.com/web/srv-xxxxx`
- Database: `https://dashboard.render.com/database/dpg-xxxxx`

### Health Checks

The backend exposes these endpoints for monitoring:
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status (authenticated)

## Security Notes

1. **Never commit sensitive environment variables to Git**
2. **Use different credentials for development and production**
3. **Rotate security keys regularly**
4. **Enable 2FA on all service accounts**
5. **Monitor access logs regularly**

## Support

For deployment issues:
- Render Support: https://render.com/support
- Strapi Documentation: https://docs.strapi.io
- Expo Documentation: https://docs.expo.dev

## Next Steps

After successful deployment:
1. Configure custom domain (optional)
2. Set up SSL certificates (automatic on Render)
3. Configure backup strategy
4. Set up monitoring and alerts
5. Test payment flows thoroughly