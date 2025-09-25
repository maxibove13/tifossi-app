# GitHub Actions CI/CD Pipeline

## Overview

The Tifossi project uses a unified CI/CD pipeline (`.github/workflows/cicd.yml`) that handles all continuous integration and deployment tasks in a single, comprehensive workflow.

## Workflow Structure

### Triggers
- **Push to main/develop branches**: Runs full CI/CD pipeline
- **Pull requests to main**: Runs quality checks and tests
- **Git tags (v*)**: Triggers mobile app builds
- **Manual dispatch**: Run specific jobs on demand

### Jobs

#### 1. Quality Checks (Always runs)
- Frontend linting and type checking
- Unit test execution
- Backend linting
- Code coverage reporting
- **Required for**: All other jobs

#### 2. Payment Tests (Conditional)
- MercadoPago integration tests
- Webhook validation
- **Runs when**: Payment-related files change or manual trigger
- **Requires**: MercadoPago sandbox credentials in GitHub Secrets

#### 3. Build Backend
- Strapi production build verification
- Dependency installation
- Build artifact verification
- **Runs when**: Push to main/develop or manual trigger
- **Required for**: Backend deployment

#### 4. Deploy Backend (Production only)
- Deploys Strapi to Render.com
- Updates environment variables
- Health check verification
- **Runs when**: Push to main branch or manual trigger
- **Requires**: Render API credentials

#### 5. Build Mobile
- EAS builds for iOS/Android
- App store submission (on tags)
- **Runs when**: Git tags or manual trigger
- **Requires**: Expo credentials

#### 6. Notifications
- Slack notifications (optional)
- GitHub workflow summary
- **Runs**: Always (after all jobs)

## Manual Workflow Dispatch

The workflow can be triggered manually with specific options:

```yaml
Job Options:
- all: Run entire pipeline
- quality-checks: Only run tests and linting
- payment-tests: Test payment integration
- build-backend: Build Strapi backend
- deploy-backend: Deploy to Render
- build-mobile: Build mobile apps

Environment Options:
- production (default)
- staging
- development

Mobile Platform:
- all (default)
- ios
- android

Build Profile:
- production (default)
- preview
- development
```

## Required GitHub Secrets

### Core Secrets
- `NODE_ENV`: Environment (production/staging/development)

### Render Deployment
- `RENDER_API_KEY`: Render.com API key
- `RENDER_SERVICE_ID_PROD`: Production service ID
- `RENDER_SERVICE_ID_STAGING`: Staging service ID (optional)
- `RENDER_SERVICE_ID_DEV`: Development service ID (optional)

### Strapi Configuration
- `STRAPI_APP_KEYS`: Comma-separated app keys
- `STRAPI_API_TOKEN_SALT`: API token salt
- `STRAPI_ADMIN_JWT_SECRET`: Admin JWT secret
- `STRAPI_TRANSFER_TOKEN_SALT`: Transfer token salt
- `STRAPI_JWT_SECRET`: JWT secret

### Cloudinary
- `CLOUDINARY_NAME`: Cloud name (dbkt9lqw2)
- `CLOUDINARY_KEY`: API key
- `CLOUDINARY_SECRET`: API secret

### MercadoPago
- `MP_ACCESS_TOKEN`: Production access token
- `MP_PUBLIC_KEY`: Production public key
- `MP_WEBHOOK_SECRET`: Webhook secret
- `MP_TEST_ACCESS_TOKEN`: Sandbox access token (for testing)
- `MP_TEST_PUBLIC_KEY`: Sandbox public key (for testing)

### Mobile Build
- `EXPO_TOKEN`: Expo access token
- `IOS_BUNDLE_ID`: iOS bundle identifier (optional)
- `ANDROID_PACKAGE`: Android package name (optional)

### Notifications (Optional)
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications

## Setting Up the Pipeline

### 1. Initial Setup

