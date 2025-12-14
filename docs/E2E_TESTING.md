# Tifossi E2E Testing Guide

**For Claude using MCP tools** | iOS Simulator + MercadoPago

---

## Overview

E2E tests are run by Claude using:
- `ios-simulator` MCP - UI automation on iOS Simulator
- `mercadopago` MCP - Payment validation and webhooks

**Always start here.** Reference docs linked at bottom for specific scenarios.

---

## Quick Start

```
1. mcp__ios-simulator__get_booted_sim_id     → Get simulator UDID
2. mcp__ios-simulator__launch_app            → bundle_id: "app.tiffosi.store"
3. Wait 2s, then mcp__ios-simulator__ui_describe_all
4. Navigate and test
```

**Golden Rules:**
- `ui_describe_all` BEFORE every `ui_tap` (coordinates change)
- Wait 1-2s after navigation before describing elements
- Screenshot (`ui_view`) when uncertain

---

## Credentials

**App Login:**
```
Email: test@tifossi.com
Password: Test123!
```

**MercadoPago Test Cards (Uruguay):**
| Card | Number | CVV | Exp |
|------|--------|-----|-----|
| Mastercard | `5031 7557 3453 0604` | 123 | 11/30 |

**Cardholder names control result:**
| Name | Result |
|------|--------|
| `APRO` | Approved |
| `FUND` | Declined (insufficient funds) |
| `CONT` | Pending |

---

## MCP Tool Reference

### iOS Simulator

| Tool | Use |
|------|-----|
| `get_booted_sim_id` | Get UDID (call first) |
| `launch_app` | Launch app (`bundle_id: "app.tiffosi.store"`) |
| `ui_describe_all` | Get all elements + positions |
| `ui_tap` | Tap at x,y coordinates |
| `ui_type` | Type text into focused field |
| `ui_swipe` | Swipe gesture |
| `ui_view` | Get compressed screenshot |
| `screenshot` | Save full screenshot to file |

### MercadoPago

| Tool | Use |
|------|-----|
| `quality_evaluation` | Evaluate payment by ID |
| `quality_checklist` | Get integration checklist |
| `notifications_history` | Check webhook delivery |
| `simulate_webhook` | Send test notification |

---

## Core Test Flows

### 1. Login

```
1. launch_app (terminate_running: true)
2. Wait 2s, ui_describe_all
3. Tap profile tab (bottom right)
4. Wait 1s, ui_describe_all
5. Tap "Iniciar sesion"
6. Tap email field, ui_type "test@tifossi.com"
7. Tap password field, ui_type "Test123!"
8. Tap login button
9. Wait 2s, verify profile shows user info
```

### 2. Add to Cart

```
1. ui_describe_all
2. Tap any product card
3. Wait 1s, ui_describe_all
4. Select size (tap size option)
5. Tap "Agregar al carrito"
6. Verify success feedback
```

### 3. Checkout + Payment

```
1. Navigate to cart tab
2. Tap "Comprar ahora"
3. Select/add shipping address
4. Select MercadoPago payment
5. Tap continue → WebView opens
6. In WebView:
   - Card: 5031755734530604
   - Name: APRO (or FUND/CONT for other results)
   - CVV: 123, Exp: 11/30
   - ID Type: CI, Number: 12345678
7. Submit payment
8. Wait 3-5s for deep link return
9. Verify success/failure screen
```

### 4. Deep Link Payment Callbacks

More reliable than WebView automation:

```bash
# Success
xcrun simctl openurl booted "tifossi://checkout/payment-result?paymentSuccess=true&payment_id=123&external_reference=TIF-123"

# Failure
xcrun simctl openurl booted "tifossi://checkout/payment-result?paymentFailure=true&payment_id=123&external_reference=TIF-123"

# Pending
xcrun simctl openurl booted "tifossi://checkout/payment-result?paymentPending=true&payment_id=123&external_reference=TIF-123"
```

After each, `ui_describe_all` to verify correct screen displayed.

---

## Error Recovery

**Element not found:**
1. Wait 2s
2. `ui_describe_all` again
3. After 3 failures, `ui_view` screenshot + relaunch app

**App crashed:**
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

## Critical Path Tests

**Must pass before release:**

- [ ] Email login works
- [ ] Products load and display
- [ ] Add to cart works
- [ ] Checkout flow completes
- [ ] Payment success callback returns to app
- [ ] Payment failure shows error + retry

---

## Reference Docs

| Doc | Content |
|-----|---------|
| [E2E_PAYMENT_TESTING.md](./E2E_PAYMENT_TESTING.md) | Full payment scenarios, test cards, webhooks |
| [E2E_TEST_SCENARIOS.md](./E2E_TEST_SCENARIOS.md) | Complete test case matrix by feature |

---

## Test Execution Log

| Date | Tester | Tests Run | Pass | Fail | Notes |
|------|--------|-----------|------|------|-------|
| | | | | | |
