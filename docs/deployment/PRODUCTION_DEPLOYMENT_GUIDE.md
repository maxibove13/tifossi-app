# Tifossi Production Deployment Guide

**Version**: 1.0
**Last Updated**: 2025-10-21
**Target Environment**: Render.com Production
**Application ID**: 4166909433694983
**Production URL**: https://tifossi-strapi-backend.onrender.com

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [MercadoPago Production Activation](#2-mercadopago-production-activation)
3. [Render Dashboard Configuration](#3-render-dashboard-configuration)
4. [Webhook Registration](#4-webhook-registration)
5. [Firebase Production Setup](#5-firebase-production-setup)
6. [Code Fixes Required](#6-code-fixes-required)
7. [Deployment Procedure](#7-deployment-procedure)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Monitoring Setup](#9-monitoring-setup)
10. [Rollback Procedures](#10-rollback-procedures)
11. [Troubleshooting Guide](#11-troubleshooting-guide)
12. [Production Support Runbook](#12-production-support-runbook)

---

## 1. Pre-Deployment Checklist

**CRITICAL**: Complete ALL items before deploying to production.

### 1.1 Code Review Checklist

- [ ] **Backend Payment Service Error**
  - File: `backend/strapi/src/lib/payment/mercadopago-service.ts`
  - Issue: Constructor throws error if credentials missing (lines 87-101)
  - Impact: Backend crashes on startup without production credentials
  - Fix Required: Add graceful fallback or default values

- [ ] **Bundle ID Consistency**
  - Current: `app.json` uses `com.anonymous.tifossi`
  - Production: `eas.json` uses `com.tifossi.app`
  - Action: Update `app.json` to match production bundle ID

- [ ] **Environment Variables Documentation**
  - Review: `render.yaml` lines 102-143
  - Ensure all REQUIRED variables are listed
  - Verify no secrets are hardcoded

- [ ] **Test Suite Status**
  - Backend: 20/20 tests passing ✅
  - Frontend: 9/10 tests passing (1 skipped)
  - Action: No blockers

### 1.2 Credentials Checklist

**REQUIRED - MercadoPago**:
- [ ] Production Access Token (starts with `APP-`)
- [ ] Production Public Key (starts with `APP-`)
- [ ] Production Webhook Secret (64-character hex string)

**REQUIRED - Firebase**:
- [ ] Production Service Account JSON
- [ ] Project ID verified
- [ ] Authentication methods enabled (Email, Apple Sign-In)

**REQUIRED - Cloudinary**:
- [ ] Production Cloud Name
- [ ] Production API Key
- [ ] Production API Secret

**REQUIRED - Database**:
- [ ] PostgreSQL connection string from Render
- [ ] SSL certificate configuration

### 1.3 App Store Compliance Checklist

**CRITICAL BLOCKERS** (must fix before submission):

- [ ] **iOS Entitlements File** (BLOCKING)
  - File: `ios/tifossi/tifossi.entitlements` is EMPTY
  - Must add: Apple Sign-In capability, Associated Domains
  - Risk: App crashes on Apple Sign-In button tap

- [ ] **Privacy Manifest Data Collection** (BLOCKING)
  - File: `ios/tifossi/PrivacyInfo.xcprivacy`
  - Issue: `NSPrivacyCollectedDataTypes` array is empty
  - Must declare: Name, Email, Phone, Address, Purchase History, etc.
  - Risk: Automatic rejection

- [ ] **App Tracking Transparency** (BLOCKING)
  - Missing: `NSUserTrackingUsageDescription` in Info.plist
  - Analytics enabled but no ATT permission requested
  - Risk: Legal violation, instant rejection

- [ ] **Production Code Quality**
  - 83 `console.log` statements need removal
  - Generic URL scheme `myapp` should be `tifossi`
  - Unnecessary microphone permission should be removed

---

## 2. MercadoPago Production Activation

### 2.1 Access MercadoPago Developer Dashboard

1. **Navigate to**: https://www.mercadopago.com.uy/developers
2. **Login** with your MercadoPago business account
3. **Select Application**: Application ID `4166909433694983`

### 2.2 Complete Application Information

**REQUIRED** before production activation:

1. **Business Details**:
   - Industry: `E-commerce / Retail`
   - Sub-category: `Clothing and Accessories`
   - Business Name: `Tifossi Sport`
   - Legal Name: `[Your full legal business name]`
   - Tax ID (RUT): `[Your Uruguay RUT]`

2. **Website Information**:
   - Website URL: `https://tifossi.app` (or your domain)
   - Privacy Policy URL: `https://tifossi-strapi-backend.onrender.com/privacy.html`
   - Terms of Service URL: `[Your terms URL]`

3. **Contact Information**:
   - Business Email: `info@tifossi.com`
   - Business Phone: `[Your Uruguay phone number]`
   - Business Address: `[Your complete address in Uruguay]`

4. **Payment Methods** to activate:
   - ✅ Credit/Debit Cards
   - ✅ MercadoPago Account Balance
   - ✅ Cash Payment (Abitab, Red Pagos) - if needed

### 2.3 Activate Production Credentials

1. **In Developer Dashboard**:
   - Go to **Credentials** section
   - Click **Production** tab (currently showing "Not Activated")
   - Review and accept **Production Terms of Service**

2. **Verify Business Information**:
   - MercadoPago may require additional verification
   - Expected verification time: 1-2 business days
   - You'll receive email confirmation when approved

3. **Copy Production Credentials**:
   ```
   Production Access Token: APP-XXXXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
   Production Public Key:   APP-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

4. **Test Credentials** (verify they work):
   ```bash
   curl -X GET \
     'https://api.mercadopago.com/v1/payment_methods' \
     -H 'Authorization: Bearer APP-YOUR-PRODUCTION-TOKEN'
   ```

   Expected response: JSON array of payment methods available in Uruguay

### 2.4 Generate Production Webhook Secret

**Option 1: Use MercadoPago Dashboard Secret** (recommended)
- Go to **Webhooks** section in Developer Dashboard
- Look for "Webhook Secret" or "Signing Secret"
- Copy the provided secret

**Option 2: Generate Your Own Secret**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**IMPORTANT**:
- Store this secret securely (password manager recommended)
- NEVER commit to version control
- Use same secret for test and production (or separate if preferred)

---

## 3. Render Dashboard Configuration

### 3.1 Access Render Service

1. **Login** to https://dashboard.render.com
2. **Navigate** to `tifossi-strapi-backend` service
3. **Go to** "Environment" tab

### 3.2 Production Environment Variables

**Copy these variables into Render Dashboard** (replace placeholder values):

```bash
# ============================================
# CRITICAL - MERCADOPAGO PRODUCTION CREDENTIALS
# ============================================
MP_ACCESS_TOKEN=APP-[paste-production-access-token-here]
MP_PUBLIC_KEY=APP-[paste-production-public-key-here]
MP_WEBHOOK_SECRET=[paste-production-webhook-secret-here]

# MercadoPago Test Credentials (keep for testing)
MP_TEST_ACCESS_TOKEN=TEST-[your-test-token]
MP_TEST_PUBLIC_KEY=TEST-[your-test-public-key]

# Webhook Configuration
WEBHOOK_URL=https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago

# ============================================
# FIREBASE PRODUCTION CREDENTIALS (REQUIRED)
# ============================================
# Option 1: Full Service Account JSON (RECOMMENDED)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tifossi-production","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@tifossi-production.iam.gserviceaccount.com"}

# Option 2: Individual Fields (if not using JSON above)
# FIREBASE_PROJECT_ID=tifossi-production
# FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tifossi-production.iam.gserviceaccount.com

# ============================================
# CLOUDINARY PRODUCTION CREDENTIALS
# ============================================
CLOUDINARY_NAME=[your-cloudinary-cloud-name]
CLOUDINARY_KEY=[your-cloudinary-api-key]
CLOUDINARY_SECRET=[your-cloudinary-api-secret]
UPLOAD_PROVIDER=cloudinary

# ============================================
# DATABASE CONFIGURATION (FROM RENDER)
# ============================================
DATABASE_CLIENT=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Database URL is auto-set by Render PostgreSQL service
# DATABASE_URL=[automatically set by Render]

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV=production
HOST=0.0.0.0
PORT=10000

# Public URLs
PUBLIC_URL=https://tifossi-strapi-backend.onrender.com
API_BASE_URL=https://tifossi-strapi-backend.onrender.com
FRONTEND_URL=https://tifossi.app

# Application Scheme (for deep linking)
APP_SCHEME=tifossi

# Business Information
BUSINESS_NAME=Tifossi Sport
BUSINESS_EMAIL=info@tifossi.com
BUSINESS_LEGAL_NAME=[Your full legal business name]
BUSINESS_ADDRESS=[Your complete business address]
PRIVACY_CONTACT_EMAIL=info@tifossi.com

# Currency and Locale
DEFAULT_CURRENCY=UYU
DEFAULT_LOCALE=es
SUPPORTED_LOCALES=es,en,pt

# ============================================
# FEATURE FLAGS
# ============================================
FEATURE_EMAIL_NOTIFICATIONS=false
ADMIN_PANEL_ENABLED=true
API_DOCUMENTATION_ENABLED=false

# ============================================
# SECURITY CONFIGURATION
# ============================================
# CORS Origins (comma-separated)
CORS_ORIGINS=https://tifossi.app,https://www.tifossi.app,https://admin.tifossi.app

# Rate Limiting
AUTH_RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_DURATION=60000

# Proxy Configuration (for Render)
IS_PROXIED=true

# ============================================
# PERFORMANCE & MONITORING
# ============================================
GRACEFUL_SHUTDOWN_TIMEOUT=30000
MAX_REQUEST_SIZE=50mb
UPLOAD_SIZE_LIMIT=200000000

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/api/health

# Telemetry
STRAPI_TELEMETRY_DISABLED=true

# ============================================
# OPTIONAL - EMAIL CONFIGURATION
# ============================================
# Uncomment when ready to enable email notifications
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=info@tifossi.com
# SMTP_PASSWORD=[your-app-password]
# EMAIL_FROM=info@tifossi.com
# EMAIL_REPLY_TO=support@tifossi.com

# ============================================
# OPTIONAL - ERROR MONITORING
# ============================================
# SENTRY_DSN=[your-sentry-dsn]
```

### 3.3 Save and Deploy

1. **After adding all variables**:
   - Click **"Save Changes"** button
   - Render will ask: "This will redeploy your service. Continue?"
   - Click **"Save & Deploy"**

2. **Monitor Deployment**:
   - Go to **"Events"** tab
   - Watch deployment progress
   - Expected time: 3-5 minutes

3. **Verify Deployment**:
   - Wait for "Deploy succeeded" event
   - Check **"Logs"** tab for errors
   - Look for: `MercadoPago service initialized in PRODUCTION mode`

---

## 4. Webhook Registration

### 4.1 Option A: Using MercadoPago MCP Tool (RECOMMENDED)

**Prerequisites**:
- MercadoPago credentials configured in Render
- Backend deployed and healthy

**Execute Webhook Registration**:

```bash
# This would be done via the MCP tool interface
mcp__mercadopago__save_webhook({
  callback: "https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago",
  callback_sandbox: "https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago",
  topics: [
    "payment",                    // Payment status updates (CRITICAL)
    "topic_merchant_order_wh",    // Order completion events
    "topic_chargebacks_wh",       // Chargeback alerts
    "stop_delivery_op_wh",        // Fraud prevention alerts
    "topic_claims_integration_wh" // Customer disputes
  ]
})
```

**Expected Response**:
```json
{
  "success": true,
  "webhook_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "url": "https://tifossi-strapi-backend.onrender.com/webhooks/mercadopago",
  "topics": ["payment", "topic_merchant_order_wh", ...]
}
```

### 4.2 Option B: Manual Configuration via Dashboard

1. **Access MercadoPago Developer Dashboard**:
   - Go to https://www.mercadopago.com.uy/developers
   - Select your application (ID: 4166909433694983)
   - Navigate to **"Webhooks"** section

2. **Add New Webhook**:
   - Click **"Add webhook"** or **"Configure webhooks"**
   - URL: `https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago`
   - Environment: **Production**

3. **Select Topics** (check these boxes):
   - ✅ **Payments** (`payment`)
   - ✅ **Merchant Orders** (`topic_merchant_order_wh`)
   - ✅ **Chargebacks** (`topic_chargebacks_wh`)
   - ✅ **Fraud Alerts** (`stop_delivery_op_wh`)
   - ✅ **Claims** (`topic_claims_integration_wh`)

4. **Save Configuration**:
   - Click **"Save"**
   - MercadoPago will send a test webhook immediately
   - Check your Render logs for confirmation

### 4.3 Verify Webhook Registration

```bash
# Check Render logs for webhook test
render logs tifossi-strapi-backend --tail

# Look for log entries like:
# "MercadoPago webhook received: payment"
# "Webhook processed successfully"
```

### 4.4 Test Webhook with Simulation

**Using MCP Tool**:
```bash
mcp__mercadopago__simulate_webhook({
  topic: "payment",
  resource_id: "[test-payment-id]",
  callback_env_production: true
})
```

**Expected Logs**:
- Webhook signature verification: ✅ Valid
- Webhook deduplication check: ✅ Passed
- Payment data retrieval: ✅ Success
- Order status update: ✅ Completed

---

## 5. Firebase Production Setup

**IMPORTANT**: Follow this guide: `docs/guides/FIREBASE_SETUP_GUIDE.md`

### 5.1 Quick Setup Steps

1. **Create Production Firebase Project**:
   - Project Name: `tifossi-production`
   - Project ID: `tifossi-production` (or auto-generated)
   - Location: Uruguay or closest region

2. **Add iOS App**:
   - Bundle ID: `com.tifossi.app` (production)
   - Download `GoogleService-Info.plist`
   - Place in `ios/` folder

3. **Add Android App** (when ready):
   - Package: `com.tifossi.app`
   - Download `google-services.json`
   - Place in `android/app/`

4. **Enable Authentication**:
   - Email/Password: ✅ Enable
   - Apple Sign-In: ✅ Enable (add Apple Team ID)
   - Google Sign-In: ✅ Enable (optional)

5. **Generate Service Account**:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download JSON file
   - **SECURELY** copy JSON content to Render environment variable `FIREBASE_SERVICE_ACCOUNT_KEY`

### 5.2 Frontend Environment Configuration

Create `.env.production` in project root:

```bash
# Firebase Production Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tifossi-production.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tifossi-production
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tifossi-production.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:ios:abcdef1234567890
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# API Configuration
EXPO_PUBLIC_API_URL=https://tifossi-strapi-backend.onrender.com
EXPO_PUBLIC_ENVIRONMENT=production
```

---

## 6. Code Fixes Required

**CRITICAL**: These must be fixed BEFORE production deployment.

### 6.1 Backend Payment Service Constructor Fix

**File**: `backend/strapi/src/lib/payment/mercadopago-service.ts`

**Current Code** (lines 87-101):
```typescript
if (!this.accessToken) {
  throw new Error('MercadoPago access token is required');
}

if (!this.publicKey) {
  throw new Error('MercadoPago public key is required');
}

if (!this.webhookSecret) {
  throw new Error(
    'MercadoPago webhook secret is required for signature verification. ' +
      'Set MP_WEBHOOK_SECRET environment variable.'
  );
}
```

**PROBLEM**: Backend crashes on startup if credentials missing.

**FIX Option 1** - Graceful Degradation (RECOMMENDED):
```typescript
if (!this.accessToken) {
  console.warn('⚠️ MercadoPago access token not configured - payments disabled');
  this.isConfigured = false;
}

if (!this.publicKey) {
  console.warn('⚠️ MercadoPago public key not configured - payments disabled');
  this.isConfigured = false;
}

if (!this.webhookSecret) {
  console.warn('⚠️ MercadoPago webhook secret not configured - webhook verification disabled');
  this.isConfigured = false;
}

// Add to all payment methods:
if (!this.isConfigured) {
  throw new Error('Payment service not configured - please contact support');
}
```

**FIX Option 2** - Environment Check (ALTERNATIVE):
```typescript
// Only throw error in production mode
if (!this.accessToken && this.isProduction) {
  throw new Error('Production MercadoPago access token is required');
}

if (!this.publicKey && this.isProduction) {
  throw new Error('Production MercadoPago public key is required');
}
```

### 6.2 Bundle ID Consistency Fix

**File**: `app.json`

**Change**:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tifossi.app"  // Changed from com.anonymous.tifossi
    },
    "android": {
      "package": "com.tifossi.app"  // Changed from com.anonymous.tifossi
    }
  }
}
```

### 6.3 iOS Entitlements Fix (CRITICAL)

**File**: `ios/tifossi/tifossi.entitlements`

**Current** (BROKEN):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict/>
</plist>
```

**Fixed**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Apple Sign-In Capability -->
  <key>com.apple.developer.applesignin</key>
  <array>
    <string>Default</string>
  </array>

  <!-- Associated Domains (for deep linking) -->
  <key>com.apple.developer.associated-domains</key>
  <array>
    <string>applinks:tifossi.app</string>
    <string>applinks:www.tifossi.app</string>
  </array>
</dict>
</plist>
```

### 6.4 Privacy Manifest Fix (CRITICAL)

**File**: `ios/tifossi/PrivacyInfo.xcprivacy`

**Add to `NSPrivacyCollectedDataTypes` array**:
```xml
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypeName</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
  </array>
</dict>
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypeEmailAddress</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
    <string>NSPrivacyCollectedDataTypePurposeProductPersonalization</string>
  </array>
</dict>
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypePhoneNumber</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
  </array>
</dict>
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypePhysicalAddress</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
  </array>
</dict>
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypePurchaseHistory</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
  </array>
</dict>
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypeUserID</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
  </array>
</dict>
<dict>
  <key>NSPrivacyCollectedDataType</key>
  <string>NSPrivacyCollectedDataTypeProductInteraction</string>
  <key>NSPrivacyCollectedDataTypeLinked</key>
  <true/>
  <key>NSPrivacyCollectedDataTypeTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypePurposes</key>
  <array>
    <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
    <string>NSPrivacyCollectedDataTypePurposeProductPersonalization</string>
  </array>
</dict>
```

### 6.5 App Tracking Transparency Fix (CRITICAL)

**File**: `ios/tifossi/Info.plist`

**Add before closing `</dict>`**:
```xml
<key>NSUserTrackingUsageDescription</key>
<string>Usamos esta información para mejorar tu experiencia de compra y mostrarte productos relevantes</string>
```

### 6.6 URL Scheme Fix

**File**: `ios/tifossi/Info.plist`

**Change** (line 30):
```xml
<!-- BEFORE -->
<string>myapp</string>

<!-- AFTER -->
<string>tifossi</string>
```

### 6.7 Remove Unused Microphone Permission

**File**: `ios/tifossi/Info.plist`

**Remove** (if exists):
```xml
<key>NSMicrophoneUsageDescription</key>
<string>...</string>
```

---

## 7. Deployment Procedure

### 7.1 Pre-Deployment Verification

**Run ALL checks locally**:

```bash
# 1. Type checking
npm run typecheck

# Expected: 0 errors
# If errors found: DO NOT DEPLOY

# 2. Linting
npm run lint

# Expected: 0 errors (warnings acceptable)

# 3. Tests
npm test

# Expected: All critical tests passing

# 4. Build verification (backend)
cd backend/strapi
npm run build

# Expected: Build completes without errors
```

### 7.2 Backend Deployment Steps

**Method 1: Automatic via GitHub Actions** (RECOMMENDED)

1. **Commit code fixes**:
   ```bash
   git add .
   git commit -m "fix: production deployment configuration"
   ```

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **GitHub Actions triggers automatically**:
   - Go to https://github.com/[your-repo]/actions
   - Watch workflow execution
   - Expected: "Deploy to Render" completes successfully

4. **Render deploys automatically**:
   - Webhook triggers Render deployment
   - Monitor at https://dashboard.render.com

**Method 2: Manual Deployment via Render Dashboard**

1. **Go to Render Dashboard**:
   - Navigate to `tifossi-strapi-backend` service
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

2. **Monitor Deployment**:
   - Watch "Events" tab
   - Expected time: 3-5 minutes

3. **Check Logs**:
   - Go to "Logs" tab
   - Look for startup messages
   - Verify: `MercadoPago service initialized in PRODUCTION mode`

### 7.3 Frontend Deployment (Mobile App)

**iOS Build**:
```bash
# 1. Install dependencies
npm install

# 2. Build iOS app with EAS
eas build --platform ios --profile production

# 3. Submit to App Store (when ready)
eas submit --platform ios
```

**Android Build** (when ready):
```bash
# 1. Build Android app
eas build --platform android --profile production

# 2. Submit to Google Play
eas submit --platform android
```

---

## 8. Post-Deployment Verification

### 8.1 Backend Health Checks

**Step 1: Verify Service is Running**

```bash
# Health check endpoint
curl https://tifossi-strapi-backend.onrender.com/_health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-21T...",
  "uptime": 123.45
}
```

**Step 2: Verify MercadoPago Initialization**

```bash
# Check Render logs
render logs tifossi-strapi-backend --tail

# Look for:
# ✅ "MercadoPago service initialized in PRODUCTION mode"
# ✅ "Webhook handler registered at /webhooks/mercadopago"
# ❌ Any errors mentioning "MercadoPago" or "payment"
```

**Step 3: Verify Database Connection**

```bash
# Check logs for database connection
render logs tifossi-strapi-backend | grep -i "database\|postgres"

# Expected:
# ✅ "Connected to database"
# ✅ No connection errors
```

**Step 4: Verify Admin Panel Access**

```bash
# Open in browser
open https://tifossi-strapi-backend.onrender.com/admin

# Expected:
# ✅ Login page loads without errors
# ✅ Can login with admin credentials
# ✅ Dashboard loads without 500 errors
```

### 8.2 MercadoPago Integration Tests

**Test 1: Webhook Endpoint Accessibility**

```bash
# Test webhook endpoint responds
curl -X POST https://tifossi-strapi-backend.onrender.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: 200 OK (even if payload invalid)
```

**Test 2: Create Test Payment Preference**

```bash
# Using Strapi API (requires authentication)
# Create small test order via mobile app
# OR use Strapi admin panel to create test order

# Expected:
# ✅ Payment preference created successfully
# ✅ MercadoPago preference ID returned
# ✅ No errors in Render logs
```

**Test 3: Simulate Webhook Notification**

```bash
# Using MercadoPago MCP tool
mcp__mercadopago__simulate_webhook({
  topic: "payment",
  resource_id: "[test-payment-id]",
  callback_env_production: true
})

# Check Render logs:
# ✅ Webhook received
# ✅ Signature verified
# ✅ Payment data retrieved
# ✅ Order updated
```

### 8.3 Database Verification

**Check Recent Data**:

```sql
-- Connect to PostgreSQL via Render Dashboard → Database → Connect

-- Check webhook logs (last 10)
SELECT * FROM webhook_logs
ORDER BY "processedAt" DESC
LIMIT 10;

-- Check orders with payment info
SELECT "orderNumber", status, "mpPaymentId", "paidAt"
FROM orders
WHERE "mpPaymentId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verify no orphaned pending orders (older than 24h)
SELECT COUNT(*) FROM orders
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '24 hours';
```

### 8.4 End-to-End Payment Test

**CRITICAL**: Complete a real $1 UYU test transaction

1. **Create Test Order** (via mobile app or API):
   - Product: Test item ($1 UYU)
   - User: Test account
   - Payment method: Credit card

2. **Complete Payment**:
   - Use MercadoPago test card: `5031 4332 1540 6351`
   - Security code: `123`
   - Expiration: Any future date
   - Name: `APRO` (test approval)

3. **Verify Payment Flow**:
   - ✅ Payment preference created
   - ✅ MercadoPago checkout opened
   - ✅ Payment approved
   - ✅ Webhook received and processed
   - ✅ Order status updated to PAID
   - ✅ No errors in logs

4. **Verify Database**:
   ```sql
   SELECT * FROM orders WHERE "orderNumber" = '[test-order-number]';
   -- Should show: status = 'PAID', mpPaymentId present, paidAt timestamp

   SELECT * FROM webhook_logs WHERE "dataId" = '[payment-id]';
   -- Should show: status = 'success', processedAt timestamp
   ```

5. **Test Refund** (optional):
   ```bash
   # Create refund via Strapi admin or API
   # Verify refund webhook received
   # Verify order status updated to REFUNDED
   ```

---

## 9. Monitoring Setup

### 9.1 Render Dashboard Metrics

**Access Metrics**:
- Go to Render Dashboard → `tifossi-strapi-backend` → "Metrics"

**Monitor These Indicators**:

1. **CPU Usage**:
   - ✅ Normal: <50%
   - ⚠️ Warning: 50-80%
   - ❌ Critical: >80% (consider upgrading plan)

2. **Memory Usage**:
   - ✅ Normal: <80% of 512MB
   - ⚠️ Warning: 80-95%
   - ❌ Critical: >95% (risk of crashes)

3. **Response Time**:
   - ✅ Normal: <500ms (p95)
   - ⚠️ Warning: 500ms-2s
   - ❌ Critical: >2s

4. **HTTP Error Rate**:
   - ✅ Normal: <1% 5xx errors
   - ⚠️ Warning: 1-5%
   - ❌ Critical: >5%

5. **Bandwidth**:
   - Track monthly transfer
   - Render Starter: 100GB/month included

### 9.2 Application Logs Monitoring

**Watch Logs in Real-Time**:

```bash
# Terminal 1: All logs
render logs tifossi-strapi-backend --tail

# Terminal 2: Payment-related logs only
render logs tifossi-strapi-backend --tail | grep -i "mercadopago\|payment\|webhook"

# Terminal 3: Error logs only
render logs tifossi-strapi-backend --tail | grep -i "error\|exception\|failed"
```

**Key Log Patterns to Monitor**:

✅ **Success Patterns**:
- `MercadoPago webhook received: payment`
- `Webhook processed successfully`
- `Order [orderNumber] status changed from PENDING to PAID`
- `Payment [paymentId] retrieved: Status approved`

❌ **Error Patterns** (require immediate action):
- `Error processing MercadoPago webhook`
- `Invalid webhook signature`
- `Payment fraud attempt detected`
- `MercadoPago API error 500`
- `Database connection lost`

### 9.3 Database Monitoring Queries

**Run these queries periodically** (via Render Dashboard → Database → Query):

**Webhook Processing Rate**:
```sql
SELECT
  DATE("processedAt") as date,
  status,
  COUNT(*) as count
FROM webhook_logs
WHERE "processedAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("processedAt"), status
ORDER BY date DESC;
```

**Failed Webhooks Analysis**:
```sql
SELECT * FROM webhook_logs
WHERE status = 'failed'
  AND "processedAt" > NOW() - INTERVAL '7 days'
ORDER BY "processedAt" DESC;
```

**Payment Success Rate**:
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM orders
WHERE "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY status;
```

**Average Order Value**:
```sql
SELECT
  ROUND(AVG(total), 2) as avg_order_value,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue
FROM orders
WHERE status = 'PAID'
  AND "paidAt" > NOW() - INTERVAL '30 days';
```

**Orders Stuck in PENDING** (potential issues):
```sql
SELECT "orderNumber", "createdAt", total, "mpPaymentId"
FROM orders
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;
```

### 9.4 Alerts Setup (RECOMMENDED)

**Option 1: Email Alerts via Render**

1. Go to Render Dashboard → Service Settings
2. Enable "Email notifications for deployment failures"
3. Add team emails

**Option 2: Custom Monitoring Service** (advanced)

Integrate with monitoring services:
- **Uptime Robot** (free): Monitor endpoint availability
- **Sentry** (optional): Error tracking and alerting
- **Logtail** (optional): Advanced log analysis

**Alert Triggers** (recommended thresholds):

- ⚠️ Webhook failure rate >5% in last hour
- ⚠️ Payment processing time >5 seconds (p95)
- ⚠️ Orders stuck in PENDING >24 hours
- ⚠️ 5xx error rate >1% in last 15 minutes
- ⚠️ Database connection errors
- ⚠️ MercadoPago API timeout errors

---

## 10. Rollback Procedures

### 10.1 Immediate Rollback (Critical Issues)

**WHEN TO ROLLBACK**:
- Payment processing completely broken
- Database connection failures
- Multiple 500 errors affecting users
- Data corruption detected

**STEPS**:

1. **Access Render Dashboard**:
   - Go to https://dashboard.render.com
   - Navigate to `tifossi-strapi-backend`

2. **Rollback to Previous Deployment**:
   - Go to "Events" tab
   - Find last known good deployment
   - Click "Rollback" button
   - **Estimated downtime**: 2-3 minutes

3. **Verify Rollback Success**:
   ```bash
   # Check health
   curl https://tifossi-strapi-backend.onrender.com/_health

   # Check logs
   render logs tifossi-strapi-backend --tail
   ```

4. **Notify Team**:
   - Document what went wrong
   - Plan fix before next deployment

### 10.2 Credential Rollback

**IF**: Production credentials cause issues

**STEPS**:

1. **Revert to Test Credentials**:
   - Render Dashboard → Environment
   - Change `MP_ACCESS_TOKEN` to `MP_TEST_ACCESS_TOKEN`
   - Change `MP_PUBLIC_KEY` to `MP_TEST_PUBLIC_KEY`
   - Click "Save Changes" (triggers redeploy)

2. **Update Webhook URL**:
   - MercadoPago Dashboard → Webhooks
   - Temporarily disable production webhook
   - OR update to test URL

3. **Communicate Downtime**:
   - Mobile app: Show "Maintenance mode" message
   - Disable checkout temporarily

### 10.3 Webhook Rollback

**IF**: Webhooks causing crashes or data corruption

**STEPS**:

1. **Disable Webhooks in MercadoPago**:
   - Go to MercadoPago Developer Dashboard
   - Webhooks section
   - Toggle OFF or delete webhook URL

2. **Alternative**: Update Webhook Secret
   ```bash
   # Render Dashboard → Environment
   # Change MP_WEBHOOK_SECRET to invalid value
   # Webhooks will fail signature verification (safely ignored)
   ```

3. **Manual Order Processing**:
   - Monitor orders via Strapi admin
   - Manually update order status as needed
   - Check MercadoPago dashboard for payment status

### 10.4 Database Rollback

**IF**: Data corruption or critical database issue

**IMPORTANT**: Render provides automatic backups

**STEPS**:

1. **Access Database Backups**:
   - Render Dashboard → Database Service
   - "Backups" tab
   - Select most recent backup before issue

2. **Restore from Backup**:
   - Click "Restore" on selected backup
   - **WARNING**: This OVERWRITES current database
   - Confirm restore operation
   - **Maximum data loss**: <24 hours

3. **Verify Restoration**:
   ```sql
   -- Check last order created
   SELECT MAX("createdAt") FROM orders;

   -- Verify data integrity
   SELECT COUNT(*) FROM orders;
   SELECT COUNT(*) FROM webhook_logs;
   ```

4. **Communicate Data Loss**:
   - If orders lost: Contact affected customers
   - Offer manual order recreation if needed

### 10.5 Complete System Rollback

**NUCLEAR OPTION** (only if everything broken):

1. **Rollback Backend** (see 10.1)
2. **Rollback Credentials** (see 10.2)
3. **Disable Webhooks** (see 10.3)
4. **Enable Maintenance Mode**:
   ```bash
   # Add to Render environment
   MAINTENANCE_MODE=true
   ```

5. **Show Maintenance Page**:
   - Mobile app: Display "We'll be back soon" message
   - Disable all checkout features
   - Allow browsing only

---

## 11. Troubleshooting Guide

### 11.1 Common Issues and Solutions

#### Issue: "MercadoPago service initialized in TEST mode" (production)

**Cause**: `NODE_ENV` not set to `production`

**Solution**:
```bash
# Render Dashboard → Environment
# Verify NODE_ENV=production
# Save and redeploy
```

#### Issue: "MercadoPago access token is required"

**Cause**: Credentials not configured or using wrong variable names

**Solution**:
```bash
# Check Render environment variables:
# - MP_ACCESS_TOKEN (production)
# - MP_TEST_ACCESS_TOKEN (test)
# Ensure values start with APP- or TEST-
```

#### Issue: "Invalid webhook signature"

**Possible Causes**:
1. Wrong webhook secret
2. Timestamp too old (>5 min)
3. MercadoPago sent test webhook

**Solution**:
```bash
# 1. Verify webhook secret matches MercadoPago
# 2. Check server time is synchronized
date -u  # Should match current UTC time

# 3. Check logs for signature details
render logs --tail | grep "signature"
```

#### Issue: "Payment not found" or "Order not found"

**Cause**: Order number mismatch or external_reference not set

**Solution**:
```sql
-- Check if order exists
SELECT * FROM orders WHERE "orderNumber" = '[order-number]';

-- Check if payment has external_reference
-- (view in MercadoPago dashboard)

-- If mismatch: Update order manually
UPDATE orders
SET "mpPaymentId" = '[payment-id]'
WHERE "orderNumber" = '[order-number]';
```

#### Issue: Database connection timeout

**Cause**: Connection pool exhausted or network issue

**Solution**:
```bash
# 1. Check Render Database status
# Dashboard → Database Service → Status

# 2. Increase connection pool (if needed)
# Environment variables:
DATABASE_POOL_MAX=20  # Increase from 10

# 3. Restart service
# Dashboard → Manual Deploy → Deploy latest commit
```

#### Issue: High memory usage / crashes

**Cause**: Memory leak or insufficient memory

**Solution**:
```bash
# 1. Check memory usage
# Render Dashboard → Metrics

# 2. Identify memory leak
render logs --tail | grep "memory"

# 3. Upgrade to Standard plan
# Dashboard → Settings → Upgrade Plan
# Standard: 2GB RAM (vs Starter 512MB)
```

#### Issue: Webhook duplicate processing

**Cause**: MercadoPago retry or race condition

**Solution**:
- Already handled via `webhook_logs` table deduplication
- Check logs for "Duplicate webhook detected"
- No action needed (by design)

### 11.2 MercadoPago API Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 400 | Bad Request | Check request payload format |
| 401 | Unauthorized | Verify access token is valid |
| 404 | Not Found | Check payment ID or preference ID |
| 429 | Rate Limited | Implement retry with backoff |
| 500 | Server Error | MercadoPago issue - retry later |

### 11.3 Debugging Commands

**Check Service Status**:
```bash
curl -I https://tifossi-strapi-backend.onrender.com/_health
```

**Test Database Connection**:
```bash
# Via Render Dashboard → Database → Connect
psql [connection-string]
\dt  # List tables
\d orders  # Describe orders table
```

**Check Environment Variables** (without exposing values):
```bash
render env list tifossi-strapi-backend
```

**Download Logs for Analysis**:
```bash
render logs tifossi-strapi-backend --start="2025-10-21T00:00:00Z" --end="2025-10-21T23:59:59Z" > logs.txt
```

**Test MercadoPago API**:
```bash
curl -X GET \
  'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer [YOUR-ACCESS-TOKEN]'
```

---

## 12. Production Support Runbook

### 12.1 On-Call Procedures

**Contact Information**:
- **Primary**: [Your on-call engineer]
- **Backup**: [Backup engineer]
- **Emergency**: [Emergency contact]

**Escalation Path**:
1. On-call engineer (15 min response)
2. Backup engineer (30 min response)
3. Emergency contact (1 hour response)

### 12.2 Incident Response Workflow

**Step 1: Assess Severity**

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| P0 - Critical | Complete outage | 15 minutes | Backend down, payments broken |
| P1 - High | Major feature broken | 1 hour | Webhook failures, checkout errors |
| P2 - Medium | Minor feature issue | 4 hours | Single product not displaying |
| P3 - Low | Cosmetic issue | 24 hours | Image loading slow |

**Step 2: Initial Response**

```bash
# 1. Check service health
curl https://tifossi-strapi-backend.onrender.com/_health

# 2. Check recent logs
render logs --tail | head -100

# 3. Check Render service status
open https://dashboard.render.com

# 4. Check MercadoPago status
open https://status.mercadopago.com
```

**Step 3: Mitigation**

- P0: Consider immediate rollback (see Section 10.1)
- P1: Investigate root cause, deploy hotfix
- P2/P3: Document for next sprint

**Step 4: Communication**

- Internal: Update team via Slack/email
- External (if needed): Update status page or notify customers

**Step 5: Post-Mortem** (P0/P1 only)

- Document what happened
- Root cause analysis
- Prevention measures
- Update this runbook

### 12.3 Common Support Scenarios

#### Scenario: "Customer says payment succeeded but order still pending"

**Investigation**:
```sql
-- Find order by customer email
SELECT o.* FROM orders o
JOIN users u ON o."userId" = u.id
WHERE u.email = '[customer-email]'
ORDER BY o."createdAt" DESC
LIMIT 5;

-- Check webhook logs for this order
SELECT * FROM webhook_logs
WHERE "dataId" = '[payment-id]'
ORDER BY "processedAt" DESC;
```

**Resolution**:
1. Check MercadoPago dashboard for actual payment status
2. If approved but order pending:
   - Manually trigger webhook or
   - Update order status manually:
     ```sql
     UPDATE orders
     SET status = 'PAID',
         "paidAt" = NOW(),
         "mpPaymentId" = '[payment-id]'
     WHERE "orderNumber" = '[order-number]';
     ```
3. Notify customer of resolution

#### Scenario: "Webhook endpoint returning 500 errors"

**Investigation**:
```bash
# Check recent webhook logs
render logs --tail | grep "webhook" | tail -50

# Look for error stack traces
render logs --tail | grep -A 10 "Error processing"
```

**Resolution**:
1. Identify error from logs
2. If transient: MercadoPago will retry (up to 12 times)
3. If persistent: Deploy hotfix or rollback
4. Manually process failed webhooks:
   ```sql
   SELECT * FROM webhook_logs WHERE status = 'failed';
   -- For each failed webhook, manually update order
   ```

#### Scenario: "Customer refund request"

**Process**:
1. Verify order in Strapi admin
2. Check payment was actually received (MercadoPago dashboard)
3. If eligible for refund:
   ```bash
   # Via Strapi admin or API
   # Navigate to order → Actions → Refund
   # Or use MercadoPago dashboard directly
   ```
4. Verify refund webhook processed
5. Confirm order status = REFUNDED
6. Notify customer

### 12.4 Maintenance Windows

**Recommended Schedule**:
- **Day**: Sunday 2:00 AM - 4:00 AM (Uruguay time)
- **Frequency**: As needed (target: monthly)
- **Notification**: 48 hours advance notice

**Maintenance Checklist**:
- [ ] Database cleanup (old webhook logs >90 days)
- [ ] Update dependencies (security patches)
- [ ] Review and optimize slow queries
- [ ] Check disk space usage
- [ ] Rotate credentials (quarterly)

**Cleanup Script** (run during maintenance):
```sql
-- Delete old webhook logs (>90 days)
DELETE FROM webhook_logs
WHERE "processedAt" < NOW() - INTERVAL '90 days';

-- Vacuum database
VACUUM ANALYZE;
```

### 12.5 Key Performance Indicators (KPIs)

**Monitor Weekly**:
- Total orders processed
- Payment success rate (target: >95%)
- Average order value
- Webhook processing success rate (target: >99%)
- API response time p95 (target: <500ms)
- Database size growth

**Monthly Reports**:
- Revenue processed
- MercadoPago fees paid
- Infrastructure costs
- Top selling products
- Customer acquisition/retention

---

## Appendix A: Environment Variables Reference

**Complete list of production environment variables**:

See Section 3.2 for full configuration.

---

## Appendix B: MercadoPago Test Cards (Uruguay)

| Card Type | Number | CVV | Expiration | Name | Result |
|-----------|--------|-----|------------|------|--------|
| Visa | 4509 9535 6623 3704 | 123 | Future | APRO | Approved |
| Mastercard | 5031 4332 1540 6351 | 123 | Future | APRO | Approved |
| OCA | 5896 5701 1234 5678 | 123 | Future | APRO | Approved |
| Rejected | 4509 9535 6623 3704 | 123 | Future | OTHE | Rejected |

**Full test card list**: https://www.mercadopago.com/developers/en/docs/checkout-api/integration-test/test-cards

---

## Appendix C: Cost Calculator

**Monthly Infrastructure Costs**:

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Starter (512MB) | $7 |
| Render PostgreSQL | Basic (1GB) | $7 |
| Render Redis | Basic | $7 |
| Storage Buffer | - | $14 |
| **Subtotal** | - | **$35** |
| Cloudinary | Free Tier | $0 |
| Firebase Auth | Free Tier | $0 |
| **TOTAL** | - | **$35/month** |

**MercadoPago Transaction Fees**:
- 14-day settlement: 5.23%
- 30-day settlement: 4.01%

**Example Revenue Calculation**:
- Monthly sales: $10,000 UYU
- MercadoPago fee (5.23%): -$523 UYU
- Infrastructure: -$35 USD (~$1,400 UYU at 40 UYU/USD)
- **Net revenue**: ~$8,077 UYU

---

## Appendix D: Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **MercadoPago Developer**: https://www.mercadopago.com.uy/developers
- **Firebase Console**: https://console.firebase.google.com
- **Cloudinary Dashboard**: https://cloudinary.com/console
- **MercadoPago Status**: https://status.mercadopago.com
- **MercadoPago Docs**: https://www.mercadopago.com/developers/en/docs
- **Render Status**: https://status.render.com

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial production deployment guide | AI Agent 11 |

---

**END OF PRODUCTION DEPLOYMENT GUIDE**

For questions or issues not covered in this guide, contact your development team.
