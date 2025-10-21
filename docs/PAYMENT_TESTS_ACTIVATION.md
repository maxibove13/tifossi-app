# 🚨 Payment Tests Activation Guide

## Current Status: READY BUT DISABLED

All payment test infrastructure is **fully implemented** but **commented out** until MercadoPago credentials are obtained.

## ✅ What's Ready

### 1. Test Infrastructure

- ✅ `mercadopago-test.service.ts` - Real sandbox integration service
- ✅ `webhookValidator.ts` - Correct signature validation
- ✅ `mercadopago-uruguay.config.ts` - Uruguay-specific test cards and config
- ✅ Test environment configuration (`.env.test.example`)

### 2. CI/CD Pipelines

- ✅ `payment-tests.yml` - Dedicated payment test workflow (manual trigger only)
- ✅ Main CI workflow - Payment test steps added (commented out)

### 3. Test Scripts (in package.json)

All scripts are added but commented with `#`:

- `test:payment` - Run payment tests
- `test:payment:watch` - Watch mode for payment tests
- `test:payment:required` - Fail CI if payment tests fail
- `test:webhook` - Test webhook processing
- `test:security` - Security validation tests
- `test:all` - Run all tests including payments
- `test:ci:with-payments` - CI with payment tests

## 🔓 Activation Steps

### Step 1: Obtain MercadoPago Credentials

Follow `docs/MERCADOPAGO_SETUP.md` to get:

- `MP_TEST_ACCESS_TOKEN`
- `MP_TEST_PUBLIC_KEY`
- `MP_WEBHOOK_SECRET`

### Step 2: Configure Local Environment

```bash
# Copy environment template
cp .env.test.example .env.test

# Edit .env.test and add your credentials
```

### Step 3: Activate Test Scripts

In `package.json`, uncomment the payment test scripts:

```json
// Change from:
"# test:payment": "# jest --testMatch='**/revenue-critical*.test.tsx' --runInBand",

// To:
"test:payment": "jest --testMatch='**/revenue-critical*.test.tsx' --runInBand",
```

Remove the `#` from all payment test scripts.

### Step 4: Add GitHub Secrets

In your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add:
   - `MP_TEST_ACCESS_TOKEN`
   - `MP_TEST_PUBLIC_KEY`
   - `MP_WEBHOOK_SECRET`

### Step 5: Activate CI/CD

#### In `.github/workflows/ci.yml`:

Uncomment the payment test section (lines 35-53).

#### In `.github/workflows/payment-tests.yml`:

1. Remove the `workflow_dispatch` trigger
2. Uncomment the `push` and `pull_request` triggers (lines 16-30)

### Step 6: Verify Everything Works

```bash
# Test locally
npm run test:payment

# Push to trigger CI
git add .
git commit -m "feat: activate payment tests with MercadoPago credentials"
git push
```

## ⚠️ Important Notes

1. **NO FALLBACKS**: Tests will FAIL without real credentials (by design)
2. **Uruguay Specific**: Uses Uruguay test cards and identification types
3. **Webhook Validation**: Requires correct secret from MercadoPago dashboard
4. **Manual Trigger**: Payment workflow can be triggered manually even while disabled

## 📊 What Will Be Tested

Once activated, the following will be automatically tested:

- ✅ Real preference creation with MercadoPago API
- ✅ Payment status verification
- ✅ Webhook signature validation
- ✅ Deep link callback processing
- ✅ Security validations (XSS, injection prevention)
- ✅ Error recovery and timeout handling
- ✅ Uruguay-specific payment scenarios

## 🔍 Monitoring

After activation, monitor:

- GitHub Actions for test results
- Coverage reports for payment modules
- MercadoPago dashboard for test transactions

## 🆘 Troubleshooting

If tests fail after activation:

1. **Check Credentials**: Ensure they start with `TEST-`
2. **Verify API Access**: Run `curl` test from documentation
3. **Check Webhook Secret**: Must match dashboard exactly
4. **Review Logs**: Check GitHub Actions logs for detailed errors

## 📝 Files to Review

Before activation, review these files:

- `/app/_config/mercadopago-uruguay.config.ts`
- `/app/_services/payment/webhookValidator.ts`
- `/app/_tests/services/mercadopago-test.service.ts`
- `/.github/workflows/payment-tests.yml`
- `/docs/MERCADOPAGO_SETUP.md`

---

**Status**: Waiting for MercadoPago account creation
**Next Step**: Follow `MERCADOPAGO_SETUP.md`
**ETA**: Tests ready to activate immediately upon credential availability
