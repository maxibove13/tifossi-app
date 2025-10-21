# 🚀 MercadoPago Testing Plan (Updated October 2025)

## Snapshot

| Area                   | Status                 | Notes                                                                                    |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| Frontend payment store | ✅ Implemented         | `app/_stores/paymentStore.ts` integrates with MercadoPago service                        |
| Sandbox helper         | ✅ Implemented         | `app/_tests/services/mercadopago-test.service.ts` handles real API, signatures, cleanup  |
| Integration suites     | ✅ Implemented         | `mercadopago-payment-flow.test.tsx`, `revenue-critical-purchase.test.tsx` (real sandbox) |
| Backend webhook tests  | ✅ Implemented         | 25 tests covering signature validation, fraud detection, async queue (100% passing)      |
| Credential guard       | ✅ Implemented         | Tests fail fast when `MP_TEST_*` variables are missing                                   |
| Documentation          | ✅ Updated             | Credential + alignment docs refreshed + MP official docs linked                          |
| CI/CD Integration      | ✅ Fully Integrated    | GitHub Actions workflow configured with payment tests job                                 |
| Test Infrastructure    | ✅ Optimized           | Tests run without build requirement (30s → 5s), TypeScript on-the-fly transpilation     |

## How the Suites Work

1. **Toggle:** Run with `ENABLE_PAYMENT_TESTS=true`.
2. **Credential check:** Each suite stops immediately if `MP_TEST_ACCESS_TOKEN`, `MP_TEST_PUBLIC_KEY`, or
   `MP_WEBHOOK_SECRET` are missing.
3. **Sandbox execution:** When credentials are present the suites:
   - Create real preferences via the MercadoPago API.
   - Exercise payment store flows (success, rejection, cart rollback).
   - Validate webhook signatures against the shared validator.
   - Perform optional health checks and cleanup logging.

## Required Environment Variables

| Variable                | Purpose                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `MP_TEST_ACCESS_TOKEN`  | MercadoPago sandbox access token (starts with `TEST-`).                                |
| `MP_TEST_PUBLIC_KEY`    | Sandbox public key for client-side flows.                                              |
| `MP_WEBHOOK_SECRET`     | Secret used for webhook signature validation.                                          |
| `MP_API_URL` (optional) | Override the default API host (`https://api.mercadopago.com`).                         |
| `TEST_WEBHOOK_URL`      | Where sandbox notifications should point during tests (local Strapi/ngrok or staging). |

See `docs/MERCADOPAGO_CREDENTIAL_SETUP.md` for step-by-step provisioning instructions.

## Test Execution Guide

### Local Development

1. **Setup Environment**:
   ```bash
   # Frontend tests
   cp .env.test.example .env.test
   # Edit .env.test and add your MP credentials

   # Backend tests
   cp backend/strapi/.env.test.example backend/strapi/.env.test
   # Edit backend/strapi/.env.test and add your MP credentials
   ```

2. **Run Tests**:
   ```bash
   # Frontend - All tests (skip payment tests if no credentials)
   npm test

   # Frontend - Payment integration tests only
   ENABLE_PAYMENT_TESTS=true npm run test:payment

   # Backend - All tests (includes webhook tests)
   cd backend/strapi && npm test

   # Backend - Webhook tests only
   cd backend/strapi && npm run test:webhooks

   # Backend - Payment tests only
   cd backend/strapi && npm run test:payment

   # All tests with coverage
   npm run test:coverage
   cd backend/strapi && npm run test:coverage
   ```

3. **Test Performance**:
   - Backend tests now run **5-10x faster** (no build requirement)
   - Tests use source files directly with on-the-fly TypeScript transpilation
   - Average test suite execution: ~5-10 seconds

### CI/CD Integration

The project uses **GitHub Actions** for continuous integration with comprehensive payment test coverage.

#### Workflow Overview

**File**: `.github/workflows/cicd.yml`

**Jobs**:
1. **quality-checks**: Always runs on every push/PR
   - Runs all frontend and backend tests (including MercadoPago tests if credentials available)
   - Linting and type checking
   - Test coverage upload to Codecov

2. **payment-tests**: Conditional (triggered by commit message or manual dispatch)
   - Runs when commit contains `[payment]` or `[mercadopago]`
   - Can be triggered manually via GitHub Actions UI
   - Executes frontend and backend payment integration tests
   - Tests webhook endpoints

3. **build-backend**: Runs after quality checks pass

4. **deploy-backend**: Deploys to production (only on main branch)

#### CI/CD Test Execution Flow

```yaml
# 1. Quality Checks Job - Backend Tests
- Run backend tests with MP credentials (optional)
  → npm run test:ci
  → Includes all 25 webhook tests if credentials present
  → Skips gracefully if credentials missing

# 2. Payment Tests Job (Conditional)
- Check for credentials
  → If missing: skip with warning message
  → If present: run full payment test suite

- Frontend payment tests
  → ENABLE_PAYMENT_TESTS=true npm run test:payment

- Backend payment tests
  → cd backend/strapi && npm run test:payment

- Webhook endpoint tests
  → cd backend/strapi && npm run test:webhooks
```

