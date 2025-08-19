# Strapi Seed Data

This directory contains seed data for initializing the Tifossi e-commerce Strapi backend with sample data that matches the existing mobile app structure.

## Seed Files

### Core Data
- `product-statuses.json` - All 8 product status labels with Spanish/English translations
- `categories.json` - Product categories including label-based and regular categories  
- `product-models.json` - Product model variants within each category
- `store-locations.json` - Physical store locations for pickup services

### Product Data
- `products.json` - Sample products with complete variant information (colors, sizes, etc.)

## Data Structure Compatibility

All seed data is designed to maintain 100% compatibility with existing TypeScript interfaces:

- **Product Status**: Matches `ProductStatus` enum values
- **Categories**: Includes both label categories and regular product categories
- **Products**: Contains all required fields from `Product` interface
- **Colors**: Structured to match `ProductColor` interface
- **Sizes**: Structured to match `ProductSize` interface
- **Addresses**: Follows Uruguay-specific address format

## Usage

1. **Initialize Strapi**: Set up Strapi instance with content types and components
2. **Import Statuses**: Load product statuses first (referenced by other entities)
3. **Import Categories**: Load categories after statuses are available
4. **Import Models**: Load product models with category references
5. **Import Locations**: Load store locations for pickup services
6. **Import Products**: Load products last with all relationships

## Data Validation

Each JSON file includes:
- Required field validation
- Proper enum values
- Consistent slug formatting
- Valid color hex codes
- Proper price formatting (decimals)
- Complete relationship references

## Relationships

The seed data maintains proper relationships:
- Products → Categories (via slug)
- Products → Models (via slug)  
- Products → Statuses (via name array)
- Models → Categories (via categorySlug)
- Orders → Store Locations (when shipping method is pickup)

## Customization

To customize the seed data:

1. **Add Categories**: Add new entries to `categories.json`
2. **Add Models**: Add new entries to `product-models.json` with proper categorySlug
3. **Add Products**: Add new entries to `products.json` with proper references
4. **Add Statuses**: Add new status types to `product-statuses.json`

## Image Placeholders

The seed data references placeholder image paths that should be replaced with actual media uploads in Strapi:

- Product images: Upload to Strapi media library
- Category icons: Upload to Strapi media library  
- Store location images: Upload to Strapi media library

## Migration Notes

When migrating from existing data:
- Map existing product IDs to new Strapi IDs
- Update image references to Strapi media URLs
- Ensure status mappings are consistent
- Validate all relationship references