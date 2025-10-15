# Testing Render Deployment Locally

This guide explains how to use the local testing tools to validate your Strapi configuration before deploying to Render.com.

## Problem Statement

Strapi deployments to Render have been failing with database configuration errors:

```
Cannot destructure property 'client' of 'db.config.connection' as it is undefined
```

With no local testing capability, this forced trial-and-error deployments (15+ attempts). These tools solve that problem.

## Available Testing Tools

### 1. Database Config Validation Script

**Path**: `scripts/validate-db-config.js`

**Purpose**: Validates the database configuration file without requiring a running database.

**What it tests**:

- Database config structure matches Strapi v5 expectations
- Environment variable parsing works correctly
- SSL configuration is properly formatted
- Connection pooling is configured
- Multiple scenarios (DATABASE_URL, individual params, SSL on/off)

**Usage**:

```bash
cd backend/strapi
node scripts/validate-db-config.js
```

**Output**:

- Green checkmarks for passing tests
- Red X for failures
- Warnings for potential issues
- Masked passwords in output
- Clear PASS/FAIL summary

**When to use**:

- After modifying `config/database.js`
- Before committing database config changes
- As a pre-deployment sanity check

---

### 2. Render Environment Simulator

**Path**: `scripts/test-with-render-env.sh`

**Purpose**: Simulates Render's exact environment and runs the build/start process locally.

**What it tests**:

- Environment variables match Render's format
- `npm ci` installs dependencies correctly
- `npm run build` completes without errors
- Database config loads during build
- (Optional) `npm run start` succeeds with a real database

**Usage**:

```bash
cd backend/strapi
./scripts/test-with-render-env.sh
```

**Requirements**:

- Node.js 18+
- PostgreSQL running locally (optional, for full test)
- OpenSSL (for generating test secrets)

**What happens**:

1. Sets environment variables exactly like Render
2. Generates random secrets (APP_KEYS, JWT_SECRET, etc.)
3. Runs `npm ci` to install dependencies
4. Runs `npm run build` (where config is first loaded)
5. Optionally runs `npm run start` to test startup
6. Shows clear success/failure messages

**When to use**:

- Before pushing to Render
- After changing build configuration
- To test with Render-like environment variables

---

### 3. Docker Test Environment

**Path**: `docker/test-render-env/`

**Purpose**: Complete Docker environment that mirrors Render's infrastructure.

**What it includes**:

- PostgreSQL 16 (same as Render)
- Node 18 (same as Render)
- Production build process
- Real database connections
- Health checks

**Usage**:

```bash
cd backend/strapi

# Start the environment
./docker/test-render-env/test-env.sh start

# View logs
./docker/test-render-env/test-env.sh logs

# Open shell in Strapi container
./docker/test-render-env/test-env.sh shell

# Open PostgreSQL shell
./docker/test-render-env/test-env.sh db

# Stop the environment
./docker/test-render-env/test-env.sh stop

# Clean up everything
./docker/test-render-env/test-env.sh clean
```

**Requirements**:

- Docker Desktop installed and running
- 2GB free disk space
- Ports 1337 and 5432 available

**What happens**:

1. Builds a Docker image matching Render's Node environment
2. Starts PostgreSQL 16 in a container
3. Runs `npm ci && npm run build && npm run start`
4. Exposes Strapi on http://localhost:1337
5. Allows interactive debugging via shell access

**When to use**:

- For the most comprehensive testing
- When you need to test database migrations
- To debug startup issues in a production-like environment
- Before major deployments

---

## Recommended Testing Workflow

### Quick Pre-Commit Check

```bash
# Fast validation (no database required)
node scripts/validate-db-config.js
```

### Before Deploying to Render

```bash
# Test with Render-like environment
./scripts/test-with-render-env.sh
```

### For Major Changes or Troubleshooting

```bash
# Full Docker environment test
./docker/test-render-env/test-env.sh start
./docker/test-render-env/test-env.sh logs
```

---

## Common Issues and Solutions

### Issue: "Cannot destructure property 'client'"

**Cause**: Database config returns invalid structure.

**Test with**:

```bash
node scripts/validate-db-config.js
```

**Look for**:

- Missing `connection.client` property
- Incorrect nesting of config objects
- Type mismatches (object vs string)

---

### Issue: Build fails on Render but works locally

**Cause**: Environment variables differ between local and Render.

**Test with**:

```bash
./scripts/test-with-render-env.sh
```

**Check**:

- DATABASE_URL format matches Render's format
- All required secrets are present
- NODE_ENV is set to 'production'

---

### Issue: Database connection errors

**Cause**: SSL configuration, connection string format, or network issues.

**Test with**:

```bash
./docker/test-render-env/test-env.sh start
./docker/test-render-env/test-env.sh logs
```

**Check**:

- PostgreSQL is accessible
- SSL settings match environment (false for local, true for Render)
- Connection string format is correct
- Pool settings are appropriate

---

## Understanding Test Output

### Validation Script Output

```
✓ PASS: Config is valid          # Test passed
✗ FAIL: Test failed validation   # Test failed (shows errors above)
⚠ Warning: ...                    # Non-critical issue
ℹ Info: ...                       # Informational message
```

### Render Simulator Output

```
✓ Dependencies installed successfully    # npm ci worked
✓ Build completed successfully          # npm run build worked
✓ Database configuration is valid       # Config loaded correctly
✗ Build failed with exit code 1         # Build failed (check errors)
```

### Docker Environment Output