#### Required GitHub Secrets

Add these to your repository: Settings → Secrets and variables → Actions → New repository secret

| Secret Name            | Description                                      | Example                                  |
| ---------------------- | ------------------------------------------------ | ---------------------------------------- |
| `MP_TEST_ACCESS_TOKEN` | MercadoPago sandbox access token                 | `TEST-4166909433694983-XXXXXX-...`       |
| `MP_TEST_PUBLIC_KEY`   | MercadoPago sandbox public key                   | `TEST-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX` |
| `MP_WEBHOOK_SECRET`    | Webhook signature verification secret            | Your generated webhook secret            |

#### Triggering Payment Tests in CI

**Method 1 - Commit Message** (Automatic):
```bash
git commit -m "feat: update payment flow [payment]"
git push
# Triggers: quality-checks + payment-tests jobs
```

**Method 2 - Manual Dispatch**:
1. Go to: GitHub → Actions → CI/CD Pipeline → Run workflow
2. Select: "payment-tests" from the dropdown
3. Click: "Run workflow"

**Method 3 - Regular Push** (Always runs quality checks):
```bash
git commit -m "feat: update code"
git push
# Triggers: quality-checks (includes MP tests if credentials available)
```

#### CI/CD Best Practices

1. **Credential Management**:
   - Never commit `.env.test` files
   - Always use GitHub Secrets for sensitive data
   - Rotate secrets periodically (recommended: every 90 days)

2. **Test Organization**:
   - Payment tests run separately from unit tests
   - Fast feedback: quality-checks complete in ~5 minutes
   - Payment tests: ~10 minutes (includes webhook simulation)

3. **Monitoring**:
   - Check GitHub Actions for test results
   - Review test coverage reports on Codecov
   - Monitor payment test failures (indicates API issues)

4. **Debugging Failed Tests**:
   ```bash
   # View CI logs
   GitHub → Actions → Select workflow run → View logs

   # Reproduce locally
   ENABLE_PAYMENT_TESTS=true npm run test:payment
   cd backend/strapi && npm run test:webhooks
   ```

## Test Infrastructure Improvements (October 2025)

### Performance Optimizations

**Before**:
- Tests required `npm run build` before execution
- Cold start: ~30 seconds
- Build output dependency: `require('../dist/src/...')`

**After** ✅:
- Tests use source files directly: `require('../src/...')`
- On-the-fly TypeScript transpilation via Babel
- Cold start: ~5 seconds (6x faster)
- Hot reload in watch mode: instant

### Jest Configuration Updates

**File**: `backend/strapi/jest.config.js`

Key improvements:
- TypeScript preset added with `@babel/preset-typescript`
- Source file imports (no `dist/` dependency)
- Improved transform patterns for better compatibility
- Removed `/dist/` from ignore patterns

### New Test Scripts

**File**: `backend/strapi/package.json`

Added scripts:
```json
{
  "test": "jest --config jest.config.js --watchman=false",
  "test:ci": "jest --config jest.config.js --ci --coverage --maxWorkers=2 --watchman=false",
  "test:webhooks": "jest --testMatch='**/tests/mercadopago-webhook.test.js' --watchman=false",
  "test:payment": "jest --testMatch='**/tests/mercadopago*.test.js' --watchman=false"
}
```

Note: `npm run build` removed from test scripts for faster execution.

### Documentation Enhancements

**MercadoPago Official Documentation Links**:
- Webhooks Guide: [https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks](https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks)
- Signature Validation: [Webhooks Security](https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#editor_3)
- Payment Status Handling: [Response Handling](https://www.mercadopago.com/developers/en/docs/checkout-api/response-handling)
- Testing Guide: [Integration Test](https://www.mercadopago.com/developers/en/docs/checkout-api/integration-test)

**Test File Documentation**:
- Added JSDoc comments explaining each test suite
- Linked to official MP documentation
- Documented signature format and security requirements
- Explained status mapping and validation rules

## Next Actions

1. ✅ **Test infrastructure optimized** - 6x faster execution
2. ✅ **CI/CD fully integrated** - GitHub Actions configured
3. ✅ **Documentation updated** - Setup guides and execution instructions
4. **Monitor production** - Track payment approval rates and webhook processing
5. **Schedule periodic health checks** - API health assertions for daily monitoring
6. **Backend verification** (optional) - Trigger Strapi webhook flows to confirm order persistence

## Ground Rules

- Do **not** mock MercadoPago for revenue-critical coverage—tests must talk to the sandbox or fail loudly.
- Treat payment test failures as release blockers.
- Rotate sandbox credentials regularly and update the shared secret used for webhooks.

With the helper service and suites in place the only remaining dependency is access to the MercadoPago sandbox credentials.
