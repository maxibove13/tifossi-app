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
   - Update CORS configuration in `backend/strapi/render.yaml`
   - Add your app domains to `CORS_ORIGINS`

4. **Environment Variables Not Working**
   - Clear Expo cache: `npx expo start --clear`
   - Verify variables are prefixed with `EXPO_PUBLIC_`
   - Check if build includes the variables

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