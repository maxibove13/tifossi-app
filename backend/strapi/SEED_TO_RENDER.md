# Sync Seed Data to Render Strapi

## Quick Start

```bash
# Source the .env file and run with images
cd backend/strapi
source .env && export STRAPI_API_TOKEN && node scripts/import-seed-to-render.js --clean --images
```

## Command Options

```bash
node scripts/import-seed-to-render.js [options]

Options:
  --clean, -c          Delete ALL existing products before importing
  --images, -i         Upload product images to Cloudinary via Strapi
  --skip-existing, -s  Skip products that already exist (don't overwrite)
  --update, -u         Update existing entries instead of skipping them
  --cleanup            Delete categories/models in Strapi not in seed files
  --help, -h           Show help
```

### Common Usage Patterns

```bash
# Fresh sync (delete everything, re-upload images)
source .env && export STRAPI_API_TOKEN && node scripts/import-seed-to-render.js -c -i

# Add new products only (keep existing, no images)
source .env && export STRAPI_API_TOKEN && node scripts/import-seed-to-render.js -s

# Re-sync products without images (faster)
source .env && export STRAPI_API_TOKEN && node scripts/import-seed-to-render.js -c

# Update existing entries (categories, models, products)
source .env && export STRAPI_API_TOKEN && node scripts/import-seed-to-render.js --update
```

## Environment Setup

The script needs `STRAPI_API_TOKEN` from `backend/strapi/.env`:

```
STRAPI_API_TOKEN=your_token_here
```

**Important**: Use `source .env && export STRAPI_API_TOKEN` to pass the variable to Node.js.

### Getting an API Token

1. Go to: https://tifossi-strapi-backend.onrender.com/admin
2. Navigate: **Settings** → **API Tokens** → **Create new API Token**
3. Set **Token type**: `Full access`
4. Copy the token to `.env`

## What Gets Synced

| File | Content |
|------|---------|
| `seed/product-statuses.json` | highlighted, opportunity, recommended, new |
| `seed/categories.json` | medias, mochilas, remeras, etc. |
| `seed/product-models.json` | fast, classic, sport, etc. |
| `seed/store-locations.json` | pickup locations |
| `seed/products.json` | full product catalog |

Images are mapped in `scripts/import-seed-to-render.js` via `PRODUCT_IMAGE_MAP`.

## Troubleshooting

### Cloudinary Rate Limiting

Render's free tier has Cloudinary rate limits. If uploads fail with HTML errors:

1. Wait 5-10 minutes between upload batches
2. The script has 3s delays between uploads (10s after errors) to avoid rate limits
3. Use `-s` flag to resume without re-uploading existing products

### 404 on API calls

Wrong URL. The correct Strapi URL is:
```
https://tifossi-strapi-backend.onrender.com
```

Not `tifossi-strapi.onrender.com` (common mistake).

### 401 Unauthorized

- Token expired or invalid
- Create a new token in Strapi admin

### Products not showing in app

1. Check Strapi admin → Content Manager → Products
2. Verify products have `publishedAt` set (script does this automatically)
3. Check `frontImage` is linked (visible in product detail)

## Adding New Products

1. Add product to `seed/products.json`
2. Add image to `assets/images/products/`
3. Add mapping in `scripts/import-seed-to-render.js` → `PRODUCT_IMAGE_MAP`
4. Run sync with `--images` flag

## Image Mapping

Product images are defined in `PRODUCT_IMAGE_MAP` inside the import script:

```javascript
const PRODUCT_IMAGE_MAP = {
  'product-slug': 'image-filename.png',
  // ...
};
```

Color-specific gallery images use `COLOR_IMAGE_MAP`.
