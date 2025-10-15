# MercadoPago Integration Alignment Status

## ✅ Current Alignment (February 2025)

### 1. Webhook Signature Validation

- **Backend**: `backend/strapi/src/lib/payment/webhook-handler.ts` and `backend/strapi/src/webhooks/mercadopago.ts` validate signatures using the official manifest format `id:${dataId};request-id:${xRequestId};ts:${timestamp};`.
- **Shared Validator**: `app/_services/payment/webhookValidator.ts` exports the same logic for tests and automation.

### 2. Sandbox Test Infrastructure

- **Real API Harness**: `app/_tests/services/mercadopago-test.service.ts` wraps the MercadoPago sandbox (preference creation, payment lookup, webhook signatures, cleanup, health checks).
- **Front-end Wiring**: The payment store defers to `mercadoPagoService` which now integrates with the sandbox helper during tests.
- **Environment Guard**: Both integration suites throw a descriptive error when `MP_TEST_ACCESS_TOKEN`, `MP_TEST_PUBLIC_KEY`, or `MP_WEBHOOK_SECRET` are missing, so misconfiguration is never silent.

### 3. Revenue-Critical Test Suites

| Suite                                                       | Purpose                                                                                        | Mode                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| `app/_tests/integration/mercadopago-payment-flow.test.tsx`  | Validates preference creation, payment status polling, and API health checks                   | Real MercadoPago sandbox |
| `app/_tests/integration/revenue-critical-purchase.test.tsx` | Exercises the full guest checkout, payment store callbacks, cart rollback, and webhook helpers | Real MercadoPago sandbox |

Both files run only when `ENABLE_PAYMENT_TESTS=true`; with credentials absent they fail fast with the exact variables that must be populated.

### 4. Test Data & Cards

- Uruguay sandbox cards, payer profiles, and addresses are centralised in `app/_config/mercadopago-uruguay.config.ts` and consumed by the tests and helper service.
- Scenario helpers (`simulatePaymentScenario`, webhook signature builders) align with MercadoPago documentation for Checkout Pro on React Native / Expo.

## 🚧 Remaining Work

1. **Credentials**: Provision sandbox credentials for CI/CD and local developers (see `docs/MERCADOPAGO_CREDENTIAL_SETUP.md`).
2. **CI Pipeline**: Wire `ENABLE_PAYMENT_TESTS=true` and credentials into `payment-tests.yml` once access is granted.
3. **Backend E2E Validation**: When credentials exist, schedule a Strapi-side verification run to confirm webhooks persist orders end-to-end.

## 🔁 Expected Test Outcomes

| Scenario                             | Behaviour                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Credentials missing                  | Tests fail immediately with a setup error (by design).                           |
| Credentials present, sandbox healthy | Tests hit MercadoPago sandbox and must pass before releases.                     |
| Sandbox degraded                     | Tests fail; release should be blocked until the payment provider is operational. |

## 📎 Quick Reference

- Credential instructions: `docs/MERCADOPAGO_CREDENTIAL_SETUP.md`
- Test execution plan: `docs/MERCADOPAGO_TESTING_PLAN.md`
- Payment testing philosophy: `docs/TESTING_PRINCIPLES.md` ("Use real MercadoPago sandbox or don't ship").

**Summary:** Frontend, backend, and documentation are aligned. The only outstanding dependency is receiving MercadoPago sandbox credentials so the new payment suites can run in automation.
