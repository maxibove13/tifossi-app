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

5. **Deploy** - Render will automatically redeploy with the new variables

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

If uploads fail:
1. Verify credentials are correct (no extra spaces)
2. Check Cloudinary dashboard for API usage/limits
3. Review Strapi logs: `backend/strapi/logs/`
4. Ensure your Cloudinary account is active

## Security Notes
- Never commit `.env` files to git
- Use Render's environment variables for production
- Rotate API secrets periodically
- Set up IP restrictions in Cloudinary if needed