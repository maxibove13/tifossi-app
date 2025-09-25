# GitHub Secrets Setup for Deployment

This document lists all GitHub Secrets required for the automated deployment workflow.

## Required GitHub Secrets

### 1. Render Configuration
- `RENDER_API_KEY` - Your Render API key from https://dashboard.render.com/account/api-keys
- `RENDER_SERVICE_ID_PROD` - Production service ID (e.g., srv-xxxxxxxxxxxxx)
- `RENDER_SERVICE_ID_STAGING` - Staging service ID (optional)
- `RENDER_SERVICE_ID_DEV` - Development service ID (optional)

### 2. Database
- `DATABASE_URL` - PostgreSQL connection string from Render

### 3. Strapi Core (CRITICAL - Generate secure values!)
```bash
# Generate secure keys with:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
- `APP_KEYS` - Comma-separated list of 4 keys (e.g., key1,key2,key3,key4)
- `JWT_SECRET` - JWT secret for authentication
- `API_TOKEN_SALT` - Salt for API tokens
- `ADMIN_JWT_SECRET` - JWT secret for admin panel
- `TRANSFER_TOKEN_SALT` - Salt for transfer tokens

### 4. Cloudinary (Image Storage)
- `CLOUDINARY_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_KEY` - Cloudinary API key
- `CLOUDINARY_SECRET` - Cloudinary API secret

### 5. MercadoPago (Payment Processing)
- `MERCADO_PAGO_ACCESS_TOKEN` - Production access token
- `MERCADO_PAGO_PUBLIC_KEY` - Production public key
- `MERCADO_PAGO_WEBHOOK_SECRET` - Webhook signature secret
- `MP_TEST_ACCESS_TOKEN` - Test/sandbox access token (for tests)
- `MP_TEST_PUBLIC_KEY` - Test public key (for tests)

### 6. Optional Services
- `REDIS_URL` - Redis connection URL (if using Redis)
- `SENTRY_DSN` - Sentry error tracking DSN
- `WEBHOOK_SECRET` - General webhook secret

### 7. Email Configuration
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password

### 8. Notifications (Optional)
- `SLACK_WEBHOOK_URL` - Slack webhook for deployment notifications

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its name and value

## Priority Order

Add secrets in this order:

### Phase 1: Minimum Required for Deployment
1. `RENDER_API_KEY`
2. `RENDER_SERVICE_ID_PROD`
3. `DATABASE_URL`
4. All Strapi core secrets (APP_KEYS, JWT_SECRET, etc.)

### Phase 2: Required for Full Functionality
1. Cloudinary credentials (for image uploads)
2. MercadoPago credentials (for payments)

### Phase 3: Optional Enhancements
1. Email configuration
2. Redis URL
3. Sentry DSN
4. Slack webhook

## Verification

After adding all secrets, you can verify they're configured by:
1. Running the deployment workflow manually
2. Checking the workflow logs for successful environment variable updates
3. Verifying the health check passes

## Security Notes

- **Never commit secrets to the repository**
- **Rotate secrets periodically** (every 90 days recommended)
- **Use different secrets for production vs staging**
- **Generate strong, random values** for all keys and salts
- **Restrict access** to GitHub Secrets to authorized team members only

## Example Values (DO NOT USE IN PRODUCTION)

```yaml
# Example format only - generate your own secure values!
APP_KEYS: "key1_64chars_hex,key2_64chars_hex,key3_64chars_hex,key4_64chars_hex"
JWT_SECRET: "64_character_hex_string_here"
DATABASE_URL: "postgres://user:password@host:port/database?ssl=true"
CLOUDINARY_NAME: "your-cloud-name"
MERCADO_PAGO_ACCESS_TOKEN: "APP-USR-xxxxxxxxxx"
```

## Troubleshooting

If deployment fails:
1. Check all required secrets are set
2. Verify Render API key has correct permissions
3. Ensure service IDs match your Render dashboard
4. Check workflow logs for specific error messages
5. Verify database URL includes SSL parameter