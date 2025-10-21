# MercadoPago Development Setup

**Audience**: Developers setting up local environment
**Prerequisites**: Node.js 18+, PostgreSQL, MercadoPago account
**Time to Setup**: ~15 minutes

---

## Table of Contents

1. [Get Test Credentials](#1-get-test-credentials)
2. [Configure Backend](#2-configure-backend)
3. [Configure Frontend](#3-configure-frontend)
4. [Run Tests](#4-run-tests)
5. [Test Payment Flow Locally](#5-test-payment-flow-locally)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Get Test Credentials

### Step 1: Access MercadoPago Developer Dashboard

Visit: https://www.mercadopago.com.uy/developers/panel

### Step 2: Create or Select Application

1. Click "Your integrations" → "Create application"
2. Fill in details:
   - **Name**: Tifossi E-commerce (Test)
   - **Solution**: Checkout Pro
   - **Integration**: E-commerce

### Step 3: Copy Test Credentials

Navigate to **Credentials** → **Test** tab:

```bash
# Copy these values (start with TEST-)
MP_TEST_ACCESS_TOKEN=TEST-4166909433694983-XXXXXX-...
MP_TEST_PUBLIC_KEY=TEST-6f7d3927-50fe-403e-b32c-...
```

### Step 4: Generate Webhook Secret

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Save output for MP_WEBHOOK_SECRET
```

---

## 2. Configure Backend

### Create Environment File

```bash
cd backend/strapi
cp .env.example .env
```

### Edit `backend/strapi/.env`

```bash
# Feature Flags
FEATURE_PAYMENTS_ENABLED=true

# MercadoPago Test Credentials
MP_TEST_ACCESS_TOKEN=TEST-4166909433694983-072404-...
MP_TEST_PUBLIC_KEY=TEST-6f7d3927-50fe-403e-b32c-...
MP_WEBHOOK_SECRET=<generated-secret-from-step-4>

# Webhook URL (local development)
WEBHOOK_URL=http://localhost:1337/webhooks/mercadopago

# API Configuration
MP_API_URL=https://api.mercadopago.com
```

### Start Strapi

```bash
cd backend/strapi
npm install
npm run develop
```

**Expected output**:
```
✅ MercadoPago service initialized successfully
   mode: TEST
   accessTokenSet: true
   publicKeySet: true
   webhookSecretSet: true
```

---

## 3. Configure Frontend

### Create Environment File

```bash
cp .env.example .env.development
```

### Edit `.env.development`

```bash
# Backend API
EXPO_PUBLIC_API_BASE_URL=http://localhost:1337

# MercadoPago Public Key (for frontend)
EXPO_PUBLIC_MP_PUBLIC_KEY=TEST-6f7d3927-50fe-403e-b32c-...

# App Configuration
APP_SCHEME=tifossi
```

### Install Dependencies

```bash
npm install
```

---

## 4. Run Tests

### Backend Tests

```bash
# All backend tests (25 tests)
cd backend/strapi
npm test

# Webhook tests only
npm run test:webhooks

# With coverage
npm run test:coverage
```

**Expected output**:
```
PASS  tests/mercadopago-webhook.test.js
  ✓ Webhook Signature Validation (3/3)
  ✓ Payment Status Updates (4/4)
  ✓ Webhook Data Validation (3/3)
  ✓ Error Handling (6/6)
  ✓ Configuration (2/2)
  ✓ Security Helpers (2/2)
  ✓ Async Queue Processing (6/6)

Tests: 26 passed, 26 total
```

### Frontend Tests

```bash
# All frontend tests (10 tests)
npm test -- device-fingerprint

# Payment integration tests (requires credentials)
ENABLE_PAYMENT_TESTS=true npm run test:payment
```

**Expected output**:
```
PASS  app/_tests/unit/device-fingerprint.test.ts
  ✓ Device Fingerprint Service (10/10)

Tests: 10 passed, 10 total
```

---

## 5. Test Payment Flow Locally

### Option 1: Full Flow with ngrok (Recommended)

**Why**: Allows MercadoPago to send real webhooks to your local backend

**Setup**:
```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start Strapi (in one terminal)
cd backend/strapi && npm run develop

# 3. Expose webhook endpoint (in another terminal)
ngrok http 1337

# 4. Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# 5. Update backend/.env:
WEBHOOK_URL=https://abc123.ngrok.io/webhooks/mercadopago

# 6. Register webhook in MercadoPago Dashboard:
#    Dashboard → Webhooks → Add URL: https://abc123.ngrok.io/webhooks/mercadopago
```

### Option 2: Simplified Flow (No Webhooks)

**Test payment creation without webhook delivery**:

```bash
# 1. Start Strapi
cd backend/strapi && npm run develop

# 2. Start mobile app
npx expo run:ios

# 3. Create test order in app
# 4. Use test card at checkout (see below)
```

### Test Cards for Uruguay

**Approved Payment**:
```
Card Number: 5031 7557 3453 0604
CVV: 123
Expiration: 11/25
Cardholder Name: APRO
ID Type: CI
ID Number: 12345678
```

**Rejected Payment** (Insufficient Funds):
```
Card Number: 5031 7557 3453 0604
CVV: 123
Expiration: 11/25
Cardholder Name: FUND
```

**Rejected Payment** (Other Error):
```
Card Number: 5031 7557 3453 0604
CVV: 123
Expiration: 11/25
Cardholder Name: OTHE
```

### Verify Payment Processing

**Check Strapi logs**:
```bash
# In Strapi terminal, look for:
✅ MercadoPago webhook received
✅ Webhook queued for processing
✅ Processing payment notification
✅ Order TIF-XXXXX status changed from pending to paid
```

**Check database**:
```sql
-- Webhook logs
SELECT * FROM webhook_logs ORDER BY "processedAt" DESC LIMIT 10;

-- Webhook queue
SELECT * FROM webhook_queues WHERE status = 'completed' ORDER BY "processedAt" DESC LIMIT 10;

-- Orders
SELECT "orderNumber", status, "mpPaymentStatus", "paidAt"
FROM orders
ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 6. Troubleshooting

### Backend won't start

**Symptom**: "MercadoPago configuration is invalid"

**Solution**:
```bash
# Check environment variables are set
grep MP_ backend/strapi/.env

# Expected:
MP_TEST_ACCESS_TOKEN=TEST-...
MP_TEST_PUBLIC_KEY=TEST-...
MP_WEBHOOK_SECRET=...

# If missing, add them to .env
```

### Tests fail with "Missing environment variables"

**Symptom**: "MP_TEST_ACCESS_TOKEN is required"

**Solution**:
```bash
# Backend tests use backend/.env automatically
# Make sure backend/strapi/.env has all MP_* variables

# Frontend tests need explicit env vars:
ENABLE_PAYMENT_TESTS=true \
MP_TEST_ACCESS_TOKEN=TEST-... \
MP_TEST_PUBLIC_KEY=TEST-... \
npm run test:payment
```

### Webhook signature validation fails

**Symptom**: "Invalid webhook signature"

**Solutions**:
1. **Check secret matches**: Webhook secret must be same in `.env` and test code
2. **Verify timestamp**: Signatures expire after 5 minutes
3. **Use real webhook**: Manual cURL tests won't work (signature is cryptographic)

### Payment created but webhook not received

**Symptom**: Order stuck in "pending" status

**Solutions**:
1. **Check ngrok running**: ngrok must be active and URL registered
2. **Verify webhook URL**: Dashboard → Webhooks → Check URL matches ngrok
3. **Test webhook endpoint**:
   ```bash
   curl http://localhost:1337/webhooks/mercadopago
   # Expected: 400 (missing signature, but endpoint exists)
   ```

### Database connection errors

**Symptom**: "Connection refused" or "Database not found"

**Solution**:
```bash
# Check PostgreSQL is running
psql postgres -c "SELECT 1;"

# Check DATABASE_URL in .env
grep DATABASE_URL backend/strapi/.env

# Reset database (if needed)
cd backend/strapi
npm run strapi db:reset
```

### Frontend can't connect to backend

**Symptom**: "Network request failed"

**Solutions**:
1. **Check backend is running**: `curl http://localhost:1337/api/health`
2. **Verify EXPO_PUBLIC_API_BASE_URL**: Should be `http://localhost:1337`
3. **Check iOS simulator networking**: Try `http://127.0.0.1:1337` instead
4. **Clear Expo cache**: `npx expo start --clear`

---

## Testing Strategy

### When to Use Each Test Type

**Unit Tests** (Fast, no credentials needed):
```bash
npm test -- device-fingerprint
# Tests: Device fingerprint generation, validation
```

**Backend Integration Tests** (Medium, needs database):
```bash
cd backend/strapi && npm test
# Tests: Webhook processing, signature validation, state transitions
```

**Payment Integration Tests** (Slow, needs MP credentials):
```bash
ENABLE_PAYMENT_TESTS=true npm run test:payment
# Tests: Real MercadoPago API calls, payment flow
```

### Test Coverage Goals

- **Backend webhook handler**: 100% (26/26 tests passing)
- **Frontend device fingerprint**: 100% (10/10 tests passing)
- **Payment integration**: 90% (9/10 tests, 1 jsdom limitation)

---

## Environment Variables Reference

### Backend (`backend/strapi/.env`)

```bash
# Required for payment features
FEATURE_PAYMENTS_ENABLED=true
MP_TEST_ACCESS_TOKEN=TEST-...
MP_TEST_PUBLIC_KEY=TEST-...
MP_WEBHOOK_SECRET=...
WEBHOOK_URL=http://localhost:1337/webhooks/mercadopago

# Optional configuration
MP_API_URL=https://api.mercadopago.com
APP_SCHEME=tifossi
```

### Frontend (`.env.development`)

```bash
# Required for mobile app
EXPO_PUBLIC_API_BASE_URL=http://localhost:1337
EXPO_PUBLIC_MP_PUBLIC_KEY=TEST-...
APP_SCHEME=tifossi
```

### GitHub CI/CD (Repository Secrets)

```bash
# Required for automated tests
MP_TEST_ACCESS_TOKEN=TEST-...
MP_TEST_PUBLIC_KEY=TEST-...
MP_WEBHOOK_SECRET=...
```

---

## Next Steps

1. **Development**: You're ready to develop payment features locally
2. **Testing**: Run tests before committing changes
3. **Production**: See [deployment/PRODUCTION_DEPLOYMENT_GUIDE.md](./deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## Related Documentation

- **Main Overview**: [MERCADOPAGO.md](./MERCADOPAGO.md)
- **Production Deployment**: [deployment/PRODUCTION_DEPLOYMENT_GUIDE.md](./deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
- **Troubleshooting**: [deployment/TROUBLESHOOTING_QUICK_REFERENCE.md](./deployment/TROUBLESHOOTING_QUICK_REFERENCE.md)
