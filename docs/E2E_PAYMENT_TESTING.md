# Payment E2E Testing Reference

**Parent doc:** [E2E_TESTING.md](./E2E_TESTING.md)

---

## Test Cards (Uruguay - MLU)

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Mastercard | `5031 7557 3453 0604` | 123 | 11/30 |
| Visa Credit | `4509 9535 6623 3704` | 123 | 11/30 |
| Visa Debit | `4213 0163 1470 6756` | 123 | 11/30 |

**Identity:** Type: `CI`, Number: `12345678`

---

## Cardholder Names (Control Result)

| Name | Payment Result |
|------|----------------|
| `APRO` | Approved |
| `FUND` | Declined - insufficient funds |
| `SECU` | Declined - invalid CVV |
| `EXPI` | Declined - expired card |
| `OTHE` | Declined - general error |
| `CONT` | Pending - manual review |
| `CALL` | Declined - call bank |
| `LOCK` | Rejected - disabled card |

---

## Payment Test Scenarios

### Successful Payment (APRO)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Add product to cart | Item in cart |
| 2 | Tap "Comprar ahora" | Checkout starts |
| 3 | Select shipping | Address/pickup selected |
| 4 | Select MercadoPago | Payment method selected |
| 5 | Continue to payment | WebView opens |
| 6 | Enter card `5031755734530604` | Card accepted |
| 7 | Name: `APRO`, CVV: `123`, Exp: `1130` | Fields filled |
| 8 | Enter CI: `12345678` | ID accepted |
| 9 | Submit payment | Processing... |
| 10 | Wait 3-5s | Deep link returns to app |
| **Pass** | Success screen shown, order number displayed, cart emptied |

### Declined Payment (FUND)

Same flow, but name: `FUND`

**Pass:** Error screen shown, cart preserved, retry button available.

### Pending Payment (CONT)

Same flow, but name: `CONT`

**Pass:** Pending message shown, order created, cart cleared.

---

## Deep Link Testing

More reliable than WebView automation:

```bash
# Get booted simulator
xcrun simctl list devices | grep Booted

# Success callback
xcrun simctl openurl booted "tifossi://payment/success?payment_id=123456789&external_reference=TIF-20241201-123456"

# Failure callback
xcrun simctl openurl booted "tifossi://payment/failure?payment_id=123456789&external_reference=TIF-20241201-123456"

# Pending callback
xcrun simctl openurl booted "tifossi://payment/pending?payment_id=123456789&external_reference=TIF-20241201-123456"
```

After each, run `ui_describe_all` to verify:
- Success: Shows order confirmation with order number
- Failure: Shows error with retry option
- Pending: Shows pending status message

---

## Webhook Testing

```
# Check notification delivery history
mcp__mercadopago__notifications_history

# Simulate webhook for a payment
mcp__mercadopago__simulate_webhook
  topic: "payment"
  resource_id: "<payment_id_from_test>"
  callback_env_production: true
```

**Pass:** 200 response from backend, order status updated in system.

---

## Edge Cases

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| User cancels payment | Navigate to WebView, swipe back | Cart preserved, returns to app |
| Duplicate payment | Complete payment, try same order again | Second attempt rejected |
| Network loss in WebView | Lose connection mid-payment | Error shown, can retry |
| Invalid card format | Enter malformed card number | Validation error in WebView |

---

## MercadoPago MCP Tools

| Tool | Purpose |
|------|---------|
| `quality_evaluation` | Get quality score for a payment ID |
| `quality_checklist` | List integration quality requirements |
| `notifications_history` | View webhook delivery attempts |
| `simulate_webhook` | Trigger test webhook notification |

---

## Test Checklist

**Critical:**
- [ ] APRO: Successful payment completes
- [ ] FUND: Insufficient funds handled gracefully
- [ ] CONT: Pending payment shown correctly
- [ ] Deep link success callback works
- [ ] Deep link failure callback works
- [ ] Webhook delivery succeeds

**Results Log:**

| Test | Status | Payment ID | Notes |
|------|--------|------------|-------|
| APRO | | | |
| FUND | | | |
| CONT | | | |
| Success Deep Link | | | |
| Failure Deep Link | | | |
| Webhook | | | |
