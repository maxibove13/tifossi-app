# 🔐 MercadoPago Credential Setup Guide

This guide will help you obtain and configure MercadoPago credentials for testing and production environments.

## 📋 Prerequisites

- A MercadoPago Uruguay account (create at https://www.mercadopago.com.uy/)
- Access to MercadoPago Developer Panel
- Your application deployed with a public URL (for webhooks)

## 🚀 Quick Start

> ℹ️ **Test Failure Is a Feature:** The payment integration suites
> (`mercadopago-payment-flow.test.tsx` and
> `revenue-critical-purchase.test.tsx`) now hit the real MercadoPago
> sandbox. When the required sandbox credentials are missing these
> tests throw a descriptive error instead of skipping, so you will see a
> failure until credentials are configured.

### Step 1: Access Developer Panel

1. Log in to your MercadoPago account
2. Navigate to: https://www.mercadopago.com.uy/developers/panel
3. Click on "Your integrations" in the menu

### Step 2: Create an Application

1. Click "Create application"
2. Fill in the details:
   - **Name**: Tifossi E-commerce
   - **Description**: Tifossi Uruguay E-commerce Platform
   - **Solution**: Select "Checkout Pro"
   - **Integration**: Select "E-commerce"

3. Accept terms and create the application

### Step 3: Obtain Test Credentials

1. In your application, go to "Test credentials"
2. You'll see:
   - **Access Token** (starts with `TEST-`)
   - **Public Key** (starts with `TEST-`)

3. Copy these values - you'll need them for `.env.test`

### Step 4: Configure Webhook Secret

1. In your application, go to "Webhooks"
2. Click "Configure notifications"
3. Add your webhook URLs:

   **For Testing (Local Development with ngrok):**

   ```
   https://your-ngrok-url.ngrok.io/webhooks/mercadopago
   ```

   **For Production:**

   ```
   https://api.tifossi.com.uy/webhooks/mercadopago
   ```

4. Select events to receive:
   - ✅ payment.created
   - ✅ payment.updated

5. After saving, your **webhook secret** will be automatically generated
6. Find it in: Your integrations → Select application → Webhooks section
7. Copy the secret - you'll need it for `MP_WEBHOOK_SECRET`

### Step 5: Create Test Users (Required for Testing)

You need **2 test accounts** minimum:

1. Go to: https://www.mercadopago.com.uy/developers/panel/test-users
2. Create a **Seller** account:
   - Role: Seller
   - Country: Uruguay
3. Create a **Buyer** account:
   - Role: Buyer
   - Country: Uruguay

4. Save the credentials for both accounts

## 🔧 Environment Configuration

### For Local Development

Create `.env.test` from the example:

```bash
cp .env.test.example .env.test
```

Edit `.env.test`:

```bash
# MercadoPago Sandbox Credentials
MP_TEST_ACCESS_TOKEN=TEST-1234567890-123456-abcdef...
MP_TEST_PUBLIC_KEY=TEST-abcd1234-5678-90ef-ghij...

# Webhook Secret (from dashboard)
MP_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0...

# API URLs (don't change these)
MP_API_URL=https://api.mercadopago.com
EXPO_PUBLIC_MP_API_URL=https://api.mercadopago.com

# Backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:1337
TEST_WEBHOOK_URL=http://localhost:1337/webhooks/mercadopago

# App Scheme
APP_SCHEME=tifossi
```

### For Production

**⚠️ NEVER commit production credentials to the repository!**

Use environment variables in your hosting service:

```bash
# Production Credentials (different from test!)
MP_ACCESS_TOKEN=APP-1234567890...
MP_PUBLIC_KEY=APP-abcd1234...
MP_WEBHOOK_SECRET=prod_secret_xyz...

# Production URLs
API_BASE_URL=https://api.tifossi.com.uy
WEBHOOK_URL=https://api.tifossi.com.uy/webhooks/mercadopago
```

## 🧪 Testing with Credentials

### 1. Verify Connection

```bash
# Test API connection
curl -H "Authorization: Bearer TEST-your-access-token" \
  https://api.mercadopago.com/v1/payment_methods
```

### 2. Run Tests

```bash
# Run payment suites (fails fast if credentials missing)
ENABLE_PAYMENT_TESTS=true npx jest --watchman=false \
  app/_tests/integration/mercadopago-payment-flow.test.tsx

ENABLE_PAYMENT_TESTS=true npx jest --watchman=false \
  app/_tests/integration/revenue-critical-purchase.test.tsx

# CI can export ENABLE_PAYMENT_TESTS=true globally once credentials are set
```

### 3. Test Webhook Locally

Use ngrok for local webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend
cd backend/strapi
npm run develop

# In another terminal, expose your local server
ngrok http 1337

# Copy the HTTPS URL and update webhook URL in MercadoPago dashboard
```

### 4. Without Credentials

- Running the payment suites with `ENABLE_PAYMENT_TESTS=true` but missing
  `MP_TEST_*` variables will produce an explicit failure listing the
  missing values. That failure is intentional—configure the sandbox
  credentials or disable the flag until they are available.

## 💳 Test Cards for Uruguay

Use these cards with specific cardholder names to trigger different outcomes:

### Credit Cards

| Card Type  | Number              | CVV | Expiry |
| ---------- | ------------------- | --- | ------ |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/30  |
| Visa       | 4509 9535 6623 3704 | 123 | 11/30  |

### Debit Card

| Card Type  | Number              | CVV | Expiry |
| ---------- | ------------------- | --- | ------ |
| Visa Debit | 4213 0163 1470 6756 | 123 | 11/30  |

### Cardholder Names (Control Payment Outcome)

- **APRO**: Payment approved
- **FUND**: Rejected - insufficient funds
- **OTHE**: Rejected - other error

## 🔒 Security Best Practices

### DO ✅

- Use test credentials for development/testing
- Store production credentials in environment variables
- Rotate webhook secrets periodically
- Validate webhook signatures on every request
- Use HTTPS for all webhook endpoints

### DON'T ❌

- Commit credentials to Git (even test ones)
- Share webhook secrets
- Use production credentials for testing
- Log payment details in production
- Expose API credentials in client-side code

## 📊 GitHub Actions Setup

Add these secrets to your GitHub repository:

1. Go to: Settings → Secrets and variables → Actions
2. Add new repository secrets:
   - `MP_TEST_ACCESS_TOKEN`
   - `MP_TEST_PUBLIC_KEY`
   - `MP_WEBHOOK_SECRET`

## 🐛 Troubleshooting

### "Invalid credentials" Error

- Ensure credentials start with `TEST-` for sandbox
- Check you're using the correct environment credentials
- Verify credentials haven't expired

### Webhook Not Receiving Notifications

1. Check webhook URL is accessible publicly
2. Verify webhook secret matches
3. Ensure selected events in dashboard
4. Check firewall/security groups

### Payment Tests Failing

1. Verify test users are created
2. Use correct test cards and cardholder names
3. Check API status: https://status.mercadopago.com/

## 📚 Additional Resources

- [MercadoPago Uruguay Developers](https://www.mercadopago.com.uy/developers/)
- [Test Cards Documentation](https://www.mercadopago.com.uy/developers/en/docs/your-integrations/test/cards)
- [Webhook Configuration](https://www.mercadopago.com.uy/developers/en/docs/your-integrations/notifications/webhooks)
- [API Reference](https://www.mercadopago.com.uy/developers/en/reference)

## 🆘 Support

- MercadoPago Support: https://www.mercadopago.com.uy/developers/support
- API Status: https://status.mercadopago.com/
- Community Forum: https://forum.mercadopago.com/

---

**Last Updated**: February 2025
**MercadoPago API Version**: v1
