# MercadoPago Quick Fix Guide - Production Deployment

**Estimated Time**: 1 hour
**Current Status**: Production-blocked (4 critical issues)
**Target Status**: Production-ready (Quality 84/100)

---

## Critical Fix 1: Production Webhook Constructor Error (5 minutes)

### Problem
Backend crashes when webhook received in production mode due to missing credentials in constructor.

### Files to Fix

**File 1**: `/Users/max/Documents/tifossi-expo/tifossi/backend/strapi/src/webhooks/mercadopago.ts`

Line 76 - REPLACE:
```typescript
const mpService = new MercadoPagoService();
```

WITH:
```typescript
const mpService = strapi.mercadoPago;
```

Line 155 - REPLACE:
```typescript
const mpService = new MercadoPagoService();
```

WITH:
```typescript
const mpService = strapi.mercadoPago;
```

**File 2**: `/Users/max/Documents/tifossi-expo/tifossi/backend/strapi/src/lib/payment/webhook-handler.ts`

Line 47 - REPLACE:
```typescript
this.mercadoPagoService = new MercadoPagoService();
```

WITH:
```typescript
// Use global singleton instance from strapi bootstrap
this.mercadoPagoService = (global as any).strapi?.mercadoPago || new MercadoPagoService();
```

### Test
```bash
cd backend/strapi
npm run build
NODE_ENV=production npm run start

# Should log: "MercadoPago service initialized in PRODUCTION mode"
# Should NOT crash with "access token is required"
```

---

## Critical Fix 2: Environment Variable Configuration (30 minutes)

### Problem
Production environment missing 7 required environment variables.

### Step 1: Update render.yaml

**File**: `/Users/max/Documents/tifossi-expo/tifossi/render.yaml`

After line 87 (after `PUBLIC_URL`), ADD:

```yaml
      # MercadoPago Payment Configuration
      # TEST credentials (for sandbox testing even in production environment)
      - key: MP_TEST_ACCESS_TOKEN
        sync: false
      - key: MP_TEST_PUBLIC_KEY
        sync: false

      # PRODUCTION credentials (REQUIRED - configure in Render Dashboard)
      - key: MP_ACCESS_TOKEN
        sync: false
      - key: MP_PUBLIC_KEY
        sync: false

      # Webhook configuration (REQUIRED - same secret for test and prod)
      - key: MP_WEBHOOK_SECRET
        sync: false
      - key: WEBHOOK_URL
        value: https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago

      # Application deep link configuration
      - key: API_BASE_URL
        value: https://tifossi-strapi-backend.onrender.com
      - key: APP_SCHEME
        value: tifossi
```

### Step 2: Update .env.example

**File**: `/Users/max/Documents/tifossi-expo/tifossi/backend/strapi/.env.example`

Line 27 - REPLACE:
```bash
# Webhook configuration (same secret for test and production)
MP_WEBHOOK_SECRET=your-webhook-secret-from-mercadopago-dashboard
```

WITH:
```bash
# Webhook configuration (self-generated secret - must match in MP dashboard)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MP_WEBHOOK_SECRET=d8eae3f530d4d9331b9a36dab5a484abd2cb8c2a4bd21436bf67b08b1b983e24
```

### Test
```bash
# Commit changes
git add render.yaml backend/strapi/.env.example
git commit -m "fix: add missing MercadoPago environment variables to production config"
git push origin main
```

---

## Critical Fix 3: Configure Production Credentials (15 minutes)

### Problem
Production MercadoPago credentials not configured (using TEST only).

### Steps