```bash
# Add all required secrets to GitHub repository
# Settings → Secrets and variables → Actions → New repository secret

# Required minimum secrets for backend deployment:
RENDER_API_KEY=<your-render-api-key>
RENDER_SERVICE_ID_PROD=<your-service-id>
STRAPI_APP_KEYS=<key1,key2,key3,key4>
STRAPI_JWT_SECRET=<your-jwt-secret>
STRAPI_API_TOKEN_SALT=<your-api-token-salt>
STRAPI_ADMIN_JWT_SECRET=<your-admin-jwt-secret>
STRAPI_TRANSFER_TOKEN_SALT=<your-transfer-token-salt>
CLOUDINARY_NAME=dbkt9lqw2
CLOUDINARY_KEY=449524684586186
CLOUDINARY_SECRET=ICRe14n1axLh5ofo9zqsrnWzuDU
```

### 2. First Deployment

1. Add all required secrets to GitHub
2. Push code to main branch to trigger automatic deployment
3. Or manually trigger via GitHub Actions tab:
   - Go to Actions → CI/CD Pipeline
   - Click "Run workflow"
   - Select options and click "Run workflow"

### 3. Monitoring Deployment

```bash
# View workflow runs
GitHub → Actions → CI/CD Pipeline

# Check deployment status
- Quality checks: Must pass before deployment
- Build backend: Verifies Strapi builds correctly
- Deploy backend: Shows Render deployment progress
- Health check: Confirms service is running
```

## Workflow Optimization

### Parallel Execution
- Quality checks run in parallel with payment tests when possible
- Mobile builds run independently of backend deployment
- All jobs use dependency caching for faster execution

### Conditional Execution
- Payment tests only run when payment files change
- Backend deployment only on main branch
- Mobile builds only on version tags
- Manual dispatch allows selective job execution

### Performance Features
- Node modules caching
- Conditional job execution
- Parallel test execution
- Build artifact verification

## Troubleshooting

### Common Issues

#### 1. Render Deployment Fails
```bash
Error: RENDER_API_KEY not configured
Solution: Add RENDER_API_KEY to GitHub Secrets
```

#### 2. Payment Tests Skipped
```bash
Warning: MercadoPago test credentials not configured
Solution: Add MP_TEST_ACCESS_TOKEN, MP_TEST_PUBLIC_KEY to GitHub Secrets
```

#### 3. Mobile Build Not Triggered
```bash
Issue: Build doesn't start on push
Solution: Ensure you're pushing a tag (git tag v1.0.0 && git push --tags)
```

#### 4. Health Check Fails
```bash
Error: Health check failed after deployment
Solution: Check Render logs for startup errors
```

## Best Practices

1. **Always test locally first**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

2. **Use feature branches**
   - Create PR to main for automatic quality checks
   - Merge to main triggers deployment

3. **Version tags for releases**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Monitor deployments**
   - Check GitHub Actions for pipeline status
   - Verify health endpoint after deployment
   - Review Render logs if issues occur

5. **Keep secrets secure**
   - Never commit secrets to code
   - Rotate secrets periodically
   - Use different credentials for environments

## Pipeline Flow Diagram

```
Push/PR/Tag/Manual
       ↓
[Quality Checks]
    ↓     ↓
[Payment] [Build Backend]
 Tests        ↓
         [Deploy Backend]
              ↓
         [Health Check]

[Build Mobile] (on tags)
       ↓
[App Store Submit]

[Notifications] (always)
```

## Maintenance

### Updating the Workflow
1. Edit `.github/workflows/cicd.yml`
2. Test changes in a feature branch
3. Create PR for review
4. Merge to main to activate

### Adding New Jobs
```yaml
new-job:
  name: New Job
  runs-on: ubuntu-latest
  needs: [quality-checks]
  if: github.event_name == 'push'
  steps:
    - name: Checkout
      uses: actions/checkout@v4
    # Add your steps
```

### Environment-Specific Configuration
- Production: Auto-deploy on main branch
- Staging: Manual trigger with environment selection
- Development: Local testing only

## Support

For issues with the CI/CD pipeline:
1. Check GitHub Actions logs
2. Verify all secrets are configured
3. Review this documentation
4. Check Render service status
5. Contact DevOps team if needed