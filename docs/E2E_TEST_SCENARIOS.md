# E2E Test Scenarios Reference

**Parent doc:** [E2E_TESTING.md](./E2E_TESTING.md)

Complete test matrix organized by feature. Use for systematic testing sessions.

---

## 1. Authentication

### Email Registration
| Scenario | Steps | Expected |
|----------|-------|----------|
| Valid registration | Name + valid email + password (8+ chars) + confirm | Account created |
| Invalid email | Enter "notanemail" | Error shown |
| Short password | Password < 8 chars | Error shown |
| Password mismatch | Different confirm password | Error shown |
| Existing email | Register with used email | Error shown |

### Email Login
| Scenario | Steps | Expected |
|----------|-------|----------|
| Valid login | Correct email + password | Logged in, home shown |
| Wrong password | Correct email + wrong password | Error shown |
| Non-existent email | Unregistered email | Error shown |

### Social Login
| Scenario | Steps | Expected |
|----------|-------|----------|
| Apple Sign-In | Tap Apple button, authenticate | Logged in |
| Google Sign-In | Tap Google button, select account | Logged in |
| Cancel social | Start then cancel | Returns to login |

### Logout
| Scenario | Steps | Expected |
|----------|-------|----------|
| Logout | Profile > Cerrar Sesion > Confirm | Logged out, at home |
| Cancel logout | Profile > Cerrar Sesion > Cancel | Still logged in |

---

## 2. Product Browsing

### Home Screen
| Scenario | Steps | Expected |
|----------|-------|----------|
| Initial load | Open app | Skeleton > content loads |
| All sections | Scroll home | All sections visible |
| Tap product | Tap any product card | Product detail opens |
| Tap "Ver Mas" | Tap in any section | Catalog with filter |

### Catalog & Filters
| Scenario | Steps | Expected |
|----------|-------|----------|
| Category filter | Tap category tab | Products filtered |
| Price filter | Adjust price slider | Products filtered |
| Size filter | Select size(s) | Products filtered |
| Color filter | Select color(s) | Products filtered |
| Multiple filters | Price + size + color | Combined filter |
| Clear filters | Tap "Limpiar todo" | All filters removed |
| No results | Filter with no matches | "No products" message |

### Product Detail
| Scenario | Steps | Expected |
|----------|-------|----------|
| Load detail | Tap product | Full info displayed |
| Image gallery | Swipe main image | Navigate images |
| Select color | Tap color swatch | Color selected, images update |
| Select size | Tap size option | Size selected |
| Out of stock size | View unavailable size | Disabled or "Agotado" |
| Change quantity | Tap +/- | Quantity updates |

---

## 3. Cart

### Add to Cart
| Scenario | Steps | Expected |
|----------|-------|----------|
| Add (logged in) | Select variants > Add | Success feedback |
| Add (guest) | Select variants > Add | Added to guest cart |
| Add without size | Try without selecting | Error shown |
| Add same twice | Add product, add again | Quantity increases |
| Add different variant | Add, then different size | Separate item |

### Cart Management
| Scenario | Steps | Expected |
|----------|-------|----------|
| View cart | Navigate to cart tab | Items listed |
| Empty cart | Cart with no items | Empty state + CTA |
| Increase qty | Tap + on item | Qty increases, total updates |
| Decrease qty | Tap - on item | Qty decreases, total updates |
| Remove item | Swipe or tap remove | Item removed |
| Edit size | Change size selection | Item updated |

### Cart Persistence
| Scenario | Steps | Expected |
|----------|-------|----------|
| Guest persist | Add item, close app, reopen | Cart still there |
| Login sync | Add as guest, login | Cart merged |

---

## 4. Checkout

### Shipping
| Scenario | Steps | Expected |
|----------|-------|----------|
| Saved addresses | Go to shipping | Addresses listed |
| Select address | Tap radio button | Address selected |
| Add new address | Tap "Agregar direccion" | Form opens |
| Select delivery | Choose "Envio a domicilio" | Delivery selected |
| Select pickup | Choose "Retiro en tienda" | Store selection shown |

### Store Selection (Pickup)
| Scenario | Steps | Expected |
|----------|-------|----------|
| View stores | Select pickup | Stores listed by city |
| Select store | Tap store | Store selected |

### Payment
| Scenario | Steps | Expected |
|----------|-------|----------|
| View methods | Go to payment step | MercadoPago shown |
| Select MercadoPago | Tap option | Selected |
| Continue | Tap "Continuar" | WebView opens |

See [E2E_PAYMENT_TESTING.md](./E2E_PAYMENT_TESTING.md) for payment flow details.

---

## 5. Favorites

| Scenario | Steps | Expected |
|----------|-------|----------|
| Add favorite | Tap heart on product | Heart fills |
| Remove favorite | Tap filled heart | Heart unfills |
| View favorites | Navigate to tab | Favorites listed |
| Empty favorites | No favorites | Empty state + CTA |
| Guest favorites | Add as guest | Saved locally |
| Login sync | Add as guest, login | Synced to server |

---

## 6. Profile

| Scenario | Steps | Expected |
|----------|-------|----------|
| View profile | Navigate to tab | User info shown |
| Change picture | Tap edit icon > select | Picture updated |
| Change password | Cambiar Contrasena > fill | Password changed |
| Privacy policy | Tap "Politica de Privacidad" | Policy displayed |
| Guest view | Profile when logged out | Auth prompt |

---

## 7. Store Locator

| Scenario | Steps | Expected |
|----------|-------|----------|
| View stores | Navigate to locator | Stores listed |
| Store detail | Tap store card | Detail page opens |
| Pickup selection | Choose store in checkout | Store saved to order |

---

## 8. Error Handling

### Network
| Scenario | Steps | Expected |
|----------|-------|----------|
| No internet (home) | Disable network, open app | Error + retry |
| No internet (checkout) | Lose connection | Error shown |
| Recovery | Lose then regain network | App recovers |

### Loading States
| Scenario | Steps | Expected |
|----------|-------|----------|
| Home skeleton | Open app fresh | Skeleton loaders |
| Button loading | Submit form | Loading indicator |

### Empty States
| Scenario | Steps | Expected |
|----------|-------|----------|
| Empty cart | No items | Empty message + CTA |
| Empty favorites | No favorites | Empty message + CTA |
| No search results | Search gibberish | "No results" |

---

## 9. Deep Linking

| Scenario | Command | Expected |
|----------|---------|----------|
| Home | `tifossi://` | Home screen |
| Product | `tifossi://products/{id}` | Product detail |
| Payment success | `tifossi://checkout/payment-result?paymentSuccess=true&...` | Success screen |
| Payment failure | `tifossi://checkout/payment-result?paymentFailure=true&...` | Failure screen |
| Payment pending | `tifossi://checkout/payment-result?paymentPending=true&...` | Pending screen |

---

## 10. Critical User Journeys

### New User Purchase
```
Register > Browse > Add to cart > Checkout > Pay
```

### Guest to Auth Purchase
```
Browse (guest) > Add items > Checkout > Login prompt > Login > Cart merged > Pay
```

### Returning User
```
Login > Browse > Filter > Add > Checkout with saved address > Pay
```

### Pickup Order
```
Add item > Checkout > Pickup > Select City > Select Zone > Select Store > Pay
```

---

## Test Session Template

**Date:** ___________
**Tester:** ___________
**Environment:** iOS Simulator / TestFlight

### Critical Path (Must Pass)
- [ ] Login works
- [ ] Products load
- [ ] Add to cart works
- [ ] Checkout completes
- [ ] Payment success callback
- [ ] Payment failure handling

### Session Notes
```
[Add notes here]
```
