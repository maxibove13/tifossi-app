# Tifossi Production Deployment - Quick Checklist

**Quick Reference**: Complete this checklist before deploying to production.
**Full Guide**: See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## Critical Pre-Flight Checks

### 1. Code Fixes (BLOCKING)

- [ ] **Backend Payment Service** - Fix constructor error in `mercadopago-service.ts`
- [ ] **iOS Entitlements** - Add Apple Sign-In capability to `tifossi.entitlements`
- [ ] **Privacy Manifest** - Add all data types to `PrivacyInfo.xcprivacy`
- [ ] **ATT Permission** - Add `NSUserTrackingUsageDescription` to Info.plist
- [ ] **Bundle ID** - Update `app.json` to use `com.tifossi.app`
- [ ] **URL Scheme** - Change from `myapp` to `tifossi` in Info.plist

### 2. Credentials Required

- [ ] **MercadoPago Production**
  - [ ] Access Token (APP-...)
  - [ ] Public Key (APP-...)
  - [ ] Webhook Secret (64-char hex)

- [ ] **Firebase Production**
  - [ ] Service Account JSON
  - [ ] Project created and configured
  - [ ] Apple Sign-In enabled with Team ID

- [ ] **Cloudinary**
  - [ ] Cloud Name
  - [ ] API Key
  - [ ] API Secret

### 3. MercadoPago Activation

- [ ] Complete business information in Developer Dashboard
- [ ] Submit for production approval (1-2 business days)
- [ ] Copy production credentials
- [ ] Test credentials with simple API call

### 4. Render Configuration

- [ ] Add all production environment variables
- [ ] Verify `NODE_ENV=production`
- [ ] Set `MP_ACCESS_TOKEN` (production)
- [ ] Set `FIREBASE_SERVICE_ACCOUNT_KEY`
- [ ] Set Cloudinary credentials
- [ ] Save and deploy

### 5. Webhook Setup

- [ ] Register webhook URL with MercadoPago
- [ ] Subscribe to topics: payment, merchant_order, chargebacks
- [ ] Test webhook with simulation
- [ ] Verify webhook logs in database

### 6. Deployment

- [ ] Run `npm run typecheck` - 0 errors
- [ ] Run `npm run lint` - 0 critical errors
- [ ] Run `npm test` - All passing
- [ ] Push to main branch (triggers auto-deploy)
- [ ] Monitor deployment logs

### 7. Post-Deployment Verification

- [ ] Health check: `curl https://tifossi-strapi-backend.onrender.com/_health`
- [ ] Check logs for: "MercadoPago service initialized in PRODUCTION mode"
- [ ] Admin panel accessible
- [ ] **Privacy policy accessible**: `curl https://tifossi-strapi-backend.onrender.com/privacy.html`
- [ ] **Verify business contact info** in privacy policy (TIFFOSI S.A.S, InfoTiffosiuy@gmail.com)
- [ ] Create test order ($1 UYU)
- [ ] Complete test payment with MercadoPago test card
- [ ] Verify webhook received and order updated to PAID

---

## Quick Commands

**Health Check**:
```bash
curl https://tifossi-strapi-backend.onrender.com/_health
```

**Watch Logs**:
```bash
render logs tifossi-strapi-backend --tail
```

**Test Payment**:
- Card: 5031 4332 1540 6351
- CVV: 123
- Name: APRO
- Expiration: Any future date

---

## Emergency Contacts

**Rollback Procedure**: See Section 10 in full guide

**Critical Issues**:
1. Go to Render Dashboard
2. Click "Rollback" to previous deployment
3. Downtime: ~2-3 minutes

---

## Status Check

**Production URL**: https://tifossi-strapi-backend.onrender.com
**Admin Panel**: https://tifossi-strapi-backend.onrender.com/admin
**Application ID**: 4166909433694983

**Expected Costs**:
- Infrastructure: $35/month
- MercadoPago: 5.23% per transaction
- Firebase Auth: Free (up to 10k users)

---

**Once all items checked**: You're ready for production deployment!

Refer to `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.
