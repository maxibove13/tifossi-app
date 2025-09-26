# Tifossi Strapi Backend

A production-ready Strapi v4 backend for the Tifossi e-commerce mobile application, built with PostgreSQL, MercadoPago payment integration, and cloud media storage.

## 🚀 Features

- **E-commerce Ready**: Complete product management with variants, categories, and inventory
- **Payment Integration**: MercadoPago integration for secure payments
- **User Management**: Extended user profiles with e-commerce specific fields
- **Order Management**: Complete order lifecycle with status tracking
- **Media Management**: Cloudinary integration for optimized media delivery
- **Security**: Rate limiting, CORS configuration, and security headers
- **Monitoring**: Health checks and structured logging
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
├── middlewares/           # Custom middlewares
│   ├── rate-limit.js      # Rate limiting
│   └── logging.js         # Enhanced logging
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

## 🔒 Security Features

- **Rate Limiting**: Configurable rate limits per IP
- **CORS**: Strict CORS configuration for mobile apps
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Joi validation for all inputs
- **Authentication**: JWT-based authentication
- **Password Hashing**: Bcrypt for password security

## 📈 Monitoring

### Health Checks

- **Basic**: `GET /api/health` - Simple health status
- **Detailed**: `GET /api/health/detailed` - Comprehensive health information

### Logging

- **Console Logging**: Colorized console output for development
- **File Logging**: Rotating file logs for production
- **Structured Logging**: JSON format with request correlation IDs

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

---

Built with ❤️ by the Tifossi Development Team