# Strapi v5 Migration Plan
**Project:** Tifossi Expo Backend
**Current Version:** Strapi v4.25.8
**Target Version:** Strapi v5.24.1
**Context:** Solo developer, pre-production, using Claude Code agents
**Estimated Duration:** 1-2 days of focused work
**Risk Level:** MEDIUM (no production traffic, can iterate freely)
**Status:** NOT STARTED

---

## Context & Decision

### Current Reality
- ✅ Solo developer project (just you + Claude Code agents)
- ✅ NOT in production yet - still in development phase
- ✅ No production users, traffic, or data to worry about
- ✅ Can test and iterate freely without downtime concerns
- ✅ Strapi v4.25.8 is stable and working for development
- ✅ Strapi v4 supported until April 2026 (14 months away)

### Migration Decision: Your Call
**Option A: Migrate Now (Pre-Production)**
- ✅ Start fresh on v5 before launch
- ✅ No production migration complexity
- ✅ Learn v5 patterns from the start
- ⚠️ 1-2 days migration work
- ⚠️ Need to update mobile app integration

**Option B: Launch on v4, Migrate Later**
- ✅ Launch faster (already code complete)
- ✅ Migrate with real usage patterns later
- ✅ 14 months until v4 EOL
- ⚠️ Production migration more complex
- ⚠️ Will need to migrate eventually

**Recommendation:** Your choice based on launch urgency. If you want to launch ASAP, stay on v4. If you have 1-2 days to spare, migrate now while it's easy.

---

## Migration Overview

### What's Changing
- **Database API:** Entity Service → Document Service (breaking change)
- **Response Format:** Flattened structure (mobile app impact)
- **Dependencies:** Vite, React Router v6, koa-body v6
- **Configuration:** Plugin config updates
- **Database:** One-way migration (no rollback to v4)

### Files Requiring Updates
- `/backend/strapi/src/api/order/controllers/order.js` (2 locations)
- `/backend/strapi/src/api/payment/controllers/payment.js` (8 locations)
- `/backend/strapi/config/api.js` (response format config)
- `/backend/strapi/config/plugins.js` (optional retro-compatibility)

### Key Risks (Development Context)
1. **MercadoPago Integration:** Payment flow needs testing
2. **Order Management:** State machine needs verification
3. **Mobile App:** API response format changes (use retro-compat flag)
4. **One-way Database Migration:** Can't go back to v4 after migration

---

## Phase 0: Preparation (30 minutes)
**Goal:** Secure your current state before making changes

### 0.1 Backup Current State
- [ ] Git status: Ensure working directory is clean
- [ ] Create git tag: `git tag v4-pre-migration`
- [ ] Push tag: `git push origin v4-pre-migration`
- [ ] Create branch: `git checkout -b migration/strapi-v5`
- [ ] Document current Strapi version: Check `backend/strapi/package.json`

### 0.2 Local Database Backup
- [ ] Check if local database exists with test data
- [ ] If yes, backup: `pg_dump tifossi_strapi_local > backup_v4_local.sql`
- [ ] Save backup somewhere safe
- [ ] Note: Can recreate test data if needed (no production data)

### 0.3 Render Database Backup (if deployed)
- [ ] Check if backend is deployed to Render
- [ ] If yes, create backup via Render dashboard
- [ ] Download backup file (just in case)
- [ ] Note: This is dev/staging data, not production

