# Testing Tools Quick Start

Local testing tools to validate Strapi configuration before deploying to Render.

## TL;DR - Pre-Deployment Checklist

```bash
cd backend/strapi

# 1. Quick validation (30 seconds)
node scripts/validate-db-config.js

# 2. Render environment test (2-3 minutes)
./scripts/test-with-render-env.sh

# 3. Full Docker test (5-10 minutes) - optional but recommended
./docker/test-render-env/test-env.sh start
```

If all three pass, you're safe to deploy to Render.

---

## Tool 1: Config Validator (Fast)

**What**: Validates database config structure
**Time**: ~30 seconds
**Requires**: Node.js only

```bash
node scripts/validate-db-config.js
```

**Success looks like**:

```
✓ PASS: Render Production: DATABASE_URL with SSL
✓ PASS: Individual Parameters: host/port/database/user/password
...
✓ All tests passed! Configuration is valid.
```

---

## Tool 2: Render Simulator (Medium)

**What**: Runs build with Render-like environment
**Time**: 2-3 minutes
**Requires**: Node.js, optionally PostgreSQL

```bash
./scripts/test-with-render-env.sh
```

**Success looks like**:

```
✓ Environment variables set
✓ Dependencies installed
✓ Build completed successfully!
✓ Database configuration is valid
```

---

## Tool 3: Docker Environment (Complete)

**What**: Full production-like environment
**Time**: 5-10 minutes
**Requires**: Docker Desktop

```bash
# Start
./docker/test-render-env/test-env.sh start

# View logs
./docker/test-render-env/test-env.sh logs

# Stop
./docker/test-render-env/test-env.sh stop
```

**Success looks like**:

```
✓ PostgreSQL is ready
✓ Strapi container is running
✓ Admin panel is accessible at http://localhost:1337/admin
```

---

## When to Use Each Tool

| Scenario                      | Tool to Use                |
| ----------------------------- | -------------------------- |
| Quick pre-commit check        | Tool 1: Config Validator   |
| Before deploying to Render    | Tool 2: Render Simulator   |
| Major config changes          | Tool 3: Docker Environment |
| Debugging deployment failures | Tool 3: Docker Environment |
| CI/CD pipeline                | Tool 1 + Tool 2            |

---

## Common Errors

### "Cannot destructure property 'client'"

**Run**: `node scripts/validate-db-config.js`
**Fix**: Check `config/database.js` structure

### Build fails on Render but works locally

**Run**: `./scripts/test-with-render-env.sh`
**Fix**: Ensure environment variables match Render

### Database connection errors

**Run**: `./docker/test-render-env/test-env.sh start`
**Fix**: Check SSL settings, connection string format

---

## Full Documentation

See `docs/TESTING_RENDER_DEPLOYMENT.md` for complete documentation.

---

## Files Created

- `scripts/validate-db-config.js` - Config validation
- `scripts/test-with-render-env.sh` - Render simulator
- `docker/test-render-env/` - Full Docker environment
- `docs/TESTING_RENDER_DEPLOYMENT.md` - Complete guide
- `TESTING_TOOLS_QUICKSTART.md` - This file
