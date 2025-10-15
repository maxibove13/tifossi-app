# Tifossi Strapi Backend

A production-ready Strapi v5 backend for the Tifossi e-commerce mobile application, built with PostgreSQL, MercadoPago payment integration, and cloud media storage.

## 🚀 Features

- **E-commerce Ready**: Complete product management with variants, categories, and inventory
- **Payment Integration**: MercadoPago integration for secure payments
- **User Management**: Extended user profiles with e-commerce specific fields
- **Order Management**: Complete order lifecycle with status tracking
- **Media Management**: Cloudinary integration for optimized media delivery
- **Security**: CORS configuration and security headers
- **Monitoring**: Health checks
- **Scalability**: Redis caching and production-ready configuration

## 📋 Requirements

- Node.js 18.x or 20.x
- PostgreSQL 12+
- Redis (optional, for caching)
- Cloudinary account (for media storage)
- MercadoPago account (for payments)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend/strapi
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following essential environment variables:

```env
# Database
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://username:password@localhost:5432/tifossi_dev

# Strapi Secrets (generate secure values for production)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=TEST-your-access-token
MERCADO_PAGO_PUBLIC_KEY=TEST-your-public-key
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret

# Media Storage
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Generate Secure Keys

For production, generate secure keys:

```bash
# Generate APP_KEYS (4 keys, comma-separated)
node -e "console.log(Array(4).fill().map(() => require('crypto').randomBytes(16).toString('base64')).join(','))"

# Generate secrets (64 characters each)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE tifossi_dev;
CREATE USER strapi WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE tifossi_dev TO strapi;
```

### 5. Start Development Server

```bash
# Development mode with auto-reload
npm run develop

# Production mode
npm run build
npm run start
```

## 📊 Database Seeding

Populate the database with initial data:

```bash
# Seed essential data (categories, statuses, locations)
npm run db:seed

# Include sample products
SEED_SAMPLE_PRODUCTS=true npm run db:seed
```

## 🏗️ Project Structure

```
src/
├── api/                    # API endpoints
│   ├── category/          # Product categories
│   ├── product/           # Products with variants
│   ├── product-model/     # Product models (fast, classic, sport)
│   ├── product-status/    # Product status labels
│   ├── order/             # Order management
│   ├── store-location/    # Physical store locations
│   └── health/            # Health check endpoints
├── components/            # Reusable components
│   ├── product/           # Product-related components
│   ├── shared/            # Shared components (address, SEO)
│   ├── order/             # Order-related components
│   └── store/             # Store-related components
├── extensions/            # Plugin extensions
│   └── users-permissions/ # Extended user model
└── services/              # Business logic services
```

## 🔧 Configuration

### Content Types

#### Core Entities

- **Product**: E-commerce products with variants, media, and relationships
- **Category**: Product categorization system
- **Product Model**: Model variants (fast, classic, sport)
- **Product Status**: Status labels (new, sale, featured, etc.)
- **Order**: Complete order management
- **Store Location**: Physical store locations for pickup
- **User**: Extended user profiles with e-commerce fields

#### Components

- **Product Components**: Colors, sizes, dimensions, short descriptions
- **Shared Components**: Address, SEO metadata
- **Order Components**: Order items
- **Store Components**: Operating hours

### ⚠️ CRITICAL: Strapi v5 File Structure Requirements

**Every content-type and component MUST have TypeScript export files** for compilation to work correctly.

#### Content-Type Structure (REQUIRED)

Each content-type MUST have BOTH `schema.json` AND `index.ts`:

```
src/api/{api-name}/content-types/{type-name}/
├── schema.json          # Schema definition
└── index.ts            # TypeScript export (REQUIRED for v5)
```

**index.ts format**:

```typescript
import schema from './schema.json';

export default {
  schema,
};
```

**Why this matters**: Without the `index.ts` file, TypeScript will not compile the content-type to the `dist/` folder, causing **deployment failures** with errors like "Content type not found" or 404 errors on API endpoints.

#### Component Structure (REQUIRED)

Each component MUST have BOTH `.json` AND `.ts` files in a **FLAT** structure:

```
src/components/{category}/{component-name}.json    # Schema
src/components/{category}/{component-name}.ts      # TypeScript export (REQUIRED for v5)
```

**component.ts format**:

```typescript
import schema from './{component-name}.json';

export default {
  schema,
};
```

**Do NOT nest** components in subdirectories like `{component-name}/schema.json` - this is not supported in Strapi v5.

#### Validation

To verify your setup is correct:

```bash
# Build the project
npm run build