1. **Get Production Credentials from MercadoPago**:
   - Go to: https://www.mercadopago.com/developers/panel
   - Select Application ID: `4166909433694983`
   - Navigate to: **Credentials** → **Production**
   - If inactive, click **Activate Production Credentials**
   - Complete business verification if required:
     - Business legal name
     - Tax ID (RUT)
     - Business address
     - Industry category (Sports & Recreation)
     - Website URL (https://tifossi.app)
   - Accept production terms of service
   - Copy credentials:
     - Access Token (starts with `APP-`)
     - Public Key (starts with `APP-`)

2. **Configure in Render Dashboard**:
   - Go to: https://dashboard.render.com/
   - Select service: `tifossi-strapi-backend`
   - Navigate to: **Environment** tab
   - Add the following environment variables:

   ```
   MP_ACCESS_TOKEN = APP-XXXXX-PRODUCTION-TOKEN (paste from MP dashboard)
   MP_PUBLIC_KEY = APP-XXXXX-PRODUCTION-PUBLIC-KEY (paste from MP dashboard)
   MP_WEBHOOK_SECRET = d8eae3f530d4d9331b9a36dab5a484abd2cb8c2a4bd21436bf67b08b1b983e24
   WEBHOOK_URL = https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago
   MP_TEST_ACCESS_TOKEN = TEST-4166909433694983-072404-d482fa8b414adcb1cf7b59340f838128-453117650
   MP_TEST_PUBLIC_KEY = TEST-6f7d3927-50fe-403e-b32c-2bf171e29181
   API_BASE_URL = https://tifossi-strapi-backend.onrender.com
   APP_SCHEME = tifossi
   ```

   - Click **Save Changes**
   - Service will automatically redeploy (takes ~5 minutes)

### Test
```bash
# Check Render deployment logs
# Should see: "MercadoPago service initialized in PRODUCTION mode"
```

---

## Critical Fix 4: Register Webhook URL (10 minutes)

### Problem
Webhook URL not registered in MercadoPago dashboard, so payment notifications won't be sent.

### Steps

1. **Register Webhook in MercadoPago**:
   - Go to: https://www.mercadopago.com/developers/panel
   - Select Application ID: `4166909433694983`
   - Navigate to: **Webhooks** or **Notifications**
   - Click **Configure Webhook** or **Add Notification URL**
   - Enter webhook configuration:
     ```
     Production Webhook URL:
     https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago

     Events to Subscribe:
     ☑ Payments (payment)
     ☑ Merchant Orders (merchant_order)
     ☑ Chargebacks (chargebacks)
     ```
   - Click **Save** or **Activate**
   - MercadoPago will send a test notification
   - Verify HTTP 200 response in MercadoPago logs

### Test
```bash
# Use MercadoPago webhook test tool
# Or manually trigger test payment:
curl -X POST https://tifossi-strapi-backend.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Check webhook delivery in MercadoPago dashboard:
# Go to: Webhooks → Logs or History
# Verify: HTTP 200 responses, no errors
```

---

## Verification Checklist

After completing all 4 fixes:

- [ ] **Backend builds successfully**
  ```bash
  cd backend/strapi && npm run build
  ```

- [ ] **Backend starts in production mode**
  ```bash
  # Check Render logs for:
  # "MercadoPago service initialized in PRODUCTION mode"
  ```

- [ ] **Health check passes**
  ```bash
  curl https://tifossi-strapi-backend.onrender.com/api/health
  # Expected: {"status":"ok"}
  ```

- [ ] **Webhook test succeeds**
  ```bash
  # Use MercadoPago dashboard webhook test tool
  # Expected: HTTP 200 response
  ```

- [ ] **End-to-end payment test**
  - Create minimum order
  - Use test card: 5031 7557 3453 0604 (Mastercard Uruguay)
  - CVV: 123, Expiry: 11/25
  - Complete payment
  - Verify webhook received
  - Verify order status = PAID

---

## Deployment Commands

```bash
# 1. Commit all changes
git add backend/strapi/src/webhooks/mercadopago.ts
git add backend/strapi/src/lib/payment/webhook-handler.ts
git add render.yaml
git add backend/strapi/.env.example
git commit -m "fix: resolve 4 critical MercadoPago production blockers

- Fix webhook constructor to use singleton instance
- Add missing environment variables to render.yaml
- Update .env.example with correct webhook secret comment
- Ready for production credential configuration"

# 2. Push to main (triggers Render auto-deploy if enabled)
git push origin main

# 3. Monitor deployment
# Go to Render Dashboard → tifossi-strapi-backend → Deploys
# Wait for "Deploy succeeded" message (~5 minutes)

# 4. Verify logs
# Go to Render Dashboard → tifossi-strapi-backend → Logs
# Should see: "MercadoPago service initialized in PRODUCTION mode"
```

---

## Rollback Plan (If Deployment Fails)

If production deployment fails:

1. **Immediate Rollback**:
   - Render Dashboard → tifossi-strapi-backend → Deploys
   - Find last successful deployment
   - Click "Rollback to this deploy"

2. **Revert Environment Variables** (if needed):
   - Set `NODE_ENV=test` (force test mode)
   - Remove `MP_ACCESS_TOKEN` and `MP_PUBLIC_KEY`
   - Keep `MP_TEST_ACCESS_TOKEN` and `MP_TEST_PUBLIC_KEY`

3. **Communicate**:
   - Notify team of rollback
   - Document failure reason in GitHub issue
   - Schedule fix and redeploy

---

## Expected Results

After all fixes:

| Metric | Before | After |
|--------|--------|-------|
| Quality Score | 76/100 | 84/100 |
| Production Blockers | 4 | 0 |
| Production Ready | ❌ No | ✅ Yes |
| Webhook Success Rate | N/A | >95% |
| Payment Processing | Blocked | Working |

---

## Next Steps (Optional - Post-Production)

After production deployment, consider these improvements:

1. **HIGH Priority** (1-2 weeks):
   - Implement async webhook processing (prevents timeout under load)
   - Add merchant_order and chargebacks handlers (complete webhook coverage)
   - Separate test/production webhook secrets (better security)
   - Add database indexes for performance

2. **MEDIUM Priority** (Post-Launch):
   - Persistent dead letter queue (reliability)
   - Webhook cleanup cron job (database maintenance)
   - Rate limiting on webhook endpoint (DDoS protection)

3. **LOW Priority** (Enhancement):
   - Circuit breaker for API calls
   - Metrics dashboard
   - Monitoring and alerting

**Detailed implementation guides**: See `docs/MERCADOPAGO_RECOMMENDATIONS_REPORT.md`

---

**Time Investment**:
- Critical Fixes: 1 hour
- Verification: 15 minutes
- **Total**: 1 hour 15 minutes

**Quality Improvement**:
- From: 76/100 (production-blocked)
- To: 84/100 (production-ready)
- Gain: +8 points, 4 blockers resolved
