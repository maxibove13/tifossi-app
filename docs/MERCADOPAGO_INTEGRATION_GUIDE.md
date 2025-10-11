# MercadoPago Checkout Pro Integration Guide

**Complete Implementation Guide for Tifossi E-Commerce App**

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Webhook Implementation](#webhook-implementation)
7. [Environment Configuration](#environment-configuration)
8. [Testing Strategy](#testing-strategy)
9. [Production Deployment](#production-deployment)
10. [Security Considerations](#security-considerations)
11. [Common Pitfalls](#common-pitfalls)

---

## Overview

MercadoPago Checkout Pro is a fully-hosted payment solution that redirects users to MercadoPago's secure checkout page. This integration supports:

- **Multiple Payment Methods**: Credit cards, debit cards, offline payments (Abitab, RedPagos)
- **Uruguay-Specific Features**: UYU currency, local payment methods
- **Mobile-First**: Deep linking for seamless app-to-checkout-to-app flow
- **Real-time Notifications**: Webhooks for payment status updates

### Key Components

- **Backend (Strapi)**: Creates payment preferences, handles webhooks, manages order state
- **Frontend (React Native/Expo)**: Initiates payment, handles deep links, updates UI
- **MercadoPago API**: Processes payments and sends notifications

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Mobile    │────1───>│    Strapi    │────2───>│  MercadoPago │
│     App     │         │   Backend    │         │     API      │
└─────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        │
       │<───────────────────────┴────────────────────────┘
       │              3. Redirect to checkout
       │
       │<──────────────────────────────────────────────>
                  4. User completes payment
       │
       │<───────────────────────────────────────────────
                  5. Deep link callback
       │
       └───────6. Verify payment status
                     (via webhook)
```

### Payment Flow Sequence

1. **Create Order**: App sends order data to Strapi
2. **Create Preference**: Strapi creates MercadoPago payment preference
3. **Open Checkout**: App opens MercadoPago checkout in browser
4. **Process Payment**: User completes payment on MercadoPago
5. **Callback**: MercadoPago redirects via deep link
6. **Webhook**: MercadoPago sends payment notification to backend
7. **Verify**: App queries backend for final payment status
8. **Update UI**: App shows payment result

---

## Prerequisites

### MercadoPago Account Setup

1. **Create Account**
   - Go to https://www.mercadopago.com.uy/
   - Register as a merchant
   - Complete identity verification

2. **Create Application**
   - Navigate to Developer Panel: https://www.mercadopago.com.uy/developers/panel
   - Click "Create application"
   - Fill details:
     - Name: "Tifossi E-commerce"
     - Solution: "Checkout Pro"
     - Integration: "E-commerce"

3. **Get Credentials**
   - **Test Credentials** (for development):
     - Access Token: `TEST-xxxxx...`
     - Public Key: `TEST-xxxxx...`
   - **Production Credentials** (after activation):
     - Access Token: `APP-xxxxx...`
     - Public Key: `APP-xxxxx...`

4. **Configure Webhooks**
   - Go to application → Webhooks
   - Add webhook URL: `https://api.tifossi.com.uy/webhooks/mercadopago`
   - Select events:
     - `payment.created`
     - `payment.updated`
   - Save and copy webhook secret

### Required NPM Packages

**Backend (already installed):**
```json
{
  "mercadopago": "^2.0.15"
}
```

**Frontend (already installed):**
```json
{
  "expo-web-browser": "~13.0.3"
}
```

---

## Backend Implementation

### 1. MercadoPago Service

The service handles all MercadoPago API interactions. Already implemented in `/backend/strapi/src/lib/payment/mercadopago-service.ts`.

**Key Methods:**

#### Create Payment Preference

```typescript
async createPreference(orderData: OrderData): Promise<MPPreferenceResponse> {
  const preferenceData = {
    items: orderData.items.map(item => ({
      id: item.productId,
      title: item.productName,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'UYU',
      category_id: 'fashion'
    })),

    payer: {
      name: orderData.user.firstName,
      surname: orderData.user.lastName,
      email: orderData.user.email,
      phone: orderData.user.phone,
      identification: orderData.user.identification,
      address: {
        street_name: orderData.shippingAddress.street,
        street_number: parseInt(orderData.shippingAddress.number),
        city: orderData.shippingAddress.city,
        federal_unit: 'Montevideo',
        zip_code: orderData.shippingAddress.zipCode || '11000'
      }
    },

    external_reference: orderData.orderNumber,

    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12,
      default_installments: 1
    },

    back_urls: {
      success: 'tifossi://payment/success',
      failure: 'tifossi://payment/failure',
      pending: 'tifossi://payment/pending'
    },

    auto_return: 'approved',

    notification_url: process.env.WEBHOOK_URL,

    expires: true,
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': this.generateIdempotencyKey(orderData.orderNumber)
    },
    body: JSON.stringify(preferenceData)
  });

  return await response.json();
}
```

#### Get Payment Details

```typescript
async getPayment(paymentId: string): Promise<MPPaymentResponse> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
}
```

#### Verify Webhook Signature

```typescript
verifyWebhookSignature(signature: string, xRequestId: string, dataId: string): boolean {
  // Parse signature: ts=timestamp,v1=hash
  const parts = signature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  // Build manifest
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Calculate HMAC
  const expectedSignature = crypto
    .createHmac('sha256', this.webhookSecret)
    .update(manifest, 'utf8')
    .digest('hex');

  // Compare
  return crypto.timingSafeEqual(
    Buffer.from(v1, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### 2. Payment Controller

Handles API endpoints for payment operations. Implemented in `/backend/strapi/src/api/payment/controllers/payment.js`.

**Endpoints:**

#### POST /api/payment/create-preference

Creates a payment preference and order.

```javascript
async createPreference(ctx) {
  // 1. Authenticate user
  const authUser = ctx.state.user;
  if (!authUser) {
    return ctx.unauthorized('Authentication required');
  }

  // 2. Sanitize and validate order data
  const sanitizedOrder = await sanitizeOrderPayload({
    strapi,
    rawOrder: ctx.request.body.orderData,
    authUser,
    requestMeta: {
      userAgent: ctx.request.headers['user-agent'],
      ip: ctx.request.ip
    }
  });

  // 3. Create order in database
  const orderEntity = await strapi.documents('api::order.order').create({
    data: {
      orderNumber: sanitizedOrder.orderNumber,
      user: authUser.id,
      items: sanitizedOrder.itemsForPersistence,
      total: sanitizedOrder.total,
      status: 'CREATED',
      paymentMethod: 'mercadopago'
    }
  });

  // 4. Create MercadoPago preference
  const mpService = new MercadoPagoService();
  const preference = await mpService.createPreference({
    orderNumber: orderEntity.orderNumber,
    items: sanitizedOrder.mercadoPagoPayload.items,
    user: sanitizedOrder.mercadoPagoPayload.user,
    shippingAddress: sanitizedOrder.mercadoPagoPayload.address,
    total: sanitizedOrder.total
  });

  // 5. Update order with preference ID
  await strapi.documents('api::order.order').update({
    documentId: orderEntity.documentId,
    data: {
      mpPreferenceId: preference.id,
      status: 'PAYMENT_PENDING'
    }
  });

  // 6. Return response
  ctx.body = {
    success: true,
    data: {
      order: orderEntity,
      preference: {
        id: preference.id,
        initPoint: preference.init_point,
        externalReference: preference.external_reference
      }
    }
  };
}
```

#### GET /api/payment/verify/:paymentId

Verifies payment status with MercadoPago.

```javascript
async verifyPayment(ctx) {
  const { paymentId } = ctx.params;

  // Get payment from MercadoPago
  const mpService = new MercadoPagoService();
  const paymentInfo = await mpService.getPayment(paymentId);

  // Find order
  const order = await strapi.documents('api::order.order').findOne({
    filters: { mpPaymentId: paymentId, user: ctx.state.user.id }
  });

  // Update order status
  const orderStatus = mpService.mapPaymentStatus(paymentInfo.status);
  await strapi.documents('api::order.order').update({
    documentId: order.documentId,
    data: {
      status: orderStatus,
      paidAt: paymentInfo.date_approved
    }
  });

  ctx.body = {
    success: true,
    data: {
      status: orderStatus,
      paymentInfo: {
        id: paymentInfo.id,
        status: paymentInfo.status,
        amount: paymentInfo.transaction_amount
      }
    }
  };
}
```

### 3. Webhook Handler

Processes payment notifications from MercadoPago. Implemented in `/backend/strapi/src/webhooks/mercadopago.ts`.

```typescript
async handleWebhook(ctx: Context): Promise<void> {
  // 1. Extract webhook data
  const webhookData = ctx.request.body;
  const signature = ctx.request.headers['x-signature'];
  const requestId = ctx.request.headers['x-request-id'];
  const dataId = webhookData.data?.id;

  // 2. Verify signature
  const mpService = new MercadoPagoService();
  if (!mpService.verifyWebhookSignature(signature, requestId, dataId)) {
    ctx.unauthorized('Invalid signature');
    return;
  }

  // 3. Process notification based on type
  switch (webhookData.type) {
    case 'payment':
      await this.handlePaymentNotification(webhookData.data, requestId);
      break;
    default:
      strapi.log.warn(`Unknown webhook type: ${webhookData.type}`);
  }

  // 4. Always return 200 to acknowledge receipt
  ctx.status = 200;
  ctx.body = { success: true };
}

async handlePaymentNotification(paymentData, requestId) {
  const paymentId = paymentData.id;

  // Get payment details from MercadoPago
  const mpService = new MercadoPagoService();
  const paymentInfo = await mpService.getPayment(paymentId);

  // Find order by external reference
  const order = await strapi.documents('api::order.order').findOne({
    filters: { orderNumber: paymentInfo.external_reference }
  });

  if (!order) {
    strapi.log.warn(`Order not found: ${paymentInfo.external_reference}`);
    return;
  }

  // Map payment status to order status
  const newStatus = mpService.mapPaymentStatus(
    paymentInfo.status,
    paymentInfo.status_detail
  );

  // Update order
  await strapi.documents('api::order.order').update({
    documentId: order.documentId,
    data: {
      mpPaymentId: paymentInfo.id,
      mpPaymentStatus: paymentInfo.status,
      status: newStatus,
      paidAt: paymentInfo.date_approved,
      metadata: {
        ...order.metadata,
        lastWebhookUpdate: new Date().toISOString(),
        webhookRequestId: requestId,
        paymentStatusDetail: paymentInfo.status_detail
      }
    }
  });

  // Process post-payment actions
  await this.processPostPaymentActions(order, newStatus, paymentInfo);
}
```

---

## Frontend Implementation

### 1. MercadoPago Service

Mobile app service for payment operations. Implemented in `/app/_services/payment/mercadoPago.ts`.

#### Create Payment Preference

```typescript
async createPaymentPreference(orderData: OrderData): Promise<PaymentPreference> {
  const response = await fetch(`${this.baseUrl}/api/payment/create-preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    },
    body: JSON.stringify({ orderData })
  });

  const result = await response.json();

  return {
    id: result.data.preference.id,
    initPoint: result.data.preference.initPoint,
    externalReference: result.data.preference.externalReference
  };
}
```

#### Initiate Payment

```typescript
async initiatePayment(preference: PaymentPreference): Promise<PaymentResult> {
  // Warm up browser
  await WebBrowser.warmUpAsync();

  // Open MercadoPago checkout
  const result = await WebBrowser.openBrowserAsync(preference.initPoint, {
    // iOS options
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    controlsColor: '#0C0C0C',

    // Android options
    showTitle: true,
    enableBarCollapsing: false,

    // Common options
    toolbarColor: '#FFFFFF',
    showInRecents: false
  });

  // Cool down browser
  await WebBrowser.coolDownAsync();

  if (result.type === 'cancel') {
    return {
      success: false,
      error: 'Payment cancelled by user'
    };
  }

  return {
    success: true,
    orderId: preference.externalReference
  };
}
```

#### Parse Deep Link Callback

```typescript
parsePaymentCallback(url: string): PaymentResult | null {
  const urlObj = new URL(url);

  // Validate scheme (security)
  if (urlObj.protocol !== 'tifossi:') {
    return null;
  }

  // Validate host
  if (urlObj.hostname !== 'payment') {
    return null;
  }

  // Extract status from path: tifossi://payment/success
  const pathParts = urlObj.pathname.split('/');
  const status = pathParts[pathParts.length - 1]; // 'success', 'failure', 'pending'

  // Validate status
  if (!['success', 'failure', 'pending'].includes(status)) {
    return null;
  }

  // Extract query parameters
  const params: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return {
    success: status === 'success',
    orderId: params.external_reference,
    paymentId: params.payment_id,
    collectionId: params.collection_id,
    status: this.mapUrlStatusToPaymentStatus(status),
    error: status === 'failure' ? 'Payment rejected' : undefined
  };
}
```

### 2. Deep Link Configuration

Configure deep links in `app.json` for iOS and Android:

```json
{
  "expo": {
    "scheme": "tifossi",
    "ios": {
      "bundleIdentifier": "com.tifossi.app",
      "associatedDomains": ["applinks:tifossi.com.uy"]
    },
    "android": {
      "package": "com.tifossi.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "tifossi",
              "host": "payment",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 3. Payment Flow Implementation

Example payment screen component:

```typescript
import { mercadoPagoService } from '@/_services/payment/mercadoPago';
import { usePaymentStore } from '@/_stores/paymentStore';
import * as Linking from 'expo-linking';

export default function PaymentScreen() {
  const { currentOrder, setPaymentStatus } = usePaymentStore();
  const [loading, setLoading] = useState(false);

  // Handle deep link callback
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    const result = mercadoPagoService.parsePaymentCallback(url);

    if (result) {
      if (result.success && result.paymentId) {
        // Verify payment status with backend
        const status = await mercadoPagoService.verifyPaymentStatus(result.paymentId);
        setPaymentStatus(status);

        // Navigate to success/failure screen
        router.push(`/payment/result?status=${status.status}`);
      }
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create payment preference
      const preference = await mercadoPagoService.createPaymentPreference({
        orderNumber: mercadoPagoService.generateOrderNumber(),
        items: currentOrder.items,
        user: currentUser,
        shippingAddress: shippingAddress,
        total: currentOrder.total
      });

      // Open checkout
      const result = await mercadoPagoService.initiatePayment(preference);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to open payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Pay with MercadoPago" onPress={handlePayment} disabled={loading} />
    </View>
  );
}
```

---

## Webhook Implementation

### Security Best Practices

1. **Always Verify Signatures**
   - Prevents fraudulent webhook calls
   - Uses HMAC SHA256 verification
   - Includes timestamp to prevent replay attacks

2. **Validate Timestamp**
   - Reject webhooks older than 5 minutes
   - Prevents replay attacks

3. **Use HTTPS Only**
   - All webhook URLs must use HTTPS
   - Use valid SSL certificates

4. **Return 200 Immediately**
   - Process asynchronously if needed
   - Don't delay response

### Webhook Payload Structure

```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "123456789"
  },
  "date_created": "2025-02-07T10:00:00Z",
  "id": 123456789,
  "live_mode": false,
  "type": "payment",
  "user_id": "987654321"
}
```

### Headers

```
x-signature: ts=1612345678,v1=abc123...
x-request-id: unique-request-id
```

---

## Environment Configuration

### Development (.env.test)

```bash
# MercadoPago Test Credentials
MP_TEST_ACCESS_TOKEN=TEST-1234567890-123456-abcdef...
MP_TEST_PUBLIC_KEY=TEST-abcd1234-5678-90ef-ghij...
MP_WEBHOOK_SECRET=test_secret_xyz...

# API Configuration
MP_API_URL=https://api.mercadopago.com
API_BASE_URL=http://localhost:1337
WEBHOOK_URL=http://localhost:1337/webhooks/mercadopago

# App Configuration
APP_SCHEME=tifossi
NODE_ENV=development
```

### Production (.env)

```bash
# MercadoPago Production Credentials (NEVER COMMIT!)
MP_ACCESS_TOKEN=APP-1234567890-123456-abcdef...
MP_PUBLIC_KEY=APP-abcd1234-5678-90ef-ghij...
MP_WEBHOOK_SECRET=prod_secret_xyz...

# API Configuration
MP_API_URL=https://api.mercadopago.com
API_BASE_URL=https://api.tifossi.com.uy
WEBHOOK_URL=https://api.tifossi.com.uy/webhooks/mercadopago

# App Configuration
APP_SCHEME=tifossi
NODE_ENV=production
```

### Render.com Configuration

Set environment variables in Render dashboard:

1. Go to your service → Environment
2. Add environment variables (one per line):

```
MP_ACCESS_TOKEN=APP-...
MP_PUBLIC_KEY=APP-...
MP_WEBHOOK_SECRET=...
WEBHOOK_URL=https://api.tifossi.com.uy/webhooks/mercadopago
```

---

## Testing Strategy

### Test Credentials

See `/docs/MERCADOPAGO_CREDENTIAL_SETUP.md` for detailed instructions.

### Test Cards (Uruguay)

**Credit Cards:**
- Mastercard: `5031 7557 3453 0604` (CVV: 123, Exp: 11/30)
- Visa: `4509 9535 6623 3704` (CVV: 123, Exp: 11/30)

**Debit Card:**
- Visa Debit: `4213 0163 1470 6756` (CVV: 123, Exp: 11/30)

**Cardholder Names (Control Payment Outcome):**
- `APRO`: Payment approved
- `FUND`: Rejected - insufficient funds
- `OTHE`: Rejected - general error
- `CONT`: Pending payment
- `CALL`: Requires authorization call

### Testing Webhooks Locally

Use ngrok to expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Start backend
cd backend/strapi
npm run develop

# In another terminal, expose port 1337
ngrok http 1337

# Copy HTTPS URL and update webhook URL in MercadoPago dashboard
# Example: https://abc123.ngrok.io/webhooks/mercadopago
```

### Running Integration Tests

```bash
# Run payment flow tests
ENABLE_PAYMENT_TESTS=true npx jest --watchman=false \
  app/_tests/integration/mercadopago-payment-flow.test.tsx

# Run revenue-critical tests
ENABLE_PAYMENT_TESTS=true npx jest --watchman=false \
  app/_tests/integration/revenue-critical-purchase.test.tsx
```

See `/docs/MERCADOPAGO_TESTING_PLAN.md` for complete testing documentation.

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Production credentials obtained and activated
- [ ] Webhook URL configured (must be HTTPS)
- [ ] Webhook secret stored securely
- [ ] Environment variables set in hosting service
- [ ] Deep link configuration updated
- [ ] Bundle identifiers set to production values
- [ ] Test all payment flows in production environment
- [ ] Monitor webhook logs for first 24 hours

### Activating Production Credentials

1. Complete MercadoPago business verification
2. Go to Developer Panel → Your integrations → Select app
3. Navigate to "Production credentials"
4. Complete activation requirements:
   - Business information
   - Bank account details
   - Tax ID (RUT)
5. Credentials will be activated (usually within 24 hours)

### Monitoring

**Key Metrics to Monitor:**

- Payment success rate
- Webhook delivery success rate
- Average payment processing time
- Failed payment reasons
- Refund rate

**MercadoPago Dashboard:**
- Check daily transaction reports
- Monitor chargebacks and disputes
- Review payment method usage

**Backend Logging:**

```typescript
// Log all payment events
strapi.log.info('Payment created:', {
  orderId: order.id,
  amount: order.total,
  status: 'PAYMENT_PENDING'
});

strapi.log.info('Payment approved:', {
  orderId: order.id,
  paymentId: paymentInfo.id,
  amount: paymentInfo.transaction_amount
});

strapi.log.error('Payment failed:', {
  orderId: order.id,
  status: paymentInfo.status,
  statusDetail: paymentInfo.status_detail
});
```

---

## Security Considerations

### Backend Security

1. **Always Validate Webhook Signatures**
   ```typescript
   if (!mpService.verifyWebhookSignature(signature, requestId, dataId)) {
     return ctx.unauthorized('Invalid signature');
   }
   ```

2. **Use Idempotency Keys**
   - Prevents duplicate charges on network errors
   - Generate from order number + environment

3. **Sanitize Input**
   - Remove HTML tags from user input
   - Validate email format
   - Limit string lengths

4. **Store Minimal Payment Data**
   - Never store card numbers
   - Store only MercadoPago payment IDs
   - Log sensitive operations

### Frontend Security

1. **Validate Deep Links**
   ```typescript
   // Verify scheme and host
   if (urlObj.protocol !== 'tifossi:' || urlObj.hostname !== 'payment') {
     return null;
   }
   ```

2. **Never Expose Access Tokens**
   - Access tokens only on backend
   - Use public key for frontend (if needed)
   - Don't log tokens

3. **Verify Payment Status**
   - Always verify with backend after deep link callback
   - Don't trust URL parameters alone

### Environment Variables

**DO:**
- Use environment variables for all credentials
- Rotate webhook secrets periodically
- Use different credentials for test/production

**DON'T:**
- Commit credentials to Git
- Share webhook secrets
- Log credentials in production
- Use production credentials in test environment

---

## Common Pitfalls

### 1. Webhook Not Receiving Notifications

**Symptoms:**
- Payment completes but order status doesn't update
- No webhook logs in backend

**Solutions:**
- Verify webhook URL is publicly accessible (HTTPS)
- Check webhook URL configuration in MercadoPago dashboard
- Verify webhook secret matches
- Check firewall/security group settings
- Ensure webhook handler returns 200 status
- Test webhook with ngrok locally

### 2. Deep Link Not Working

**Symptoms:**
- App doesn't open after payment
- User stuck on MercadoPago success page

**Solutions:**
- Verify app.json scheme configuration
- Check iOS associated domains
- Verify Android intent filters
- Test deep links: `npx uri-scheme open tifossi://payment/success --ios`
- Ensure back_urls use correct scheme

### 3. Signature Verification Failing

**Symptoms:**
- All webhooks rejected with "Invalid signature"

**Solutions:**
- Verify webhook secret matches dashboard
- Check manifest format: `id:${dataId};request-id:${xRequestId};ts:${ts};`
- Ensure using correct hash algorithm (HMAC SHA256)
- Verify timestamp parsing
- Check for trailing semicolon in manifest

### 4. Payment Stuck in Pending

**Symptoms:**
- Order status remains PAYMENT_PENDING
- User completed payment but no confirmation

**Solutions:**
- Check if webhook was delivered
- Verify payment status manually via API
- Check MercadoPago dashboard for payment status
- Ensure webhook handler processes pending payments
- Verify external_reference matches order number

### 5. Wrong Environment Credentials

**Symptoms:**
- "Invalid credentials" errors
- Payments not appearing in dashboard

**Solutions:**
- Verify using TEST- prefix for sandbox
- Check NODE_ENV environment variable
- Ensure credentials match selected environment
- Verify credentials haven't expired

### 6. Preference Expiration

**Symptoms:**
- "Preference expired" error
- User can't complete payment

**Solutions:**
- Set reasonable expiration time (30 minutes)
- Handle expired preferences in frontend
- Allow user to recreate preference
- Don't reuse old preference IDs

### 7. Currency Mismatch

**Symptoms:**
- Payment rejected
- Amount doesn't match order total

**Solutions:**
- Always use 'UYU' for Uruguay
- Ensure all amounts in same currency
- Check shipping cost currency
- Verify discount calculation

---

## API Reference

### MercadoPago API Endpoints

**Create Preference:**
```
POST https://api.mercadopago.com/checkout/preferences
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

**Get Payment:**
```
GET https://api.mercadopago.com/v1/payments/{id}
Authorization: Bearer ACCESS_TOKEN
```

**Create Refund:**
```
POST https://api.mercadopago.com/v1/payments/{id}/refunds
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

### Strapi API Endpoints

**Create Payment Preference:**
```
POST /api/payment/create-preference
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Verify Payment:**
```
GET /api/payment/verify/:paymentId
Authorization: Bearer JWT_TOKEN
```

**Get Orders:**
```
GET /api/payment/orders?page=1&pageSize=10&status=PAID
Authorization: Bearer JWT_TOKEN
```

**Request Refund:**
```
POST /api/payment/refund
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

---

## Additional Resources

### Official Documentation
- [MercadoPago Uruguay Developers](https://www.mercadopago.com.uy/developers/)
- [Checkout Pro Documentation](https://www.mercadopago.com.uy/developers/en/docs/checkout-pro/overview)
- [API Reference](https://www.mercadopago.com.uy/developers/en/reference)
- [Webhook Configuration](https://www.mercadopago.com.uy/developers/en/docs/your-integrations/notifications/webhooks)
- [Test Cards](https://www.mercadopago.com.uy/developers/en/docs/your-integrations/test/cards)

### Tifossi Documentation
- `/docs/MERCADOPAGO_CREDENTIAL_SETUP.md` - Credential setup guide
- `/docs/MERCADOPAGO_TESTING_PLAN.md` - Testing strategy
- `/docs/MERCADOPAGO_ALIGNMENT_STATUS.md` - Implementation status

### Support
- MercadoPago Support: https://www.mercadopago.com.uy/developers/support
- API Status: https://status.mercadopago.com/
- Community Forum: https://forum.mercadopago.com/

---

## Summary

This guide covers the complete MercadoPago Checkout Pro integration for the Tifossi e-commerce app. The implementation includes:

1. **Backend (Strapi)**: Complete API for creating preferences, verifying payments, and handling webhooks
2. **Frontend (React Native/Expo)**: Mobile payment flow with deep linking and status verification
3. **Security**: Webhook signature verification, input sanitization, secure credential management
4. **Testing**: Comprehensive test strategy with sandbox credentials and test cards
5. **Production**: Deployment checklist and monitoring guidelines

The codebase already has a production-ready implementation. This guide serves as documentation for:
- Understanding the payment flow
- Configuring credentials
- Troubleshooting issues
- Deploying to production
- Maintaining the integration

**Next Steps:**
1. Obtain production MercadoPago credentials
2. Configure webhook URL in Render.com
3. Update environment variables in hosting service
4. Test complete payment flow in production
5. Monitor payment metrics

---

**Last Updated**: February 2025
**MercadoPago API Version**: v1
**Tifossi App Version**: 1.0.0
