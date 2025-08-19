# Tifossi Backend Infrastructure

This directory contains all the infrastructure configurations, templates, and deployment scripts for the Tifossi Expo backend migration from local mock data to Strapi + MercadoPago, deployed on Render.

## Directory Structure

```
infrastructure/
├── deployment/           # Deployment scripts
│   └── render-deploy.sh      # Render deployment automation
├── docker/              # Docker configurations (created when needed)
├── templates/           # Template files for different environments
│   ├── .env.development.template
│   ├── .env.staging.template
│   ├── .env.production.template
│   ├── docker-compose.yml
│   ├── docker-compose.development.yml
│   ├── docker-compose.production.yml
│   ├── Dockerfile
│   └── .dockerignore
└── README.md           # This file
```

## Quick Start Guide

### 1. Environment Setup

#### For Development
```bash
# Copy environment template
cp infrastructure/templates/.env.development.template backend/.env

# Edit the .env file with your actual values
nano backend/.env

# Generate secret keys (run these commands and update .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### For Staging/Production
Environment variables should be configured in your Render dashboard.

### 2. Local Development with Docker

```bash
# Copy docker-compose files to project root
cp infrastructure/templates/docker-compose.yml .
cp infrastructure/templates/docker-compose.development.yml .
cp infrastructure/templates/Dockerfile infrastructure/docker/

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d

# View logs
docker-compose logs -f strapi

# Access services:
# - Strapi: http://localhost:1337
# - Database Admin: http://localhost:8080
# - Redis Admin: http://localhost:8081
# - MailHog (email testing): http://localhost:8025
```

### 3. Deployment

#### Render Deployment
```bash
# Set your Render API key
export RENDER_API_KEY=your_render_api_key

# Deploy to staging
./infrastructure/deployment/render-deploy.sh staging srv-your-staging-service-id

# Deploy to production
./infrastructure/deployment/render-deploy.sh production srv-your-production-service-id
```

## Environment Configuration

### Development Environment
- **Purpose**: Local development and testing
- **Database**: PostgreSQL (Docker container)
- **Cache**: Redis (Docker container)
- **Email**: MailHog for testing
- **Debug**: Enabled with detailed logging
- **Features**: All debug tools enabled

### Staging Environment
- **Purpose**: Integration testing and client review
- **Platform**: Render
- **Database**: Managed PostgreSQL
- **Payments**: MercadoPago sandbox
- **Features**: Production-like with some debug features

### Production Environment
- **Purpose**: Live application
- **Platform**: Render
- **Database**: Managed PostgreSQL with backups
- **Payments**: MercadoPago production
- **Security**: Full security headers and rate limiting
- **Monitoring**: Sentry integration

## Required Environment Variables

### Critical Variables (Required for all environments)
```bash
# Strapi Core
APP_KEYS=comma,separated,keys,here
JWT_SECRET=your-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret
API_TOKEN_SALT=your-api-token-salt
TRANSFER_TOKEN_SALT=your-transfer-token-salt

# Database (automatically provided by Render)
DATABASE_URL=postgresql://user:pass@host:port/db

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=your-access-token
MERCADO_PAGO_PUBLIC_KEY=your-public-key
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret

# Media Storage
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret
```

### Environment-Specific Variables

#### Development
```bash
NODE_ENV=development
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
CORS_ORIGINS=http://localhost:8081,exp://localhost:8081
RATE_LIMIT_ENABLED=false
```

#### Staging
```bash
NODE_ENV=staging
CORS_ORIGINS=https://staging.tifossi.app,exp://staging.tifossi.app
RATE_LIMIT_ENABLED=true
MERCADO_PAGO_SANDBOX=true
```

#### Production
```bash
NODE_ENV=production
CORS_ORIGINS=https://tifossi.app,https://www.tifossi.app
RATE_LIMIT_ENABLED=true
MERCADO_PAGO_SANDBOX=false
SECURITY_HEADERS_ENABLED=true
```

## Docker Services

### Core Services
- **strapi**: Main Strapi CMS application
- **postgres**: PostgreSQL database
- **redis**: Redis cache for sessions and caching

### Development Services (dev profile)
- **adminer**: Database administration interface
- **redis-commander**: Redis management interface
- **mailhog**: Email testing service

### Production Services (prod profile)
- **nginx**: Reverse proxy and SSL termination
- **backup**: Automated database backups
- **fluentd**: Log aggregation (optional)

## Deployment Scripts Features

### Render Deployment Script
- ✅ API-based deployment
- ✅ Environment validation
- ✅ Service health monitoring
- ✅ Build log access
- ✅ Post-deployment testing
- ✅ Notification support

## Security Considerations

### Development
- Local secrets (not for production use)
- Debug features enabled
- Permissive CORS for local testing
- No rate limiting

### Staging
- Environment-specific secrets
- Basic security headers
- Moderate rate limiting
- MercadoPago sandbox mode

### Production
- Strong, unique secrets
- Full security headers (HSTS, CSP)
- Strict rate limiting
- SSL/TLS enforcement
- Error monitoring (Sentry)
- Backup encryption

## Troubleshooting

### Common Issues

#### Docker Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Verify environment variables
docker-compose exec strapi env | grep DATABASE
```

#### Port Conflicts
```bash
# Find processes using ports
netstat -tulpn | grep :1337

# Kill process
sudo kill -9 $(sudo lsof -t -i:1337)
```

#### Deployment Script Errors
```bash
# Check dependencies
docker --version
npm --version
curl --version

# Verify Render API access (if using API)
curl -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/services
```

### Health Check URLs
- **Development**: http://localhost:1337/api/health
- **Staging**: https://staging-api.tifossi.app/api/health
- **Production**: https://api.tifossi.app/api/health

## Monitoring and Logs

### Local Development
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f strapi
docker-compose logs -f postgres
```

### Render
- Check logs in Render dashboard
- Build logs available during deployment
- Runtime logs available in service dashboard

## Backup and Recovery

### Development
```bash
# Create database backup
docker-compose exec postgres pg_dump -U strapi tifossi_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U strapi -d tifossi_dev < backup.sql
```

### Production
- Automated daily backups (Render managed)
- Point-in-time recovery available
- Media assets backed up to Cloudinary
- Configuration backed up in git repository

## Contributing

When adding new infrastructure:

1. Update relevant template files
2. Test locally with Docker
3. Update documentation
4. Test deployment scripts
5. Update this README

## Support

For infrastructure-related issues:

1. Check health endpoints
2. Review deployment logs
3. Verify environment variables
4. Check service status in platform dashboard
5. Review error monitoring (Sentry)

## Next Steps

After setting up infrastructure:

1. Set up Strapi content types (see `/docs/backend/schemas/`)
2. Configure MercadoPago integration (see `/docs/backend/payment/`)
3. Implement authentication system (see `/docs/backend/auth/`)
4. Migrate existing data (see `/docs/backend/migration/`)
5. Set up monitoring and alerts