# Verify content-types compiled to dist/
ls -la dist/api/*/content-types/*/index.js

# Verify components compiled to dist/
ls -la dist/components/*/*

# All content-types and components should have compiled .js files
```

If any content-types or components are missing from `dist/`, check that their `index.ts` or `.ts` files exist and follow the correct format.

### API Endpoints

#### Products

```
GET    /api/products              # List products with filters
GET    /api/products/:id          # Get single product
POST   /api/products              # Create product (admin)
PUT    /api/products/:id          # Update product (admin)
DELETE /api/products/:id          # Delete product (admin)
```

#### Categories

```
GET    /api/categories            # List categories
GET    /api/categories/:id        # Get category with products
```

#### Orders

```
GET    /api/orders                # User's orders
POST   /api/orders                # Create order
GET    /api/orders/:id            # Get order details
PUT    /api/orders/:id            # Update order status
```

#### Health Checks

```
GET    /api/health                # Basic health check
GET    /api/health/detailed       # Detailed health information
```

## 🚀 Deployment

### Render Deployment

1. Connect your repository to Render
2. Use the provided `render.yaml` configuration (located at repository root)
3. Set up environment variables in Render dashboard
4. Deploy using the Render dashboard

### Environment Variables for Production

Essential variables for production deployment:

```env
# Automatically configured by Render
DATABASE_URL=postgres://...
PORT=10000

# Configure these in Render dashboard
CLOUDINARY_NAME=your-production-cloudinary
CLOUDINARY_KEY=your-production-key
CLOUDINARY_SECRET=your-production-secret
MERCADO_PAGO_ACCESS_TOKEN=your-production-token
MERCADO_PAGO_PUBLIC_KEY=your-production-key
SMTP_HOST=your-email-provider
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
```

### Manual Deployment

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Start production server
NODE_ENV=production npm run start
```

### 🚨 Common Deployment Issues & Solutions

#### Issue 1: "Content type not found" in production

**Symptom**: API endpoints return 404 or "Content type not found" errors after deployment

**Cause**: Missing `index.ts` file in content-type directory (Strapi v5 requirement)

**Solution**:

1. Check that every content-type has `index.ts` alongside `schema.json`:

   ```bash
   find src/api -name "schema.json" | while read schema; do
     dir=$(dirname "$schema")
     if [ ! -f "$dir/index.ts" ]; then
       echo "Missing index.ts in: $dir"
     fi
   done
   ```

2. Create the missing `index.ts` file:

   ```typescript
   import schema from './schema.json';

   export default {
     schema,
   };
   ```

3. Rebuild and verify compilation:
   ```bash
   npm run build
   ls -la dist/api/*/content-types/*/index.js
   ```

#### Issue 2: "Policy not found" errors

**Symptom**: API routes fail with "Policy global::policy-name not found"

**Cause**: Policy file missing or incorrectly located

**Solution**:

1. Ensure policy files are in `src/policies/{policy-name}.ts`
2. Reference policies in routes as `global::policy-name` (not just `policy-name`)
3. Verify policy export format:
   ```typescript
   export default (policyContext, config, { strapi }) => {
     return !!policyContext.state.user;
   };
   ```

#### Issue 3: Plugin controller not registered

**Symptom**: Routes exist but handler not found (e.g., "Handler not found 'controller.action'")

**Cause**: Controller not registered in plugin extension file

**Solution**: In plugin extension file (`src/extensions/{plugin}/strapi-server.ts`):

```typescript
import customController from './controllers/custom';

export default (plugin: Plugin) => {
  // Add controller to plugin object
  plugin.controllers = {
    ...plugin.controllers,
    custom: customController({ strapi }),
  };

  return plugin;
};
```

#### Issue 4: Build fails on Render

**Symptom**: Build process fails during `npm run build`

**Solution**:

1. Run `npm run build` locally first to identify issues
2. Check build logs for specific TypeScript errors
3. Verify all content-types have `index.ts` files
4. Ensure environment variables are set in Render dashboard (especially `TRANSFER_TOKEN_SALT`)

#### Issue 5: Component metadata errors

**Symptom**: "Metadata for component not found" during Strapi startup

**Cause**: Component missing TypeScript export file or nested in subdirectory

**Solution**:

1. Ensure components use FLAT structure:

   ```
   src/components/{category}/{component-name}.json  ✓ Correct
   src/components/{category}/{component-name}/schema.json  ✗ Wrong
   ```

2. Create `.ts` export for each component:

   ```typescript
   import schema from './{component-name}.json';

   export default {
     schema,
   };
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run E2E tests
npm run test:e2e
```

### Testing with PostgreSQL (DATABASE_URL)

To test the production database configuration locally (using `DATABASE_URL` as used on Render):

#### 1. Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify PostgreSQL is running
docker-compose ps
```

#### 2. Use .env.postgres configuration

```bash
# Copy the PostgreSQL test environment
cp .env.postgres .env

# Start Strapi in development mode
npm run develop
```

The `.env.postgres` file includes:

- `DATABASE_URL` (connection string format used on Render)
- `DATABASE_SSL=false` (for local testing)
- All individual DB parameters as fallback

This configuration tests the exact same code path that runs in production on Render.

#### 3. Verify Database Connection

Check the Strapi startup logs for:

```
✔ Connected to database
✔ Database migrations completed
```

Visit `http://localhost:1337/api/health` to confirm the health check passes.

#### 4. Clean Up

```bash
# Stop PostgreSQL container
docker-compose down

# Remove volumes (optional - removes all data)
docker-compose down -v
```

### Troubleshooting Database Connection

If you encounter database connection errors:

1. **Check PostgreSQL is running**:

   ```bash
   docker-compose logs postgres
   ```

2. **Verify DATABASE_URL format**:
   - Format: `postgresql://username:password@host:port/database`
   - Example: `postgresql://strapi:strapi123@localhost:5432/tifossi_dev`

3. **Test connection directly**:

   ```bash
   psql "postgresql://strapi:strapi123@localhost:5432/tifossi_dev"
   ```

4. **Enable debug logging**:
   ```env
   DATABASE_DEBUG=true
   LOG_LEVEL=debug
   ```

## 🔒 Security Features

- **Rate Limiting**: Handled at infrastructure level (Render, Cloudfront)
- **CORS**: Strict CORS configuration for mobile apps
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Joi validation for all inputs
- **Authentication**: JWT-based authentication
- **Password Hashing**: Bcrypt for password security

### Admin Authentication

**Method**: Email + Password (no SMTP required)

The Strapi admin panel uses email/password authentication without requiring email configuration. This pragmatic approach prioritizes deployment simplicity:

- **Email Plugin**: Conditional (only loads when `SMTP_HOST` is set)
- **Password Reset**: Manual process (see ADMIN_AUTH.md)
- **Mobile Users**: Authenticate via Firebase (separate system)

**Key Points:**

- Admins can log in immediately without SMTP setup
- Password reset requires manual database intervention
- Email functionality can be enabled later by configuring SMTP credentials

For detailed information on:

- Creating admin users
- Resetting forgotten passwords
- Enabling email functionality
- Security best practices

See **[ADMIN_AUTH.md](./ADMIN_AUTH.md)** for the complete guide.

## 📈 Monitoring

### Health Checks

- **Basic**: `GET /api/health` - Simple health status
- **Detailed**: `GET /api/health/detailed` - Comprehensive health information

### Logging

Strapi includes built-in logging for request/response tracking and error monitoring. Configure logging level via the `LOG_LEVEL` environment variable if needed.

### Error Tracking

Configure Sentry for production error tracking:

```env
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

## 🛡️ Best Practices

### Security

- Use environment variables for all secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Use strong, unique passwords
- Regular security audits

### Performance

- Enable Redis caching in production
- Use Cloudinary for media optimization
- Configure proper database indexes
- Monitor memory and CPU usage

### Development

- Use TypeScript for better code quality
- Follow ESLint rules
- Write comprehensive tests
- Document API changes

## 📚 API Documentation

When `API_DOCUMENTATION_ENABLED=true`, visit `/documentation` for interactive API documentation.

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes following coding standards
3. Add/update tests as needed
4. Submit pull request with detailed description

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Email: dev@tifossi.com
- Documentation: Check the `/docs` directory
- Issues: Create GitHub issues for bug reports

## 🔄 Version History

- **v1.0.0** - Initial Strapi v4 backend with PostgreSQL
- **v1.1.0** - MercadoPago integration
- **v1.2.0** - Enhanced user profiles and order management
- **v1.3.0** - Production deployment and monitoring
- **v2.0.0** - Strapi v5 migration with TypeScript-first architecture
  - Added required `index.ts` files to all content-types and components
  - Implemented proper plugin extension pattern for Firebase authentication
  - Enhanced CI/CD pipeline with build validation
  - Improved error handling and documentation

---

Built with ❤️ by the Tifossi Development Team
