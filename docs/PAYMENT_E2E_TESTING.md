# Tifossi Payment E2E Testing Guide

**Region**: Uruguay (MLU) | **Bundle ID**: `app.tiffosi.store` | **URL Scheme**: `tifossi`

---

## Quick Start

```
1. mcp__ios-simulator__get_booted_sim_id     → Get simulator UDID
2. mcp__ios-simulator__launch_app            → bundle_id: "app.tiffosi.store", terminate_running: true
3. Wait 2s, then mcp__ios-simulator__ui_describe_all
4. Login (see below), then run payment tests
```

**Rules:**
- ALWAYS `ui_describe_all` before any `ui_tap` to get fresh coordinates
- ALWAYS wait 1-2s after navigation before getting elements
- WebView has limited automation - deep link tests are more reliable

---

## Test Credentials

**App Login:**
```
Email: test@tifossi.com
Password: Test123!
```

**Test Cards (Uruguay):**
| Card | Number | CVV | Expiry |
|------|--------|-----|--------|
| Mastercard | `5031 7557 3453 0604` | 123 | 11/30 |
| Visa Credit | `4509 9535 6623 3704` | 123 | 11/30 |
| Visa Debit | `4213 0163 1470 6756` | 123 | 11/30 |

**Cardholder Names (control payment result):**
| Name | Result |
|------|--------|
| `APRO` | Approved |
| `FUND` | Declined - insufficient funds |
| `SECU` | Declined - invalid CVV |
| `EXPI` | Declined - expired card |
| `OTHE` | Declined - general error |
| `CONT` | Pending - manual review |
| `CALL` | Declined - call bank |
| `LOCK` | Rejected - disabled card |

**Identity (Uruguay):** Type: `CI`, Number: `12345678`

---

## MCP Tools

### iOS Simulator
| Tool | Purpose |
|------|---------|
| `get_booted_sim_id` | Get UDID (call first) |
| `launch_app` | Launch by bundle ID |
| `ui_tap` | Tap at x,y |
| `ui_type` | Type text |
| `ui_swipe` | Swipe gesture |
| `ui_describe_all` | Get all elements with positions |
| `ui_view` | Compressed screenshot |
| `screenshot` | Save screenshot to file |

### MercadoPago
| Tool | Purpose |
|------|---------|
| `quality_evaluation` | Evaluate payment by ID |
| `quality_checklist` | Get integration quality fields |
| `notifications_history` | Check webhook delivery |
| `simulate_webhook` | Send test notification |

---

## Login Flow

| Step | Action |
|------|--------|
| 1 | `launch_app` with `terminate_running: true` |
| 2 | Wait 2s, `ui_describe_all` |
| 3 | Tap profile tab (bottom right) |
| 4 | Wait 1s, `ui_describe_all` |
| 5 | Tap "Iniciar sesion" if visible |
| 6 | Tap email field, `ui_type` "test@tifossi.com" |
| 7 | Tap password field, `ui_type` "Test123!" |
| 8 | Tap login button |
| 9 | Wait 2s, verify logged in |

---

## Payment Test Cases

### 1. Successful Payment (APRO)

| Step | Action |
|------|--------|
| 1 | Login (if needed) |
| 2 | `ui_describe_all`, tap a product |
| 3 | Select size, tap "Agregar al carrito" |
| 4 | Navigate to cart tab |
| 5 | Tap "Comprar ahora" |
| 6 | Select/add shipping address |
| 7 | Select MercadoPago, continue |
| 8 | **WebView opens** - take `ui_view` screenshot |
| 9 | Enter card: `5031755734530604`, name: `APRO`, CVV: `123`, expiry: `1130` |
| 10 | Enter CI: `12345678`, submit |
| 11 | Wait 3-5s, verify success screen |
| 12 | `quality_evaluation` with payment_id |

**Pass:** Success screen, order number displayed, cart emptied.

### 2. Declined Payment (FUND)

Same as above but use name: `FUND`

**Pass:** Error shown, cart preserved, retry available.

### 3. Pending Payment (CONT)

Same as above but use name: `CONT`

**Pass:** Pending message shown, cart cleared (order created).

---

## Deep Link Tests

More reliable than WebView automation. Run via Bash:

```bash
# Success callback
xcrun simctl openurl booted "tifossi://payment/success?payment_id=123456789&external_reference=TIF-20241201-123456"

# Failure callback
xcrun simctl openurl booted "tifossi://payment/failure?payment_id=123456789&external_reference=TIF-20241201-123456"

# Pending callback
xcrun simctl openurl booted "tifossi://payment/pending?payment_id=123456789&external_reference=TIF-20241201-123456"
```

After each, call `ui_describe_all` to verify correct screen.

---

## Webhook Testing

```
# Check delivery history
mcp__mercadopago__notifications_history

# Simulate webhook (after a test payment)
mcp__mercadopago__simulate_webhook
  topic: "payment"
  resource_id: "<payment_id>"
  callback_env_production: true
```

**Pass:** 200 response, order status updated.

---

## Edge Cases

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| User cancels | Navigate to WebView, swipe back or tap cancel | Returns to app, cart preserved |
| Duplicate (DUPL) | Complete payment, immediately try again with name `DUPL` | Second payment rejected |

---

## Error Recovery

**Element not found:**
1. Wait 2s, retry `ui_describe_all`
2. If still missing after 3 retries, screenshot and relaunch app

**App crashed (very few elements):**
```
mcp__ios-simulator__launch_app
  bundle_id: "app.tiffosi.store"
  terminate_running: true
```

**Stuck in WebView:**
```
mcp__ios-simulator__ui_swipe
  x_start: 0, y_start: 400, x_end: 200, y_end: 400
```

---

## Test Checklist

**Critical (must pass):**
- [ ] APRO: Successful payment
- [ ] FUND: Insufficient funds handled
- [ ] CONT: Pending payment handled
- [ ] Deep link success callback
- [ ] Deep link failure callback
- [ ] Webhook delivery

**Results:**
| Test | Status | Payment ID | Notes |
|------|--------|------------|-------|
| APRO Credit | | | |
| FUND Decline | | | |
| CONT Pending | | | |
| Success Deep Link | | | |
| Failure Deep Link | | | |
| Webhook | | | |
