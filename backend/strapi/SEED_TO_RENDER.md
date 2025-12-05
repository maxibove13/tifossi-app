# Populate Render Database with Seed Data

## Quick Start

```bash
cd backend/strapi
STRAPI_API_TOKEN=your_token_here npm run seed:render
```

## Step-by-Step Instructions

### 1. Create an API Token in Strapi Admin

1. Go to your Render Strapi admin: https://tifossi-strapi-backend.onrender.com/admin
2. Log in with your admin credentials
3. Navigate to: **Settings** → **API Tokens** → **Create new API Token**
4. Configure the token:
   - **Name**: `Seed Import Token`
   - **Token type**: `Full access` or `Custom` with these permissions:
     - Products: `create`, `find`
     - Categories: `create`, `find`
     - Product Models: `create`, `find`
     - Product Statuses: `create`, `find`
     - Store Locations: `create`, `find`
   - **Token duration**: Can be temporary (just for the import)
5. Click **Save** and **copy the token** (you won't see it again!)

### 2. Run the Import Script

```bash
cd backend/strapi
STRAPI_API_TOKEN=your_copied_token npm run seed:render
```

The script will:
1. ✓ Import product statuses (NEW, SALE, FEATURED, etc.)
2. ✓ Import categories (Medias, Mochilas, etc.)
3. ✓ Import product models (Fast, Classic, Sport, etc.)
4. ✓ Import store locations (Montevideo Centro, Punta del Este, etc.)
5. ✓ Import products from `seed/products.json`

### 3. Verify Import

After the import completes:

1. Check in Strapi Admin: https://tifossi-strapi-backend.onrender.com/admin
2. Go to **Content Manager** → **Products**
3. You should see all the imported products

### 4. Test in Mobile App

Reload your mobile app - products should now appear in the Tienda screen!

## Troubleshooting

### "STRAPI_API_TOKEN environment variable is required"
- Make sure you created the API token and copied it correctly
- The token should be a long string starting with letters/numbers

### "API request failed: 401"
- Your token is invalid or expired
- Create a new token in Strapi admin
- Make sure the token has the correct permissions

### "API request failed: 403"
- Your token doesn't have the required permissions
- Recreate the token with "Full access" or add the required permissions

### Products already exist
- The script checks for duplicates and skips them
- To re-import, delete the existing data in Strapi admin first

## What Gets Imported

From the `seed/` directory:
- **product-statuses.json**: 8 status types (NEW, SALE, FEATURED, etc.)
- **categories.json**: Product categories
- **product-models.json**: Product model variants
- **store-locations.json**: Physical store locations
- **products.json**: Complete product catalog with colors, sizes, prices

## Notes

- The script is idempotent - running it multiple times won't create duplicates
- Products are published immediately (publishedAt is set to current time)
- Images need to be uploaded separately to Cloudinary/Strapi media library
- You can safely delete the API token after import is complete
