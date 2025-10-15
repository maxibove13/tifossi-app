# Environment Variables Setup Guide

## Overview

This guide explains how to properly configure environment variables for the Tifossi app across different deployment scenarios.

## Required Environment Variables

### Critical Variables (App won't start without these in production)

```bash
# Backend API URL (REQUIRED)
EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com

# Firebase Configuration (REQUIRED for authentication)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# MercadoPago (REQUIRED for payments)
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your-public-key
```

## Configuration Methods

### 1. Local Development (.env file)

Create a `.env` file in the project root:

```bash
# .env or .env.local
EXPO_PUBLIC_API_BASE_URL=http://localhost:1337
EXPO_PUBLIC_FIREBASE_API_KEY=dev-api-key
# ... other variables
```

**Note**: In development, the app will warn but continue if API_BASE_URL is missing, defaulting to localhost:1337.

### 2. GitHub Secrets (for CI/CD)

Add these secrets in your GitHub repository settings:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `EXPO_PUBLIC_API_BASE_URL` - Your Render backend URL
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `MERCADOPAGO_PUBLIC_KEY`
   - `EXPO_TOKEN` - Your Expo access token

### 3. EAS Build (Expo Application Services)

#### Option A: Using GitHub Actions (Recommended)

The GitHub Actions workflow automatically injects secrets:

```yaml
# .github/workflows/eas-build.yml
- name: Create environment file
  run: |
    cat > .env.production << EOF
    EXPO_PUBLIC_API_BASE_URL=${{ secrets.EXPO_PUBLIC_API_BASE_URL }}
    # ... other variables
    EOF
```

Trigger a build:

```bash
# Manual trigger from GitHub Actions UI
# OR
# Push a tag
git tag v1.0.0
git push origin v1.0.0
```

#### Option B: Using EAS Secrets

Set secrets directly in EAS:

```bash
# Set secret for all builds
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value "https://tifossi-strapi-backend.onrender.com"

# Set for specific environment
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value "https://tifossi-strapi-backend.onrender.com" --scope project --env production
```

#### Option C: Using eas.json

You can also specify environment variables directly in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://tifossi-strapi-backend.onrender.com",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  }
}
```

**Warning**: Don't commit sensitive values to eas.json. Use EAS secrets or GitHub secrets instead.

### 4. Manual EAS Build with Environment Variables

```bash
# Build with environment variables from command line
eas build --platform ios --profile production \
  --env EXPO_PUBLIC_API_BASE_URL="https://tifossi-strapi-backend.onrender.com"
```

## Verification

### 1. Check Configuration Status

The app will log its configuration on startup:

```
🚀 Initializing Tifossi App...
📱 Environment: { ... }
✅ API configured: https://tifossi-strapi-backend.onrender.com
```

### 2. Fail-Fast Behavior

In production/staging, the app will:

- **FAIL TO START** if `EXPO_PUBLIC_API_BASE_URL` is not set
- Show error: `API_URL_NOT_CONFIGURED: Missing required environment variable`

In development, the app will:

- Show a warning but continue with `http://localhost:1337`

### 3. Runtime Validation

All backend service calls use the centralized configuration:

```typescript
// All these services use endpoints.baseUrl
-tokenManager.ts -
  mercadoPago.ts -
  cartService.ts -
  orderService.ts -
  addressService.ts -
  httpClient.ts;
```

## Troubleshooting

### Issue: App crashes with "API_URL_NOT_CONFIGURED"

**Solution**: Ensure `EXPO_PUBLIC_API_BASE_URL` is set:

```bash
export EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com
npx expo start --clear
```

### Issue: GitHub Actions build fails

**Solution**: Check that all required secrets are set in GitHub:

```bash
# These must be set in GitHub Secrets:
EXPO_PUBLIC_API_BASE_URL
EXPO_TOKEN
FIREBASE_API_KEY
# ... etc
```

### Issue: EAS build doesn't pick up environment variables

**Solution**: Use one of these methods:

1. EAS Secrets: `eas secret:create`
2. GitHub Actions workflow (recommended)
3. Add to eas.json (not for sensitive data)

### Issue: Different URL for staging vs production

**Solution**: Use build profiles:

```json
// eas.json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://staging-api.tifossi.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://tifossi-strapi-backend.onrender.com"
      }
    }
  }
}
```

## Best Practices

1. **Never commit sensitive values** to version control
2. **Use different values** for development, staging, and production
3. **Validate early**: The app validates configuration on startup
4. **Fail fast**: In production, missing config causes immediate failure
5. **Use GitHub Secrets** for CI/CD automation
6. **Document all required variables** in `.env.example`

## CI/CD Flow

1. **Developer pushes code** → GitHub Actions runs tests
2. **Tag is created** → GitHub Actions triggers EAS build
3. **GitHub Actions** injects secrets from GitHub Secrets
4. **EAS builds** the app with injected environment variables
5. **App validates** configuration on startup
6. **If validation fails** → App shows clear error message

This ensures that:

- No hardcoded URLs in the codebase
- Production always uses the correct backend URL
- Configuration errors are caught early
- Secrets are never exposed in code