### 0.4 Environment Check
- [ ] Node.js version: `node -v` (should be 18-20)
- [ ] Local PostgreSQL: `psql --version` (check it's running)
- [ ] Test current v4 works: `cd backend/strapi && npm run develop`
- [ ] Verify admin panel loads: http://localhost:1337/admin
- [ ] Stop Strapi: Ctrl+C

---

## Phase 1: Automated Migration (1-2 hours)
**Goal:** Run Strapi's automated upgrade tool

### 1.1 Update to Latest v4 First
- [ ] Navigate: `cd backend/strapi`
- [ ] Update to latest v4: `npx @strapi/upgrade minor`
- [ ] Review output for any warnings
- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build`
- [ ] Test: `npm run develop`
- [ ] Verify everything still works
- [ ] Stop Strapi
- [ ] Commit: `git add . && git commit -m "chore: update to latest Strapi v4.x.x"`

### 1.2 Run v5 Migration Tool
- [ ] **CHECKPOINT:** Ensure git is clean
- [ ] Run migration: `npx @strapi/upgrade major`
- [ ] Watch output carefully - note all changes
- [ ] Tool will update package.json and run codemods
- [ ] Review changes: `git diff`
- [ ] Review package.json changes
- [ ] Review package-lock.json changes
- [ ] Document any warnings or errors from tool

### 1.3 Install v5 Dependencies
- [ ] Install: `npm install`
- [ ] Note any peer dependency warnings
- [ ] Check for conflicts: `npm audit`
- [ ] Fix critical vulnerabilities if any: `npm audit fix`

### 1.4 Initial Build Attempt
- [ ] Try building: `npm run build`
- [ ] **Expected:** May fail with errors
- [ ] Document all build errors
- [ ] Look for:
  - TypeScript errors
  - Missing dependency errors
  - API deprecation warnings
  - Configuration errors
- [ ] Don't fix yet - just document

---

## Phase 2: Configuration Updates (30-45 minutes)
**Goal:** Update config files for v5 compatibility

### 2.1 Database Configuration
- [ ] Open: `/backend/strapi/config/database.js`
- [ ] Verify structure looks correct (should be compatible)
- [ ] Check connection settings unchanged
- [ ] Check pool settings format
- [ ] No changes needed unless build errors indicate otherwise

### 2.2 API Configuration (Response Format)
- [ ] Open: `/backend/strapi/config/api.js`
- [ ] Add retro-compatibility to maintain v4 response format:
  ```javascript
  module.exports = {
    rest: {
      defaultLimit: 25,
      maxLimit: 100,
      withCount: true,
      responseFormat: 'v4', // ADD THIS - keeps v4 response format
    },
  };
  ```
- [ ] This prevents mobile app from breaking
- [ ] Save file

### 2.3 Plugin Configuration
- [ ] Open: `/backend/strapi/config/plugins.js`
- [ ] Verify users-permissions config (already has allowedFields set - good!)
- [ ] If GraphQL enabled, add v4 compatibility:
  ```javascript
  graphql: {
    config: {
      v4CompatibilityMode: true, // ADD THIS if GraphQL enabled
    },
  }
  ```
- [ ] Save file

### 2.4 Middleware Configuration
- [ ] Open: `/backend/strapi/config/middlewares.js`
- [ ] Review `strapi::body` middleware (now uses koa-body v6)
- [ ] Should work as-is, but verify after build
- [ ] Check custom middlewares (rate-limit, logging) are referenced correctly

### 2.5 Server Configuration
- [ ] Open: `/backend/strapi/config/server.js`
- [ ] Verify all settings look correct
- [ ] Check app.keys format (should be unchanged)
- [ ] No changes needed unless errors

---

## Phase 3: API Migration - Entity Service → Document Service (2-3 hours)
**Goal:** Update all deprecated API calls in controllers
**Critical:** This is the main breaking change

### 3.1 Order Controller Updates
File: `/backend/strapi/src/api/order/controllers/order.js`

- [ ] Open file in editor
- [ ] Search for: `entityService`
- [ ] **Location 1: create() method (~line 27)**
  - [ ] Find: `strapi.entityService.create('api::order.order', { data: {...}, populate: {...} })`
  - [ ] Replace with: `strapi.documents('api::order.order').create({ data: {...}, populate: {...} })`
  - [ ] Verify parameter structure matches
  - [ ] Check populate syntax (should be same)

- [ ] **Location 2: delete() method (~line 78)**
  - [ ] Find: `strapi.entityService.delete('api::order.order', orderId)`
  - [ ] Replace with: `strapi.documents('api::order.order').delete({ documentId: orderId })`
  - [ ] Note: documentId parameter name

- [ ] Search entire file for any other `entityService` usage
- [ ] Update any found instances
- [ ] Save file

### 3.2 Payment Controller Updates
File: `/backend/strapi/src/api/payment/controllers/payment.js`

This file has ~8 entityService calls. Update systematically:

- [ ] Open file in editor
- [ ] **createPreference() method (~line 38)**
  - [ ] Find: `strapi.entityService.findOne('api::order.order', orderId, { populate: {...} })`
  - [ ] Replace with: `strapi.documents('api::order.order').findOne({ documentId: orderId, populate: {...} })`

- [ ] **verifyPayment() method (~line 78)**
  - [ ] Find: `strapi.entityService.update('api::order.order', orderId, { data: {...} })`
  - [ ] Replace with: `strapi.documents('api::order.order').update({ documentId: orderId, data: {...} })`

- [ ] **getOrders() method (~line 133)**
  - [ ] Find: `strapi.entityService.findMany('api::order.order', { filters: {...}, populate: {...}, sort: {...}, pagination: {...} })`
  - [ ] Replace with: `strapi.documents('api::order.order').findMany({ filters: {...}, populate: {...}, sort: {...}, pagination: {...} })`
  - [ ] Note: Same parameter structure

- [ ] **getOrder() method (~line 150)**
  - [ ] Find: `strapi.entityService.findOne('api::order.order', orderId, { filters: {...}, populate: {...} })`
  - [ ] Replace with: `strapi.documents('api::order.order').findOne({ documentId: orderId, filters: {...}, populate: {...} })`

- [ ] **requestRefund() method - first call (~line 218)**
  - [ ] Update findOne call to Document Service

- [ ] **requestRefund() method - second call (~line 251)**
  - [ ] Update update call to Document Service

- [ ] **Additional calls (lines 286, 313 if they exist)**
  - [ ] Review and update any remaining calls

- [ ] Search entire file: `grep -n "entityService" payment.js`
- [ ] Ensure all instances updated
- [ ] Save file

### 3.3 Global Entity Service Search
- [ ] Search entire backend: `cd backend/strapi && grep -r "entityService" src/`
- [ ] Check results - should only be in comments now
- [ ] If found in services or utilities, update those too
- [ ] Document any third-party plugin usage (can't change those)

### 3.4 Review Services and Utilities
- [ ] Check: `/backend/strapi/src/api/order/services/order.js`
  - [ ] Look for entityService usage
  - [ ] Update if found
- [ ] Check: `/backend/strapi/src/api/payment/services/payment.js`
  - [ ] Look for entityService usage
  - [ ] Update if found
- [ ] Check: `/backend/strapi/src/utils/order-sanitizer.js`
  - [ ] Review for any API changes needed
  - [ ] Update if necessary

### 3.5 Middleware Review
- [ ] Check: `/backend/strapi/src/middlewares/rate-limit.js`
  - [ ] Verify Koa context API still compatible
  - [ ] Should work as-is
- [ ] Check: `/backend/strapi/src/middlewares/logging.js`
  - [ ] Verify logging format compatible
  - [ ] Should work as-is

---

## Phase 4: Build & Database Migration (30-45 minutes)
**Goal:** Get Strapi v5 running locally

### 4.1 Clean Build
- [ ] Navigate: `cd backend/strapi`
- [ ] Clean cache: `rm -rf .cache`
- [ ] Clean build: `rm -rf build`
- [ ] Clean modules: `rm -rf node_modules`
- [ ] Fresh install: `npm install`
- [ ] Build: `npm run build`
- [ ] **Expected:** Build should succeed now
- [ ] If errors, review and fix based on error messages
- [ ] Document any warnings (can address later)

### 4.2 Database Migration (CRITICAL - One Way!)
**⚠️ IMPORTANT: This migrates database to v5 schema - cannot revert to v4 after this!**

- [ ] Ensure local database backup exists (Phase 0.2)
- [ ] Start Strapi: `npm run develop`
- [ ] **Watch console output carefully**
- [ ] Look for: "Starting migrations..."
- [ ] Strapi will automatically migrate database schema
- [ ] Wait for: "Migrations completed successfully"
- [ ] Wait for: "Server started"
- [ ] This may take 2-5 minutes
- [ ] **If errors:** Stop, review logs, ask for help in Strapi Discord
- [ ] **If successful:** Database now uses v5 schema

### 4.3 First Admin Panel Check
- [ ] Admin panel should auto-open: http://localhost:1337/admin
- [ ] If not, open manually
- [ ] Log in with existing admin credentials
- [ ] **Expected:** Admin panel loads successfully
- [ ] Verify dashboard displays
- [ ] Check Content Manager sidebar
- [ ] All content types should be visible

---

## Phase 5: Testing & Verification (2-3 hours)
**Goal:** Verify everything works in v5

### 5.1 Admin Panel Testing
- [ ] **Content Manager - Products**
  - [ ] Navigate to Content Manager → Products
  - [ ] List displays correctly
  - [ ] Open a product
  - [ ] All fields display
  - [ ] Relations work (category, status, model)
  - [ ] Edit product title
  - [ ] Save changes
  - [ ] Create new test product
  - [ ] Delete test product

- [ ] **Content Manager - Orders**
  - [ ] Navigate to Orders
  - [ ] List displays
  - [ ] Open an order
  - [ ] Order items display
  - [ ] User relation works

- [ ] **Content Manager - Categories**
  - [ ] List categories
  - [ ] Open category
  - [ ] Product relations display

- [ ] **Content Manager - Users**
  - [ ] Navigate to Users (Users & Permissions)
  - [ ] List users
  - [ ] Open user
  - [ ] Extended fields visible (phone, firstName, lastName)

- [ ] **Media Library**
  - [ ] Navigate to Media Library
  - [ ] Existing media displays
  - [ ] Upload test image
  - [ ] Verify Cloudinary integration works
  - [ ] Delete test image

- [ ] **Settings**
  - [ ] Check Settings panel loads
  - [ ] Verify API Tokens page works
  - [ ] Check Roles & Permissions

### 5.2 API Endpoint Testing (Use Postman/Insomnia or curl)
**Setup:**
- [ ] Ensure Strapi running: `npm run develop`
- [ ] Base URL: `http://localhost:1337`
- [ ] Have API testing tool ready

**Test Endpoints:**

- [ ] **Health Check**
  - [ ] `GET /api/health`
  - [ ] Should return 200

- [ ] **Public Endpoints**
  - [ ] `GET /api/products`
    - [ ] Returns product list
    - [ ] Response format matches v4 (thanks to retro-compat flag)
    - [ ] Check data structure: `data[].attributes`
  - [ ] `GET /api/products/1`
    - [ ] Returns single product
    - [ ] Relations populated
  - [ ] `GET /api/categories`
    - [ ] Returns categories

- [ ] **Authentication**
  - [ ] `POST /api/auth/local/register`
    - [ ] Body: `{ username: "testv5", email: "testv5@test.com", password: "testpassword123", firstName: "Test", lastName: "User" }`
    - [ ] Returns JWT
    - [ ] Save JWT for next tests
  - [ ] `POST /api/auth/local`
    - [ ] Body: `{ identifier: "testv5@test.com", password: "testpassword123" }`
    - [ ] Returns JWT
  - [ ] `GET /api/users/me` (with JWT)
    - [ ] Returns user data
    - [ ] Extended fields present

- [ ] **Order Endpoints** (requires JWT)
  - [ ] `POST /api/orders/create-order`
    - [ ] Body: Order with items
    - [ ] Authorization: Bearer {JWT}
    - [ ] Order created successfully
    - [ ] Save order ID
  - [ ] `GET /api/payment/orders` (with JWT)
    - [ ] Returns user's orders
    - [ ] New order in list
  - [ ] `GET /api/payment/orders/{orderId}` (with JWT)
    - [ ] Returns specific order
    - [ ] All data present
  - [ ] `DELETE /api/orders/{orderId}` (with JWT)
    - [ ] Order deleted successfully

- [ ] **Payment Endpoints** (requires JWT and order)
  - [ ] Create test order first
  - [ ] `POST /api/payment/create-preference`
    - [ ] Body: `{ orderId: "..." }`
    - [ ] Authorization: Bearer {JWT}
    - [ ] Returns MercadoPago preference
    - [ ] Check preference ID present
    - [ ] **Note:** Using sandbox credentials

### 5.3 End-to-End Order Flow Test
Complete flow from registration to order:

- [ ] **Step 1:** Register new user (API)
- [ ] **Step 2:** Get JWT token
- [ ] **Step 3:** Browse products (API)
- [ ] **Step 4:** Create order with items (API)
- [ ] **Step 5:** Create payment preference (API)
- [ ] **Step 6:** Verify MercadoPago preference created
- [ ] **Step 7:** Simulate webhook (optional - test payment verification)
- [ ] **Step 8:** Get order via API
- [ ] **Step 9:** Verify order data complete

### 5.4 Mobile App Integration Test
- [ ] Update mobile app .env to point to local v5 backend
- [ ] Or use Render deployed version (Phase 6)
- [ ] Launch mobile app
- [ ] Test product listing
- [ ] Test product details
- [ ] Test user registration
- [ ] Test user login
- [ ] Test order creation
- [ ] Test payment flow
- [ ] Verify no API errors
- [ ] Check console for any warnings

### 5.5 Error Handling Verification
- [ ] Test invalid JWT token → 401 error
- [ ] Test missing required fields → 400 error
- [ ] Test invalid product ID → 404 error
- [ ] Test unauthorized endpoint → 403 error
- [ ] Verify error messages user-friendly

---

## Phase 6: Render Deployment (1-2 hours)
**Goal:** Deploy v5 to Render (your "production" environment)
**Context:** No real users yet, so this is really staging/first deployment

### 6.1 Pre-Deployment Checklist
- [ ] All local tests passed (Phase 5)
- [ ] Git branch clean: `git status`
- [ ] Commit all changes: `git add . && git commit -m "feat: migrate to Strapi v5"`
- [ ] Push branch: `git push origin migration/strapi-v5`
- [ ] Review all changes in GitHub

### 6.2 Render Database Backup (if exists)
- [ ] Log into Render dashboard
- [ ] Find existing PostgreSQL database (if deployed)
- [ ] Create manual backup via dashboard
- [ ] Wait for backup completion
- [ ] Note backup timestamp

### 6.3 Environment Variables Check
- [ ] Go to Render service settings
- [ ] Check all environment variables present:
  - [ ] DATABASE_URL (should be auto-set by Render)
  - [ ] APP_KEYS
  - [ ] JWT_SECRET
  - [ ] ADMIN_JWT_SECRET
  - [ ] API_TOKEN_SALT
  - [ ] TRANSFER_TOKEN_SALT
  - [ ] CLOUDINARY_* (3 variables)
  - [ ] MERCADOPAGO_ACCESS_TOKEN
  - [ ] EMAIL_* (Nodemailer settings)
  - [ ] NODE_ENV (set to production)
- [ ] Add if needed: `STRAPI_RESPONSE_FORMAT=v4` (optional, already in config)
- [ ] Save changes

### 6.4 Deploy to Render
- [ ] Option A: Merge to main branch
  - [ ] Create PR: `migration/strapi-v5` → `main`
  - [ ] Review changes
  - [ ] Merge PR
  - [ ] Render auto-deploys

- [ ] Option B: Push directly to main
  - [ ] `git checkout main`
  - [ ] `git merge migration/strapi-v5`
  - [ ] `git push origin main`
  - [ ] Render auto-deploys

- [ ] Monitor Render build logs in real-time
- [ ] Watch for build errors
- [ ] Build takes ~5-10 minutes

### 6.5 Monitor Database Migration on Render
- [ ] After build completes, watch startup logs
- [ ] Look for: "Starting migrations..."
- [ ] **CRITICAL:** Watch for errors
- [ ] Automatic migration runs on first v5 startup
- [ ] Wait for: "Migrations completed"
- [ ] Wait for: "Server started"
- [ ] Takes 2-5 minutes
- [ ] If errors: Check logs, may need to restore backup

### 6.6 Smoke Tests on Render
- [ ] Test: `GET https://your-app.onrender.com/api/health`
- [ ] Test: Admin panel loads
- [ ] Login to admin panel
- [ ] List products in Content Manager
- [ ] Open one product
- [ ] Test: `GET https://your-app.onrender.com/api/products`
- [ ] Create test order via API
- [ ] Create payment preference
- [ ] Verify MercadoPago integration works

### 6.7 Mobile App Test with Render
- [ ] Update mobile app .env to Render URL
- [ ] Test full flow in mobile app
- [ ] Product listing
- [ ] Order creation
- [ ] Payment flow
- [ ] Verify everything works

### 6.8 Monitor for Issues (Next 24 hours)
- [ ] Check Render logs periodically
- [ ] Look for any errors or warnings
- [ ] Monitor API response times (Render dashboard)
- [ ] Monitor database performance
- [ ] Fix any issues found

---

## Phase 7: Mobile App Update (1-2 hours)
**Goal:** Update mobile app for v5 API (optional - can stay on v4 format)

### 7.1 Current State
- [ ] Backend uses `responseFormat: 'v4'` in config
- [ ] Mobile app receives v4-compatible responses
- [ ] Everything works without mobile app changes

### 7.2 Option A: Keep Retro-Compatibility (Recommended for Now)
- [ ] No mobile app changes needed
- [ ] Backend serves v4 format
- [ ] Can update mobile app later
- [ ] **Choose this if:** Want to launch ASAP

### 7.3 Option B: Update Mobile App for Native v5 Responses
Only if you want to use native v5 response format:

- [ ] Read Strapi v5 response format docs
- [ ] Update API response parsing in mobile app
- [ ] Test all API integrations
- [ ] Remove `responseFormat: 'v4'` from backend config
- [ ] Deploy updated backend
- [ ] Deploy updated mobile app
- [ ] **Choose this if:** Want to be fully on v5

---

## Phase 8: Documentation & Cleanup (30 minutes)
**Goal:** Update docs and clean up migration artifacts

### 8.1 Update Project Documentation
- [ ] Update `backend/strapi/README.md` (if exists)
  - [ ] Note Strapi v5 version
  - [ ] Update setup instructions if needed
  - [ ] Document Document Service API usage
- [ ] Update main project README (if needed)
- [ ] Update `.env.example` if any changes

### 8.2 Update Deployment Documentation
- [ ] Update deployment instructions (if any)
- [ ] Note v5-specific considerations
- [ ] Document retro-compatibility flag usage

### 8.3 Git Cleanup
- [ ] Review migration branch
- [ ] Delete migration branch locally: `git branch -d migration/strapi-v5`
- [ ] Delete remote branch: `git push origin --delete migration/strapi-v5`
- [ ] Create git tag: `git tag v5-migration-complete`
- [ ] Push tag: `git push origin v5-migration-complete`

### 8.4 Create Migration Notes
- [ ] Document what was changed
- [ ] Document any issues encountered
- [ ] Document solutions found
- [ ] Save notes in project (optional)

---

## Phase 9: Final Verification & Launch Prep (30 minutes)
**Goal:** Ensure everything ready for launch

### 9.1 Final Checklist
- [ ] ✅ Strapi v5 running locally
- [ ] ✅ Strapi v5 deployed to Render
- [ ] ✅ Admin panel works
- [ ] ✅ All content types work
- [ ] ✅ API endpoints work
- [ ] ✅ Authentication works
- [ ] ✅ Order creation works
- [ ] ✅ MercadoPago integration works
- [ ] ✅ Mobile app integration works
- [ ] ✅ No critical errors in logs

### 9.2 Update TIFOSSI_DELIVERY_PLAN.md
- [ ] Open: `/TIFOSSI_DELIVERY_PLAN.md`
- [ ] Update backend status: "Strapi v5 ✅ Migrated"
- [ ] Note any new considerations
- [ ] Update progress tracker

### 9.3 Performance Baseline
- [ ] Note Render performance metrics
- [ ] Document API response times
- [ ] Check database performance
- [ ] Compare with v4 (should be similar or better)

---

## Rollback Plan (If Needed)
**Only if critical issues - use within 24 hours of migration**

### Quick Rollback Steps
- [ ] **Code Rollback:**
  - [ ] `git checkout main`
  - [ ] `git revert HEAD` (reverts v5 merge)
  - [ ] `git push origin main`
  - [ ] Render auto-deploys v4 code

- [ ] **Database Rollback (if needed):**
  - [ ] Restore from backup taken in Phase 6.2
  - [ ] Via Render dashboard: Database → Backups → Restore
  - [ ] **Warning:** Loses any data created after migration
  - [ ] Restart Strapi service

- [ ] **Local Rollback:**
  - [ ] `git checkout v4-pre-migration` (tag from Phase 0.1)
  - [ ] Restore local database: `psql < backup_v4_local.sql`
  - [ ] `cd backend/strapi && npm install && npm run develop`

### When to Rollback
- Critical API endpoints not working
- Orders cannot be created
- MercadoPago integration broken
- Database errors persisting
- Mobile app completely broken
- Data corruption detected

### When NOT to Rollback
- Minor bugs (fix forward)
- Deprecation warnings (can fix later)
- Non-critical features not working
- Performance slightly different
- Cosmetic issues

---

## Optimization & Future Improvements
**Do after migration is stable (1-2 weeks later)**

### Performance Optimization
- [ ] Review slow query logs (if any)
- [ ] Add database indexes if needed
- [ ] Optimize large API responses
- [ ] Consider caching strategies

### Code Quality
- [ ] Remove retro-compatibility flag (after mobile app updated)
- [ ] Review deprecation warnings
- [ ] Refactor any hacky fixes
- [ ] Add comments for v5-specific patterns
- [ ] Run linter: `npm run lint`

### Testing
- [ ] Update automated tests for v5
- [ ] Add tests for Document Service usage
- [ ] Add tests for any bugs fixed
- [ ] Run test suite: `npm test`

---

## Resources & Help

### Official Documentation
- **Strapi v5 Migration Guide:** https://docs.strapi.io/cms/migration/v4-to-v5/step-by-step
- **Document Service API:** https://docs.strapi.io/cms/content-api/document-service
- **Breaking Changes:** https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes
- **v5 Release Notes:** https://strapi.io/blog/strapi-5-is-live

### Community Support
- **Strapi Discord:** https://discord.strapi.io/ (very active, helpful community)
- **Strapi Forum:** https://forum.strapi.io/
- **GitHub Issues:** https://github.com/strapi/strapi/issues

### Claude Code Agent Usage
When stuck, use Claude Code agents for:
- **Code search:** Find all entityService usages
- **Code updates:** Batch update API calls
- **Debugging:** Analyze error messages
- **Testing:** Generate test scenarios

### Common Issues & Solutions

**Issue:** Build fails with TypeScript errors
**Solution:** Update tsconfig.json or type definitions

**Issue:** Database migration errors
**Solution:** Check PostgreSQL version compatibility, review schema

**Issue:** MercadoPago webhook not working
**Solution:** Verify webhook URL updated, check payload format

**Issue:** Mobile app API errors
**Solution:** Ensure retro-compatibility flag set in config/api.js

**Issue:** Admin panel 404
**Solution:** Check build output, verify admin panel built correctly

---

## Quick Reference

### Key Commands
```bash
# Update to latest v4
cd backend/strapi && npx @strapi/upgrade minor

# Migrate to v5
npx @strapi/upgrade major

# Clean install
rm -rf node_modules .cache build && npm install

# Build
npm run build

# Development
npm run develop

# Production
npm run start

# Tests
npm test

# Database backup
pg_dump tifossi_strapi_local > backup.sql

# Database restore
psql tifossi_strapi_local < backup.sql

# Search for entityService usage
cd backend/strapi && grep -r "entityService" src/
```

### Key Files Modified
```
backend/strapi/
├── package.json                              # Strapi v5 dependencies
├── config/
│   ├── api.js                                # Added responseFormat: 'v4'
│   └── plugins.js                            # Optional v4CompatibilityMode
└── src/
    └── api/
        ├── order/controllers/order.js        # Document Service API
        └── payment/controllers/payment.js    # Document Service API
```

### Document Service API Cheatsheet
```javascript
// OLD (v4)
strapi.entityService.findOne('api::order.order', id, { populate: '*' })
strapi.entityService.findMany('api::order.order', { filters, populate })
strapi.entityService.create('api::order.order', { data })
strapi.entityService.update('api::order.order', id, { data })
strapi.entityService.delete('api::order.order', id)

// NEW (v5)
strapi.documents('api::order.order').findOne({ documentId: id, populate: '*' })
strapi.documents('api::order.order').findMany({ filters, populate })
strapi.documents('api::order.order').create({ data })
strapi.documents('api::order.order').update({ documentId: id, data })
strapi.documents('api::order.order').delete({ documentId: id })
```

---

## Migration Status

**Current Status:** ⏸️ NOT STARTED
**Start Date:** TBD
**Completion Date:** TBD
**Last Updated:** 2025-01-XX

### Progress Tracker
- [ ] Phase 0: Preparation (0%)
- [ ] Phase 1: Automated Migration (0%)
- [ ] Phase 2: Configuration Updates (0%)
- [ ] Phase 3: API Migration (0%)
- [ ] Phase 4: Build & Database Migration (0%)
- [ ] Phase 5: Testing & Verification (0%)
- [ ] Phase 6: Render Deployment (0%)
- [ ] Phase 7: Mobile App Update (0%)
- [ ] Phase 8: Documentation & Cleanup (0%)
- [ ] Phase 9: Final Verification (0%)

### Time Tracking
- **Estimated:** 1-2 days (8-16 hours)
- **Actual:** TBD

### Notes & Lessons Learned
*(Add notes here as you go)*

---

*This is a living document. Update progress and add notes as you complete each phase. Use Claude Code agents to help with the heavy lifting!*