# MercadoPago Production Verification Guide

**Purpose**: Step-by-step verification checklist for deploying MercadoPago integration to production
**Audience**: DevOps engineers deploying for the first time
**Status**: Production-ready (85/100 score after credentials)
**Last Updated**: 2025-10-22

---

## Table of Contents

1. [Production Credentials Checklist](#1-production-credentials-checklist)
2. [Webhook Configuration Steps](#2-webhook-configuration-steps)
3. [Pre-Deployment Verification](#3-pre-deployment-verification)
4. [Post-Deployment Verification](#4-post-deployment-verification)
5. [Monitoring & Troubleshooting](#5-monitoring--troubleshooting)
6. [Production Readiness Checklist](#6-production-readiness-checklist)

---

## 1. Production Credentials Checklist

### 1.1 Obtain Production Credentials from MercadoPago

**Dashboard Access**: https://www.mercadopago.com.uy/developers/panel/app/4166909433694983/credentials

#### Step 1: Verify Business Account Status

Before production credentials are available, ensure:

- [ ] Business account verified by MercadoPago (1-2 business days)
- [ ] Legal business information complete (RUT, legal name, address)
- [ ] Privacy Policy URL configured: `https://tifossi-strapi-backend.onrender.com/privacy.html`
- [ ] Terms of Service URL configured

**Status Check**:
```
Login → Developer Panel → Application Settings → Production Status
Expected: "Production Enabled" or "Approved"
```

#### Step 2: Copy Production Credentials

1. Navigate to **Credentials** tab
2. Select **Production** mode
3. Copy the following credentials:

```bash
# Production credentials (start with APP-)
MP_ACCESS_TOKEN=APP-XXXXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Verification Test**:
```bash
# Test that credentials work
curl -X GET 'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer APP-YOUR-PRODUCTION-TOKEN'

# Expected: JSON array of payment methods (200 OK)
# If error: Credentials invalid or not activated
```

#### Step 3: Keep Test Credentials Separate

**IMPORTANT**: Maintain separate test credentials for development/staging:

```bash
# Test credentials (start with TEST-)
MP_TEST_ACCESS_TOKEN=TEST-1234567890-123456-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
MP_TEST_PUBLIC_KEY=TEST-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 1.2 Generate Webhook Secret

The webhook secret is used for HMAC-SHA256 signature verification (security critical).

**Method 1: Use MercadoPago Dashboard Secret** (recommended)
```
Dashboard → Webhooks → "Signing Secret" or "Webhook Secret"
Copy the provided 64-character hex string
```

**Method 2: Generate Your Own**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 64-character hex string (example: a1b2c3d4e5f6...xyz)
```

**Storage**:
- [ ] Store in password manager (1Password, LastPass, etc.)
- [ ] NEVER commit to Git
- [ ] Use same secret for test and production (or separate if you prefer)

### 1.3 Configure Credentials in Render Dashboard

**Location**: https://dashboard.render.com → tifossi-strapi-backend → Environment

**Add these environment variables** (one by one):

```bash
# Production MercadoPago Credentials (REQUIRED)
MP_ACCESS_TOKEN=APP-[paste-production-access-token]
MP_PUBLIC_KEY=APP-[paste-production-public-key]

# Test MercadoPago Credentials (for development mode)
MP_TEST_ACCESS_TOKEN=TEST-[paste-test-access-token]
MP_TEST_PUBLIC_KEY=TEST-[paste-test-public-key]

# Webhook Secret (CRITICAL - used for signature verification)
MP_WEBHOOK_SECRET=[paste-webhook-secret]

# Webhook URL (verify this is correct)
WEBHOOK_URL=https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago
```

**Important Notes**:
- Click "Save Changes" after adding ALL variables
- Service will restart automatically (expect 2-3 minute downtime)
- `NODE_ENV=production` determines which credentials are used (APP- vs TEST-)

### 1.4 Verify Credentials Are Working

After Render service restarts, check logs:

```bash
# In Render Dashboard → Logs, look for:
✅ MercadoPago service initialized successfully
   mode: PRODUCTION
   accessTokenSet: true
   publicKeySet: true
   webhookSecretSet: true

# If you see this error, credentials are missing:
❌ MercadoPago configuration is invalid: MercadoPago access token is required
```

**Troubleshooting**:
- **Error: "access token is required"** → Check `MP_ACCESS_TOKEN` is set and starts with `APP-`
- **Error: "webhook secret is required"** → Check `MP_WEBHOOK_SECRET` is set (64-char hex)
- **Service keeps restarting** → Check `/backend/strapi/src/index.ts` line 232 - constructor throws on missing credentials

---

## 2. Webhook Configuration Steps

### 2.1 Register Webhook URL in MercadoPago Dashboard

**Why**: MercadoPago needs to know where to send payment notifications.

#### Step 1: Access Webhook Settings

```
MercadoPago Developer Dashboard
→ Application ID 4166909433694983
→ Webhooks section
```

#### Step 2: Add Production Webhook URL

```
Webhook URL: https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago
Events to Subscribe: payment, merchant_order
```

**Event Types Explained**:
- `payment`: Payment created, approved, rejected, refunded (REQUIRED)
- `merchant_order`: Order status changes (optional, not implemented yet)
- `chargebacks`: Chargeback notifications (optional, not implemented yet)
- `point_integration_wh`: Point device events (not needed for mobile)

**Recommended Configuration**:
```
✅ payment
⬜ merchant_order (not implemented yet, but won't hurt)
⬜ chargebacks (optional)
⬜ point_integration_wh (not needed)
```

#### Step 3: Verify Webhook Is Active

After saving, MercadoPago dashboard should show:

```
Status: Active
URL: https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago
Last Delivery: (will show after first payment)
```

### 2.2 Test Webhook Delivery with MercadoPago Simulator

**CRITICAL**: Test webhook before launching to production.

#### Option 1: Use MercadoPago Dashboard Test Tool

```
Dashboard → Webhooks → "Test Webhook"
Select: payment
Payment ID: Any test payment ID from sandbox
```

**Expected Response**:
```json
{
  "success": true,
  "status": "queued",
  "requestId": "mp-webhook-test-123",
  "responseTime": "35ms"
}
```

#### Option 2: Manual cURL Test

**Important**: You need a valid signature from a real MercadoPago webhook to test this properly. The signature format is:

```bash
# Example webhook from MercadoPago (signature header is cryptographically signed)
curl -X POST https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1679534400,v1=abc123def456..." \
  -H "x-request-id: unique-request-id-123" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "1234567890"
    },
    "date_created": "2025-10-22T12:00:00Z"
  }'
```

**You cannot manually generate a valid signature** - use MercadoPago's test tool or wait for a real payment.

### 2.3 How to Obtain Webhook Secret (If Not Already Set)

The webhook secret might be provided by MercadoPago or you generate it yourself.

**Check MercadoPago Dashboard First**:
```
Dashboard → Webhooks → Look for "Signing Secret" or "Webhook Secret"
```

**If MercadoPago provides one**: Use that value
**If you need to generate one**: Use the command from section 1.2

**Set in Render Dashboard**:
```
Environment variable: MP_WEBHOOK_SECRET=[your-secret]
```

---

## 3. Pre-Deployment Verification

### 3.1 Environment Variable Checklist

**In Render Dashboard → Environment tab**, verify ALL of these are set:

```bash
# Core Strapi (auto-generated by Render)
✅ NODE_ENV=production
✅ APP_KEYS=[generated]
✅ API_TOKEN_SALT=[generated]
✅ ADMIN_JWT_SECRET=[generated]
✅ TRANSFER_TOKEN_SALT=[generated]
✅ JWT_SECRET=[generated]

# Database (from Render PostgreSQL)
✅ DATABASE_URL=[postgresql://...]
✅ DATABASE_CLIENT=postgres
✅ DATABASE_SSL=true
✅ DATABASE_SSL_REJECT_UNAUTHORIZED=false

# MercadoPago Production Credentials
✅ MP_ACCESS_TOKEN=APP-[token]
✅ MP_PUBLIC_KEY=APP-[key]
✅ MP_TEST_ACCESS_TOKEN=TEST-[token]
✅ MP_TEST_PUBLIC_KEY=TEST-[key]
✅ MP_WEBHOOK_SECRET=[64-char hex]
✅ WEBHOOK_URL=https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago

# Cloudinary (for product images)
✅ CLOUDINARY_NAME=[your-cloud-name]
✅ CLOUDINARY_KEY=[your-api-key]
✅ CLOUDINARY_SECRET=[your-api-secret]

# Firebase Admin (for authentication)
✅ FIREBASE_SERVICE_ACCOUNT_KEY=[full JSON from Firebase Console]
   OR
✅ FIREBASE_PROJECT_ID=[project-id]
✅ FIREBASE_PRIVATE_KEY=[private-key with \n escaped]
✅ FIREBASE_CLIENT_EMAIL=[firebase-adminsdk-xxx@project.iam.gserviceaccount.com]

# Application Settings
✅ PUBLIC_URL=https://tifossi-strapi-backend.onrender.com
✅ FEATURE_PAYMENTS_ENABLED=true
✅ APP_SCHEME=tifossi
```

**Missing Variables Symptoms**:
- Backend crashes on startup → Check `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- Webhooks fail signature validation → Check `MP_WEBHOOK_SECRET`
- Payments use test mode in production → Check `NODE_ENV=production`

### 3.2 Database Migration Verification

**What to check**: Strapi content types for webhooks exist

**Method 1: Check via Strapi Admin**
```
1. Login to: https://tifossi-strapi-backend.onrender.com/admin
2. Go to Content Manager
3. Verify these collection types exist:
   - ✅ Webhook Log
   - ✅ Webhook Queue
   - ✅ Order
   - ✅ Product
```

**Method 2: Check Render Logs**
```
Look for in deployment logs:
✅ Database connection established
✅ Content types synchronized
✅ Cron jobs initialized
```

**If migrations fail**:
```bash
# In Render Shell (or locally):
cd backend/strapi
npm run strapi migration:run
```

### 3.3 Test Suite Execution

**Run all tests before deploying**:

```bash
# Backend tests (from project root)
cd backend/strapi
npm run build
npm test

# Expected output:
PASS  tests/mercadopago-webhook.test.js
  ✓ 25 tests passing (webhook signature, queue, processing)

PASS  tests/orders.test.js
  ✓ Order creation and status updates

# Frontend tests (from project root)
npm test

# Expected output:
PASS  app/_tests/integration/mercadopago-payment-flow.test.tsx
  ✓ 10 tests passing (device fingerprint, payment flow)
```

**If tests fail**:
- Review test output for specific failures
- Check `/backend/strapi/tests/mercadopago-webhook.test.js` for details
- Common issues: Missing environment variables in test environment

### 3.4 Type Checking

```bash
# Frontend type checking (from project root)
npm run typecheck

# Expected: No TypeScript errors

# Backend type checking
cd backend/strapi
npx tsc --noEmit

# Expected: No TypeScript errors
```

### 3.5 Build Verification

**Build the backend locally** to catch build-time errors:

```bash
cd backend/strapi
npm run build

# Expected output:
✔ Building your app...
✔ Webpack compilation complete

# Check for errors:
❌ If build fails: Fix TypeScript errors before deploying
✅ If build succeeds: Safe to deploy
```

---

## 4. Post-Deployment Verification

### 4.1 Verify Backend Started Successfully

**Check Render Logs** (Dashboard → Logs):

```bash
# Look for these log entries (in order):

✅ Tifossi Strapi Backend is starting up...
✅ Database connection established
✅ MercadoPago service initialized successfully
   mode: PRODUCTION
   accessTokenSet: true
   publicKeySet: true
   webhookSecretSet: true
✅ Cron jobs initialized
✅ Tifossi Strapi Backend bootstrap completed
✅ Server listening on 0.0.0.0:10000
```

**Red Flags** (service will crash):
```
❌ MercadoPago configuration is invalid
❌ MercadoPago access token is required
❌ Database connection failed
❌ FIREBASE_SERVICE_ACCOUNT_KEY is required
```

### 4.2 Test Webhook Endpoint Is Reachable

**Method 1: Health Check** (verify service is up)
```bash
curl https://tifossi-strapi-backend.onrender.com/api/health

# Expected: 200 OK
{
  "status": "ok",
  "timestamp": "2025-10-22T12:00:00Z"
}
```

**Method 2: Webhook Endpoint Test** (without signature)
```bash
curl -X POST https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: 400 Bad Request (because signature missing)
{
  "error": {
    "message": "Missing required webhook data"
  }
}

# This confirms the endpoint exists and is responding
```

### 4.3 Create Test Payment in Production Mode

**CRITICAL**: Use MercadoPago test cards even in production mode to verify flow.

**Test Card for Uruguay** (always approves):
```
Card Number: 5031 7557 3453 0604
CVV: 123
Expiration: 11/25
Cardholder: APRO
ID Type: CI
ID Number: 12345678
```

**Create Test Order via Mobile App**:
1. Login to mobile app (staging or production)
2. Add item to cart
3. Go to checkout
4. Complete payment with test card above
5. Submit payment

**Expected Flow**:
```
1. Mobile app → Backend: POST /api/payment/create-preference
   Response: { preferenceId, initPoint }

2. Mobile app opens MercadoPago Checkout
   User completes payment

3. MercadoPago → Backend: POST /webhooks/mercadopago
   Webhook queued: { status: "queued", responseTime: "35ms" }

4. Cron job (30 seconds later) processes webhook
   Order status: pending → paid

5. Mobile app polls: GET /api/payment/verify/{paymentId}
   Response: { status: "paid", paymentInfo: {...} }
```

### 4.4 Verify Order Status Updates

**Check order in Strapi Admin**:
```
1. Login to: https://tifossi-strapi-backend.onrender.com/admin
2. Go to Content Manager → Orders
3. Find the test order by order number
4. Verify fields:
   - status: "paid" (if payment approved)
   - mpPaymentId: [payment ID from MercadoPago]
   - mpPaymentStatus: "approved"
   - paidAt: [timestamp]
   - metadata.paymentMethod: [card brand]
```

**Check webhook queue**:
```
1. Content Manager → Webhook Queue
2. Find the webhook by requestId
3. Verify:
   - status: "completed"
   - retryCount: 0 (no retries needed)
   - processedAt: [timestamp]
```

**Check webhook logs**:
```
1. Content Manager → Webhook Log
2. Find the webhook by requestId
3. Verify:
   - status: "success"
   - webhookType: "payment"
   - processedAt: [timestamp]
```

---

## 5. Monitoring & Troubleshooting

### 5.1 Key Metrics to Monitor

**Response Time** (target: <50ms)
```bash
# Check webhook response body
{
  "success": true,
  "status": "queued",
  "responseTime": "35ms"  ← Should be <50ms
}

# Alert if: >100ms (indicates database slowness)
```

**Webhook Queue Depth** (target: <10)
```sql
-- Run in Render PostgreSQL Shell
SELECT COUNT(*) FROM webhook_queues WHERE status = 'queued';

-- Normal: 0-10 queued items
-- Warning: 10-100 queued items (processing slower than incoming rate)
-- Critical: >100 queued items (processing bottleneck)
```

**Failed Webhooks** (target: <1%)
```sql
-- Check failure rate in last 24 hours
SELECT
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(CASE WHEN status = 'failed' THEN 1 END) / COUNT(*), 2) as failure_rate
FROM webhook_queues
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- Normal: <1% failure rate
-- Warning: 1-5% failure rate
-- Critical: >5% failure rate
```

**Webhook Processing Time** (target: <2 minutes)
```sql
-- Average time from queue to completion
SELECT
  AVG(EXTRACT(EPOCH FROM ("processedAt" - "createdAt"))) as avg_seconds
FROM webhook_queues
WHERE status = 'completed'
AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Normal: <60 seconds
-- Warning: 60-300 seconds
-- Critical: >300 seconds (5 minutes)
```

### 5.2 How to Check Webhook Logs

**Method 1: Strapi Admin UI**
```
1. Login to admin panel
2. Content Manager → Webhook Log
3. Sort by createdAt (newest first)
4. Look for recent entries with status "success"
```

**Method 2: PostgreSQL Direct Query**
```sql
-- Recent webhooks
SELECT
  "requestId",
  "webhookType",
  "status",
  "createdAt",
  "processedAt"
FROM webhook_logs
ORDER BY "createdAt" DESC
LIMIT 20;

-- Failed webhooks
SELECT * FROM webhook_logs
WHERE status = 'failed'
ORDER BY "createdAt" DESC;
```

**Method 3: Render Logs**
```bash
# In Render Dashboard → Logs, search for:
"MercadoPago webhook received"
"Webhook queued successfully"
"Processing payment notification"
"Order [number] status changed from pending to paid"

# Filter by log level:
ERROR - Critical issues
WARN - Warnings (duplicates, signature issues)
INFO - Normal operation
DEBUG - Verbose details (disabled in production)
```

### 5.3 How to Manually Retry Failed Webhooks

**Identify failed webhook**:
```sql
SELECT id, "documentId", "requestId", error
FROM webhook_queues
WHERE status = 'failed'
ORDER BY "createdAt" DESC;
```

**Option 1: Reset to Queued** (automatic retry)
```sql
UPDATE webhook_queues
SET
  status = 'queued',
  "retryCount" = 0,
  "scheduledAt" = NOW(),
  error = NULL
WHERE "documentId" = '[paste-document-id-here]';

-- Cron job will pick it up within 30 seconds
```

**Option 2: Manual Processing** (via Strapi API)
```bash
# Not implemented yet - would need custom controller
# For now, use SQL method above
```

### 5.4 Common Issues and Solutions

#### Issue 1: Webhook signature validation fails

**Symptoms**:
```
Render Logs: "Invalid webhook signature"
Webhook Log: status = "failed"
```

**Causes**:
1. Wrong `MP_WEBHOOK_SECRET` configured
2. MercadoPago dashboard webhook secret changed
3. Request not from MercadoPago (test tools with invalid signatures)

**Solution**:
```bash
# Verify secret matches MercadoPago dashboard
Dashboard → Webhooks → "Signing Secret"

# Update Render environment variable
MP_WEBHOOK_SECRET=[correct-secret-from-dashboard]

# Service will restart automatically
```

#### Issue 2: Webhooks stuck in "processing" status

**Symptoms**:
```sql
SELECT * FROM webhook_queues WHERE status = 'processing';
-- Shows webhooks stuck for >5 minutes
```

**Cause**: Cron job crashed during processing

**Solution**:
```sql
-- Reset stuck webhooks to queued
UPDATE webhook_queues
SET
  status = 'queued',
  "scheduledAt" = NOW()
WHERE status = 'processing'
AND "updatedAt" < NOW() - INTERVAL '5 minutes';
```

#### Issue 3: Payment approved but order still "pending"

**Symptoms**:
- MercadoPago shows payment approved
- Order in Strapi shows status "pending"
- No webhook log entry

**Cause**: Webhook URL not registered or unreachable

**Solution**:
```bash
# 1. Verify webhook URL in MercadoPago dashboard
Dashboard → Webhooks → Check URL is registered

# 2. Test webhook endpoint
curl -X POST https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago

# 3. Check Render service logs for incoming webhook
Render Logs → Search for "MercadoPago webhook received"

# 4. Manually verify payment status
curl https://tifossi-strapi-backend.onrender.com/api/payment/verify/[paymentId] \
  -H "Authorization: Bearer [user-jwt-token]"
```

#### Issue 4: High webhook queue depth (>100 items)

**Symptoms**:
```sql
SELECT COUNT(*) FROM webhook_queues WHERE status = 'queued';
-- Returns >100
```

**Cause**: Processing slower than incoming webhook rate

**Solution**:
```typescript
// Temporary: Increase processing frequency
// Edit: /backend/strapi/src/index.ts line 130

options: {
  rule: '*/15 * * * * *', // Every 15 seconds (was 30)
}

// And increase batch size (line 89)
limit: 20, // Process 20 per run (was 10)

// Redeploy
```

#### Issue 5: Duplicate webhooks detected

**Symptoms**:
```
Render Logs: "Duplicate webhook detected"
Webhook response: { status: "duplicate" }
```

**Cause**: MercadoPago retry mechanism (normal behavior)

**Solution**: No action needed - this is working as designed. The system prevents duplicate processing.

#### Issue 6: Test credentials used in production

**Symptoms**:
```
Render Logs: "MercadoPago service initialized in TEST mode"
Payments work but use sandbox
```

**Cause**: `NODE_ENV` not set to "production" or production credentials missing

**Solution**:
```bash
# Verify in Render Dashboard → Environment
NODE_ENV=production  ← Must be exactly "production"
MP_ACCESS_TOKEN=APP-[token]  ← Must start with APP- (not TEST-)
MP_PUBLIC_KEY=APP-[key]  ← Must start with APP- (not TEST-)

# Save and wait for service restart
```

---

## 6. Production Readiness Checklist

### 6.1 Pre-Deployment Checklist

**Code Quality**:
- [ ] All tests passing (25 backend + 10 frontend = 35 total)
- [ ] TypeScript compilation successful (no errors)
- [ ] Build completes without errors
- [ ] No critical console.log statements in production code

**Credentials**:
- [ ] MercadoPago production credentials obtained (APP-*)
- [ ] MercadoPago test credentials configured (TEST-*)
- [ ] Webhook secret generated and stored securely
- [ ] Firebase production service account JSON obtained
- [ ] Cloudinary production credentials configured

**Configuration**:
- [ ] All environment variables set in Render Dashboard (see section 3.1)
- [ ] `NODE_ENV=production` verified
- [ ] `WEBHOOK_URL` points to correct production URL
- [ ] Database connection string configured
- [ ] `PUBLIC_URL` matches Render service URL

**MercadoPago Setup**:
- [ ] Business account verified by MercadoPago
- [ ] Production credentials activated in dashboard
- [ ] Privacy Policy URL configured in MP dashboard
- [ ] Legal business information complete (RUT, legal name)

### 6.2 Deployment Checklist

**Execute Deployment**:
- [ ] Code pushed to main branch
- [ ] Render auto-deploy triggered (or manual deploy button)
- [ ] Build logs reviewed (no errors)
- [ ] Database migrations completed automatically

**Initial Verification** (within 5 minutes):
- [ ] Service status shows "Live" in Render Dashboard
- [ ] Health check endpoint returns 200 OK
- [ ] Logs show "MercadoPago service initialized successfully"
- [ ] Logs show "mode: PRODUCTION" (not TEST)
- [ ] Logs show "Cron jobs initialized"

### 6.3 Post-Deployment Checklist

**Webhook Configuration**:
- [ ] Webhook URL registered in MercadoPago dashboard
- [ ] Webhook test completed successfully (via MP dashboard)
- [ ] Webhook response time <50ms verified
- [ ] Webhook signature validation working (no "Invalid signature" errors)

**Functional Testing**:
- [ ] Test payment created using MercadoPago test card
- [ ] Payment preference created successfully
- [ ] MercadoPago checkout loaded
- [ ] Webhook received and queued (<50ms response)
- [ ] Webhook processed successfully (check queue status)
- [ ] Order status updated to "paid"
- [ ] Payment verification endpoint returns correct status

**Database Verification**:
- [ ] Order created in Strapi database
- [ ] Webhook queue entry created
- [ ] Webhook log entry created
- [ ] Order metadata contains payment details

**Monitoring Setup**:
- [ ] Render logs accessible and readable
- [ ] Strapi admin panel accessible
- [ ] Database monitoring enabled (Render PostgreSQL dashboard)
- [ ] Alert thresholds understood (queue depth, failure rate)

### 6.4 24-Hour Monitoring Plan

**Hour 0-2** (Critical Window):
- [ ] Monitor Render logs continuously
- [ ] Watch for any error messages or crashes
- [ ] Verify webhook queue is processing (every 30 seconds)
- [ ] Check no webhooks stuck in "processing" status

**Hour 2-8** (Active Monitoring):
- [ ] Check logs every 30 minutes
- [ ] Verify webhook queue depth stays <10
- [ ] Monitor failure rate stays <1%
- [ ] Test payment flow manually every 2 hours

**Hour 8-24** (Periodic Monitoring):
- [ ] Check logs every 2 hours
- [ ] Review webhook metrics (queue depth, failure rate)
- [ ] Verify cron jobs running (look for "Processing webhook queue")
- [ ] Check database disk usage (Render PostgreSQL dashboard)

**Key Metrics to Track**:
```sql
-- Run these queries every few hours

-- 1. Queue depth
SELECT COUNT(*) FROM webhook_queues WHERE status = 'queued';

-- 2. Failure rate (last 24h)
SELECT
  COUNT(CASE WHEN status = 'failed' THEN 1 END)::float / COUNT(*) * 100 as failure_pct
FROM webhook_queues
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- 3. Average processing time
SELECT
  AVG(EXTRACT(EPOCH FROM ("processedAt" - "createdAt"))) as avg_seconds
FROM webhook_queues
WHERE status = 'completed'
AND "createdAt" > NOW() - INTERVAL '1 hour';

-- 4. Recent orders
SELECT "orderNumber", status, "mpPaymentStatus", "paidAt"
FROM orders
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;
```

### 6.5 Rollback Plan

**If critical issues occur, rollback immediately**:

**Step 1: Disable webhook processing** (stop damage)
```
1. Render Dashboard → Environment
2. Add: FEATURE_PAYMENTS_ENABLED=false
3. Save (service restarts)
4. Payments disabled, but site stays up
```

**Step 2: Revert to previous deployment**
```
1. Render Dashboard → Manual Deploy
2. Select previous successful deploy from history
3. Deploy
4. Wait for service to restart (2-3 minutes)
```

**Step 3: Communicate**
```
1. Update status page (if you have one)
2. Notify users via email/social media
3. Post incident in team Slack/Discord
```

**Step 4: Investigate**
```
1. Download Render logs for analysis
2. Check Strapi error logs
3. Review webhook queue failures
4. Identify root cause before re-deploying
```

### 6.6 Success Criteria

**Production deployment is successful when**:

- [ ] Service has been live for 24 hours without crashes
- [ ] At least 3 successful test payments processed end-to-end
- [ ] Webhook queue depth consistently <10
- [ ] Webhook failure rate <1%
- [ ] Average webhook processing time <60 seconds
- [ ] No "Invalid signature" errors in logs
- [ ] Order status updates reflect MercadoPago payment status
- [ ] All cron jobs running on schedule (every 30 seconds, daily cleanup)
- [ ] Database disk usage stable (not growing unexpectedly)
- [ ] Response times <50ms for webhook endpoint

**When these criteria are met**: MercadoPago integration is production-ready and stable.

---

## Appendix: Quick Reference Commands

### Check Service Status
```bash
# Health check
curl https://tifossi-strapi-backend.onrender.com/api/health

# MercadoPago service status (requires admin JWT)
curl https://tifossi-strapi-backend.onrender.com/api/payment/status
```

### Monitor Webhook Queue
```sql
-- Queue depth
SELECT COUNT(*) FROM webhook_queues WHERE status = 'queued';

-- Recent failures
SELECT * FROM webhook_queues
WHERE status = 'failed'
AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Processing time stats
SELECT
  MIN(EXTRACT(EPOCH FROM ("processedAt" - "createdAt"))) as min_sec,
  AVG(EXTRACT(EPOCH FROM ("processedAt" - "createdAt"))) as avg_sec,
  MAX(EXTRACT(EPOCH FROM ("processedAt" - "createdAt"))) as max_sec
FROM webhook_queues
WHERE status = 'completed'
AND "createdAt" > NOW() - INTERVAL '24 hours';
```

### Reset Stuck Webhooks
```sql
-- Find stuck webhooks
SELECT * FROM webhook_queues
WHERE status = 'processing'
AND "updatedAt" < NOW() - INTERVAL '5 minutes';

-- Reset to queued
UPDATE webhook_queues
SET status = 'queued', "scheduledAt" = NOW()
WHERE status = 'processing'
AND "updatedAt" < NOW() - INTERVAL '5 minutes';
```

### Test MercadoPago API
```bash
# Test production credentials
curl -X GET 'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer [MP_ACCESS_TOKEN]'

# Get payment details
curl -X GET 'https://api.mercadopago.com/v1/payments/[PAYMENT_ID]' \
  -H 'Authorization: Bearer [MP_ACCESS_TOKEN]'
```

---

## Related Documentation

- **Session State**: `/docs/MERCADOPAGO_SESSION_STATE.md` - Complete implementation history
- **Deployment Guide**: `/docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md` - Full deployment process
- **Quick Reference**: `/docs/deployment/TROUBLESHOOTING_QUICK_REFERENCE.md` - Common issues
- **Async Webhooks**: `/docs/ASYNC_WEBHOOK_IMPLEMENTATION.md` - Webhook architecture details
- **Device Fingerprint**: `/docs/DEVICE_FINGERPRINT_IMPLEMENTATION.md` - Fraud prevention setup

---

**Document Version**: 1.0
**Last Reviewed**: 2025-10-22
**Next Review**: After first production payment
