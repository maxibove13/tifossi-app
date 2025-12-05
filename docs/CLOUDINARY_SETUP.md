# Cloudinary Setup Guide

## Prerequisites

You need a Cloudinary account with the following credentials:

- Cloud Name
- API Key
- API Secret

You can find these in your Cloudinary dashboard under **Dashboard** → **API Keys**.

## Local Development Setup

1. **Copy the environment template**:

   ```bash
   cd backend/strapi
   cp .env.example .env
   ```

2. **Add your Cloudinary credentials to `.env`**:

   ```env
   CLOUDINARY_NAME=your-cloud-name
   CLOUDINARY_KEY=your-api-key
   CLOUDINARY_SECRET=your-api-secret
   ```

3. **Restart Strapi** to load the new environment variables:
   ```bash
   npm run develop
   ```

## Production Setup (Render.com)

1. **Go to your Render Dashboard**
2. **Select your Strapi service**
3. **Navigate to Environment** tab
4. **Add the following environment variables**:
   - `CLOUDINARY_NAME` = your-cloud-name
   - `CLOUDINARY_KEY` = your-api-key
   - `CLOUDINARY_SECRET` = your-api-secret
   - `CLOUDINARY_FOLDER` = tifossi (optional, defaults to 'tifossi' if not set)

5. **Important**: Verify that `UPLOAD_PROVIDER` is set to `cloudinary` (should already be configured in render.yaml)

6. **Deploy** - Manually trigger a redeploy for the changes to take effect

## Verification

Once configured, Cloudinary will automatically handle:

- Product image uploads through Strapi admin panel
- Image optimization and transformations
- CDN delivery for fast loading

Test by uploading an image in **Strapi Admin** → **Media Library**.

## Cloudinary Settings (Recommended)

In your Cloudinary dashboard, configure:

1. **Upload presets** for consistent image processing
2. **Transformations** for automatic optimization
3. **Backup** settings for redundancy

## Troubleshooting

### Images Not Displaying (404 Errors)

If images upload successfully but don't display in Media Library:

1. **Check Environment Variables in Render Dashboard**:
   - Verify `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` are ALL set correctly
   - Verify `UPLOAD_PROVIDER=cloudinary` is set
   - Add `CLOUDINARY_FOLDER=tifossi` if missing
   - **Critical**: All three Cloudinary credentials must be present for the provider to initialize

2. **Inspect Image URLs**:
   - Click an asset in Media Library
   - Check if URL shows full Cloudinary path: `https://res.cloudinary.com/[cloud-name]/image/upload/...`
   - If URL shows only filename (e.g., "image.png"), Cloudinary provider is not active

3. **Check Browser Console**:
   - Open browser DevTools while in Media Library
   - Look for 404 errors or CSP violations
   - CSP should already be configured in `middlewares.ts` to allow `res.cloudinary.com`

4. **Redeploy After Fixing**:
   - After adding/correcting environment variables
   - Manually trigger a redeploy in Render dashboard
   - Monitor deployment logs for Cloudinary initialization messages

### General Upload Issues

If uploads fail completely:

1. Verify credentials are correct (no extra spaces)
2. Check Cloudinary dashboard for API usage/limits
3. Review Strapi logs in Render dashboard
4. Ensure your Cloudinary account is active

### After Fixing Configuration

Existing "broken" assets may need to be:
- Re-uploaded through Strapi Media Library
- Or have their URLs updated in the database (advanced)

## Security Notes

- Never commit `.env` files to git
- Use Render's environment variables for production
- Rotate API secrets periodically
- Set up IP restrictions in Cloudinary if needed