```
✓ PostgreSQL is ready                   # Database started
✓ Strapi container is running           # Container started
✓ Admin panel is accessible             # Full startup successful
⚠ Admin panel not responding yet        # Still starting up
✗ Strapi container failed to start      # Startup failed
```

---

## Environment Variables Reference

These are the key environment variables tested by these tools:

### Database Configuration

- `DATABASE_URL` - Full PostgreSQL connection string (Render provides this)
- `DATABASE_CLIENT` - Database type (postgres, sqlite)
- `DATABASE_SSL` - Enable SSL (true/false)
- `DATABASE_SSL_REJECT_UNAUTHORIZED` - SSL certificate validation (true/false)
- `DATABASE_HOST` - Database host (if not using DATABASE_URL)
- `DATABASE_PORT` - Database port (default: 5432)
- `DATABASE_NAME` - Database name
- `DATABASE_USERNAME` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_POOL_MIN` - Minimum connections in pool (default: 2)
- `DATABASE_POOL_MAX` - Maximum connections in pool (default: 10)

### Strapi Secrets (Auto-generated by Render)

- `APP_KEYS` - Comma-separated list of app keys
- `API_TOKEN_SALT` - Salt for API tokens
- `ADMIN_JWT_SECRET` - JWT secret for admin panel
- `TRANSFER_TOKEN_SALT` - Salt for transfer tokens
- `JWT_SECRET` - Main JWT secret

### Application Configuration

- `NODE_ENV` - Environment (production/development)
- `HOST` - Server host (0.0.0.0)
- `PORT` - Server port (10000 on Render, 1337 locally)

---

## Next Steps After Testing

1. **All tests pass locally**:
   - Commit your changes
   - Push to your repository
   - Render will auto-deploy

2. **Tests fail locally**:
   - Review error messages
   - Fix configuration issues
   - Re-run tests
   - Do NOT push until tests pass

3. **Tests pass but Render deployment fails**:
   - Check Render's environment variables match your local test
   - Verify DATABASE_URL is correctly set by Render
   - Check Render build logs for differences
   - Use Docker environment for closer simulation

---

### Issue: Favicon 500 errors in production

**Cause**: Path resolution using `__dirname` breaks in TypeScript compiled builds.

**Test with**:

```bash
# Build and check if middleware can find favicon
npm run build
cd dist/config
node -e "console.log(__dirname)"  # Shows dist/config, not project root
```

**Solution**:
Use `process.cwd()` for path resolution in middleware configuration:

```typescript
export default ({ env }: { env: any }) => {
  const publicDir = env('PUBLIC_DIR', './public');
  const faviconPath = path.resolve(process.cwd(), publicDir, 'favicon.ico');
  // ... rest of middleware config
};
```

**Why this works**:

- `process.cwd()` always returns the project root directory
- Works correctly in both dev (ts-node) and production (compiled JS)
- Allows configuration via `PUBLIC_DIR` environment variable
- Eliminates path resolution issues in compiled TypeScript projects

**Verify**:

```bash
# Check favicon exists
ls -la backend/strapi/public/favicon.ico

# Test locally with production build
NODE_ENV=production npm run build && npm run start
curl http://localhost:1337/favicon.ico  # Should return 200, not 500
```

---

### Issue: Strapi Admin Panel 500 Errors Behind Reverse Proxy

**Cause**: Custom session middleware configuration conflicts with Strapi's built-in proxy detection.

**Symptoms**:

- Admin panel returns 500 Internal Server Error
- Logs show "Cannot send secure cookie over unencrypted connection"
- Proxy detection diagnostic shows `koa=false` despite `config=true`

**Solution**:

1. **Remove custom session configuration** - Let Strapi handle proxy detection automatically

   In `config/middlewares.ts`, do NOT add custom session configuration. Let Strapi use its defaults.

2. **Verify proxy settings in config/server.ts**:

   ```typescript
   proxy: env.bool('IS_PROXIED', env('NODE_ENV') === 'production');
   ```

3. **Trust-proxy middleware** - Ensures x-forwarded-proto headers are set:

   The trust-proxy middleware automatically injects HTTPS headers when behind a proxy.
   See: `backend/strapi/src/middlewares/trust-proxy.ts`

4. **Check diagnostic logging at startup**:
   ```
   [info] Reverse proxy trusted: config=true koa=true (IS_PROXIED=true)
   ```

**Verify**:

```bash
# Check proxy detection works
curl -I https://your-app.onrender.com/admin
# Should return 200, not 500

# Check logs for proxy status
# Look for: "Reverse proxy trusted: config=true koa=true"
```

**Related commits**: 847323c, 91c1719, 7b77ec4

---

## Files Created

```
backend/strapi/
├── scripts/
│   ├── validate-db-config.js           # Config validation script
│   └── test-with-render-env.sh         # Render environment simulator
├── docker/
│   └── test-render-env/
│       ├── Dockerfile                  # Docker image definition
│       ├── docker-compose.yml          # Multi-container setup
│       ├── test-env.sh                 # Docker test orchestrator
│       └── README.md                   # Docker-specific docs
└── docs/
    └── TESTING_RENDER_DEPLOYMENT.md    # This file
```

---

## Support

If you encounter issues with these testing tools:

1. Check Docker is running (for Docker tests)
2. Ensure Node.js 18+ is installed
3. Verify PostgreSQL is accessible (for full tests)
4. Check port availability (1337, 5432)
5. Review tool-specific README files

For Render-specific deployment issues:

1. Check Render dashboard logs
2. Verify environment variables in Render
3. Ensure DATABASE_URL is set correctly
4. Check service health in Render dashboard
