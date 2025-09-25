# 🚀 MercadoPago Testing Plan (Updated February 2025)

## Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Frontend payment store | ✅ Implemented | `app/_stores/paymentStore.ts` integrates with MercadoPago service |
| Sandbox helper | ✅ Implemented | `app/_tests/services/mercadopago-test.service.ts` handles real API, signatures, cleanup |
| Integration suites | ✅ Implemented | `mercadopago-payment-flow.test.tsx`, `revenue-critical-purchase.test.tsx` (real sandbox) |
| Credential guard | ✅ Implemented | Tests fail fast when `MP_TEST_*` variables are missing |
| Documentation | ✅ Updated | Credential + alignment docs refreshed (Feb 2025) |
| CI enablement | 🚧 Pending credentials | `payment-tests.yml` ready once secrets exist |

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

| Variable | Purpose |
|----------|---------|
| `MP_TEST_ACCESS_TOKEN` | MercadoPago sandbox access token (starts with `TEST-`). |
| `MP_TEST_PUBLIC_KEY` | Sandbox public key for client-side flows. |
| `MP_WEBHOOK_SECRET` | Secret used for webhook signature validation. |
| `MP_API_URL` (optional) | Override the default API host (`https://api.mercadopago.com`). |
| `TEST_WEBHOOK_URL` | Where sandbox notifications should point during tests (local Strapi/ngrok or staging). |

See `docs/MERCADOPAGO_CREDENTIAL_SETUP.md` for step-by-step provisioning instructions.

## Execution Steps

1. Export sandbox credentials in your shell (or configure `.env.test`).
2. Run the suites:
   ```bash
   ENABLE_PAYMENT_TESTS=true npx jest --watchman=false \
     app/_tests/integration/mercadopago-payment-flow.test.tsx

   ENABLE_PAYMENT_TESTS=true npx jest --watchman=false \
     app/_tests/integration/revenue-critical-purchase.test.tsx
   ```
3. For CI, set the same environment variables and enable the workflow in
   `.github/workflows/payment-tests.yml` once credentials are stored as secrets.

## Next Actions

1. **Provision credentials** for each environment (dev, staging, CI).
2. **Wire CI** to export the credentials and `ENABLE_PAYMENT_TESTS=true`.
3. **Schedule periodic health checks**—the suites now include an API health assertion that can be invoked daily.
4. **Backend verification** (optional): trigger Strapi webhook flows to confirm order persistence when payments succeed.

## Ground Rules

- Do **not** mock MercadoPago for revenue-critical coverage—tests must talk to the sandbox or fail loudly.
- Treat payment test failures as release blockers.
- Rotate sandbox credentials regularly and update the shared secret used for webhooks.

With the helper service and suites in place the only remaining dependency is access to the MercadoPago sandbox credentials.
