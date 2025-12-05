# Tifossi iOS E2E Testing Checklist

**Purpose**: Complete testing before App Store submission
**Last Updated**: 2025-12-05
**Target**: iOS Simulator + TestFlight

---

## Pre-Testing Setup

### Environment Check
- [ ] Backend running: https://tifossi-strapi-backend.onrender.com/api/health
- [ ] Products seeded in Strapi admin panel
- [ ] Store locations seeded
- [ ] MercadoPago test credentials configured
- [ ] Firebase project configured

### Test Accounts Needed
- [ ] Email test user: create during testing
- [ ] Apple ID for Apple Sign-In testing
- [ ] Google account for Google Sign-In testing

### Run Command
```bash
npx expo run:ios
```

---

## 1. AUTHENTICATION FLOWS

### 1.1 Email Registration
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Valid registration | Enter name, valid email, password (8+ chars), confirm password | Account created, redirected to home | [ ] |
| Invalid email format | Enter "notanemail" | Error: "Correo electrónico inválido" | [ ] |
| Password too short | Enter password < 8 chars | Error about password requirements | [ ] |
| Password mismatch | Enter different confirm password | Error: passwords don't match | [ ] |
| Existing email | Register with already-used email | Error: email already exists | [ ] |
| Empty fields | Submit with empty required fields | Field validation errors shown | [ ] |
| Terms checkbox | Try to register without accepting terms | Cannot proceed | [ ] |

### 1.2 Email Login
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Valid login | Enter registered email + correct password | Logged in, redirected to home | [ ] |
| Wrong password | Enter registered email + wrong password | Error: invalid credentials | [ ] |
| Non-existent email | Enter unregistered email | Error: user not found | [ ] |
| Empty fields | Submit with empty fields | Field validation errors | [ ] |
| Password visibility toggle | Tap eye icon | Password shown/hidden | [ ] |

### 1.3 Apple Sign-In (iOS Only)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| First-time Apple Sign-In | Tap "Continuar con Apple" → Authenticate with Face ID/Touch ID | New account created, logged in | [ ] |
| Returning Apple Sign-In | Tap button with previously used Apple ID | Logged in to existing account | [ ] |
| Cancel Apple Sign-In | Start flow then cancel | Returns to login screen, no error | [ ] |
| Apple Sign-In error handling | Force error (e.g., no network) | Shows user-friendly error in Spanish | [ ] |

### 1.4 Google Sign-In
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| First-time Google Sign-In | Tap "Continuar con Google" → Select account | New account created, logged in | [ ] |
| Returning Google Sign-In | Tap with previously used Google account | Logged in to existing account | [ ] |
| Cancel Google Sign-In | Start flow then cancel | Returns to login screen gracefully | [ ] |

### 1.5 Password Recovery
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Forgot password | Tap "Olvidé mi contraseña" → Enter email → Submit | "Instructions sent" message | [ ] |
| Invalid email format | Enter invalid email | Validation error | [ ] |
| Non-existent email | Enter unregistered email | Generic success (security) | [ ] |

### 1.6 Logout
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Logout from profile | Profile → "Cerrar Sesión" → Confirm | Logged out, cart cleared, at home | [ ] |
| Cancel logout | Profile → "Cerrar Sesión" → Cancel | Stays logged in | [ ] |

---

## 2. HOME SCREEN & NAVIGATION

### 2.1 Home Screen Loading
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Initial load | Open app | Skeleton loaders → Content loads | [ ] |
| All sections visible | Scroll down home screen | Highlighted, Featured, Recommended, Trending, New, Store Locator sections visible | [ ] |
| Pull to refresh | Pull down on home screen | Content refreshes | [ ] |

### 2.2 Home Screen Interactions
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Tap product card | Tap any product | Navigate to product detail | [ ] |
| Tap "Ver Más" | Tap "Ver Más" in any section | Navigate to catalog with filter | [ ] |
| Tap category card (Medias) | Tap medias showcase card | Navigate to medias category | [ ] |
| Tap category card (Mochilas) | Tap mochilas showcase card | Navigate to mochilas category | [ ] |
| Horizontal scroll | Swipe product carousel | Smooth horizontal scroll | [ ] |
| Tap store locator | Tap "Encuentra más en nuestros locales" | Navigate to store locations | [ ] |

### 2.3 Tab Navigation
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Home tab | Tap home icon | Shows home screen | [ ] |
| Favorites tab | Tap heart icon | Shows favorites (or auth prompt) | [ ] |
| Cart tab | Tap cart icon | Shows cart screen | [ ] |
| Profile tab | Tap profile icon | Shows profile (or auth prompt) | [ ] |
| Tab badge (cart) | Add item to cart | Badge shows item count | [ ] |

---

## 3. PRODUCT CATALOG & FILTERING

### 3.1 Catalog Display
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View all products | Navigate to "Todo" catalog | All products displayed in grid | [ ] |
| Category filter | Tap category tab (e.g., Mochilas) | Only mochilas products shown | [ ] |
| Model filter | Tap model tab (if available) | Products filtered by model | [ ] |
| Product card display | View any product card | Shows image, title, price, discount badge | [ ] |

### 3.2 Filter Overlay
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open filter | Tap filter icon in catalog | Filter overlay opens | [ ] |
| Price range filter | Adjust price slider | Products filtered by price | [ ] |
| Size filter | Select size(s) | Products with selected sizes shown | [ ] |
| Color filter | Select color swatch(es) | Products with selected colors shown | [ ] |
| Apply multiple filters | Set price + size + color | Combined filter applied | [ ] |
| Clear all filters | Tap "Clear All" | All filters removed | [ ] |
| No results | Apply filters with no matches | "No products found" message | [ ] |

### 3.3 Product Card Actions
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Tap product | Tap product card | Navigate to detail | [ ] |
| Favorite toggle | Tap heart on product card | Heart fills/unfills, favorite saved | [ ] |
| Discount display | View discounted product | Original price crossed out, discount shown | [ ] |

---

## 4. PRODUCT DETAIL SCREEN

### 4.1 Product Information Display
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Load product detail | Navigate to any product | Full product info displayed | [ ] |
| Image gallery | View product images | Main image + thumbnails shown | [ ] |
| Swipe gallery | Swipe main image | Navigate between images | [ ] |
| Tap thumbnail | Tap thumbnail image | Main image changes | [ ] |
| Video playback | Open product with video | Video plays/can be played | [ ] |
| Price display | View price section | Price shown (discounted if applicable) | [ ] |
| Description | Scroll to description | Short + long description visible | [ ] |
| Warranty info | Scroll to warranty | Warranty text shown | [ ] |
| Return policy | Scroll to returns | Return policy shown | [ ] |

### 4.2 Product Variant Selection
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Select color | Tap color swatch | Color selected, images may update | [ ] |
| Select size | Tap size option | Size selected | [ ] |
| Out of stock size | View unavailable size | Size disabled or marked "Agotado" | [ ] |
| Low stock warning | View size with low stock | Stock count shown (e.g., "3 disponibles") | [ ] |
| Change quantity | Tap +/- buttons | Quantity updates (1-99 range) | [ ] |
| Quantity max | Try to exceed 99 | Cannot exceed 99 | [ ] |
| Quantity min | Try to go below 1 | Cannot go below 1 | [ ] |

### 4.3 Add to Cart
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Add to cart (logged in) | Select variants → "Añadir al carrito" | Added, success feedback | [ ] |
| Add to cart (guest) | Select variants → "Añadir al carrito" | Added to guest cart | [ ] |
| Add without size (required) | Try to add without selecting size | Error: select size | [ ] |
| Add without color (required) | Try to add without selecting color | Error: select color | [ ] |
| Add same product twice | Add product, then add again | Quantity increases in cart | [ ] |
| Add different variant | Add product, then add different size/color | Separate cart item | [ ] |

### 4.4 Favorites
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Add to favorites | Tap heart icon | Heart fills, added to favorites | [ ] |
| Remove from favorites | Tap filled heart | Heart unfills, removed | [ ] |
| Favorite persists | Add favorite, close app, reopen | Favorite still saved | [ ] |

### 4.5 Related Products
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Related products shown | Scroll to bottom of detail | Related products section visible | [ ] |
| Tap related product | Tap a related product | Navigate to that product | [ ] |

---

## 5. SHOPPING CART

### 5.1 Cart Display
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View cart with items | Add items, go to cart | Items listed with image, name, price | [ ] |
| Empty cart | View cart with no items | "Tu carrito está vacío" message | [ ] |
| Cart totals | View cart with items | Subtotal, discount, shipping, total shown | [ ] |
| Free shipping threshold | Add items > $100 | Shipping shows $0.00 | [ ] |
| Paid shipping | Add items < $100 | Shipping cost shown | [ ] |

### 5.2 Cart Item Management
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Increase quantity | Tap + on item | Quantity increases, totals update | [ ] |
| Decrease quantity | Tap - on item | Quantity decreases, totals update | [ ] |
| Remove item (quantity 0) | Decrease to 0 | Item removed from cart | [ ] |
| Remove item (swipe/button) | Swipe or tap remove | Item removed, totals update | [ ] |
| Edit item size | Change size selection | Item updated with new size | [ ] |
| Edit item color | Change color selection | Item updated with new color | [ ] |

### 5.3 Cart Persistence
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Cart persists (guest) | Add item, close app, reopen | Cart items still there | [ ] |
| Cart persists (logged in) | Add item, logout, login | Cart synced from server | [ ] |
| Guest cart migration | Add items as guest, then login | Guest cart merged with user cart | [ ] |

### 5.4 Checkout Button
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Checkout (logged in) | Tap "Comprar ahora" | Navigate to checkout flow | [ ] |
| Checkout (guest) | Tap "Comprar ahora" | Auth prompt shown, then checkout | [ ] |

---

## 6. CHECKOUT FLOW

### 6.1 Shipping Address Selection
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View saved addresses | Go to shipping step | List of saved addresses shown | [ ] |
| Select address | Tap address radio button | Address selected | [ ] |
| Default address marked | View addresses | Default shows "Por defecto" badge | [ ] |
| No addresses | User has no addresses | "Add address" prompt | [ ] |
| Add new address | Tap "Agregar dirección" | Navigate to address form | [ ] |

### 6.2 New Address Form
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Fill all required fields | Fill all fields, submit | Address saved, returns to list | [ ] |
| Missing required field | Leave required field empty | Validation error shown | [ ] |
| Phone validation | Enter invalid phone | Error shown | [ ] |
| Country selection | Tap country dropdown | Country list shown, can select | [ ] |
| Cancel add address | Tap cancel/back | Returns without saving | [ ] |

### 6.3 Delivery Method Selection
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Select delivery | Choose "Envío a domicilio" | Delivery selected, address required | [ ] |
| Select pickup | Choose "Retiro en tienda" | Pickup selected, store selection shown | [ ] |

### 6.4 Store Selection (Pickup)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View store list | Select pickup method | Store locations listed | [ ] |
| Stores grouped by city | View store list | Stores grouped (Montevideo, Punta del Este) | [ ] |
| Select store | Tap store | Store selected, shown in summary | [ ] |
| Store details | Tap store info | Store address, hours, etc. shown | [ ] |

### 6.5 Payment Method Selection
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View payment methods | Go to payment step | MercadoPago and disabled options shown | [ ] |
| Select MercadoPago | Tap MercadoPago option | MercadoPago selected | [ ] |
| Disabled methods | Tap PayPal/Crédito/Efectivo | Shows "Próximamente" alert | [ ] |
| Continue to payment | Tap "Continuar con el pago" | Initiates payment flow | [ ] |

### 6.6 MercadoPago Payment
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Payment WebView opens | Continue with MercadoPago | WebView opens to MercadoPago | [ ] |
| Complete test payment | Use MercadoPago test card | Payment succeeds | [ ] |
| Payment success redirect | Complete payment | Deep link returns to app | [ ] |
| Success screen | After successful payment | Shows "¡Pago exitoso!" with order number | [ ] |
| Payment failure | Cancel or fail payment | Shows error screen with retry option | [ ] |
| Payment pending | Payment requires verification | Shows pending screen | [ ] |

### 6.7 Post-Payment
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Cart cleared on success | Complete payment | Cart is emptied | [ ] |
| View orders | Tap "Ver mis pedidos" | Navigate to orders list | [ ] |
| Return to home | Tap "Volver al inicio" | Navigate to home screen | [ ] |
| Retry payment | On failure, tap retry | Returns to payment selection | [ ] |

---

## 7. FAVORITES

### 7.1 Favorites Screen (Logged In)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View favorites | Navigate to favorites tab | Favorited products displayed | [ ] |
| Empty favorites | No favorites added | Empty state with "Ir a la tienda" | [ ] |
| Remove from favorites | Tap heart on favorite item | Item removed from list | [ ] |
| Tap favorite item | Tap product in favorites | Navigate to product detail | [ ] |

### 7.2 Favorites Screen (Guest)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View as guest | Navigate to favorites when logged out | Auth prompt shown | [ ] |
| Local favorites (guest) | Add favorites as guest | Favorites saved locally | [ ] |
| Login to sync | Add favorites as guest, then login | Favorites synced to server | [ ] |

---

## 8. USER PROFILE

### 8.1 Profile Display (Logged In)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View profile | Navigate to profile tab | User name, email, photo shown | [ ] |
| Profile picture shown | User has profile picture | Picture displayed | [ ] |
| Default avatar | User has no picture | Default placeholder shown | [ ] |
| Action buttons visible | View profile | All action buttons visible | [ ] |

### 8.2 Profile Picture
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Change profile picture | Tap edit icon → Select image | New image uploaded and shown | [ ] |
| Cancel image selection | Start selection, then cancel | No change made | [ ] |

### 8.3 Change Password
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open change password | Tap "Cambiar Contraseña" | Change password form opens | [ ] |
| Valid password change | Fill all fields correctly | Password changed, success alert | [ ] |
| Wrong current password | Enter incorrect current password | Error shown | [ ] |
| Password mismatch | New passwords don't match | Validation error | [ ] |
| Password too short | New password < 8 chars | Validation error | [ ] |

### 8.4 Privacy Policy
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open privacy policy | Tap "Política de Privacidad" | Privacy policy displayed | [ ] |
| Scroll privacy policy | Scroll through policy | Full policy readable | [ ] |

### 8.5 Profile (Guest)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View as guest | Navigate to profile when logged out | Auth prompt shown | [ ] |
| Login from profile | Tap login button | Navigate to login screen | [ ] |
| Register from profile | Tap register button | Navigate to registration screen | [ ] |

---

## 9. STORE LOCATOR

### 9.1 Store List
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View store list | Navigate to store locator | All active stores listed | [ ] |
| Stores grouped by city | View list | Stores grouped by city/zone | [ ] |
| Store card info | View store card | Name, address, hours shown | [ ] |
| Store image | View store card | Store image displayed | [ ] |

### 9.2 Store Details
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open store detail | Tap store card | Detail page opens | [ ] |
| Full address shown | View detail | Complete address displayed | [ ] |
| Operating hours | View detail | Hours for each day shown | [ ] |
| Contact info | View detail | Phone/email if available | [ ] |
| Amenities shown | View detail | Parking, accessibility icons | [ ] |

### 9.3 Store Selection (from Checkout)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Select for pickup | Choose store during checkout | Store saved to order | [ ] |
| Change selection | Select different store | Selection updates | [ ] |

---

## 10. ERROR HANDLING & EDGE CASES

### 10.1 Network Errors
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| No internet (home) | Disable network, open app | Error message, retry button | [ ] |
| No internet (checkout) | Lose connection during checkout | Error shown, can retry | [ ] |
| No internet (login) | Try to login without network | Network error message | [ ] |
| Network recovery | Lose then regain network | App recovers, data loads | [ ] |

### 10.2 Loading States
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Home skeleton | Open app fresh | Skeleton loaders while loading | [ ] |
| Product detail skeleton | Open product | Skeleton while loading | [ ] |
| Button loading state | Submit form | Button shows loading indicator | [ ] |

### 10.3 Empty States
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Empty cart | View cart with no items | Empty state with CTA | [ ] |
| Empty favorites | View favorites with none saved | Empty state with CTA | [ ] |
| No search results | Search for gibberish | "No results" message | [ ] |
| No products in category | Filter to empty result | "No products" message | [ ] |

### 10.4 Session & Auth Errors
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Token expired | Wait for token expiry | Auto-refresh or re-login prompt | [ ] |
| Force logout | Trigger 401 error | User logged out gracefully | [ ] |

### 10.5 Input Validation
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| XSS in text fields | Enter `<script>` in inputs | Input sanitized, no execution | [ ] |
| SQL injection attempt | Enter SQL in inputs | Handled safely | [ ] |
| Very long text | Enter extremely long text | Truncated or error shown | [ ] |
| Special characters | Enter emojis, unicode | Handled correctly | [ ] |

---

## 11. DEEP LINKING

### 11.1 App Deep Links
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Home deep link | Open `tifossi://` | Opens home screen | [ ] |
| Product deep link | Open `tifossi://products/{id}` | Opens product detail | [ ] |
| Invalid product ID | Open with non-existent ID | Error handled gracefully | [ ] |

### 11.2 Payment Callbacks
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Success callback | Complete MercadoPago payment | Returns to success screen | [ ] |
| Failure callback | Fail MercadoPago payment | Returns to failure screen | [ ] |
| Pending callback | Payment pending | Returns to pending screen | [ ] |

---

## 12. PERFORMANCE & UX

### 12.1 Performance
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| App launch time | Cold start app | Opens in < 3 seconds | [ ] |
| Scroll performance | Scroll product list rapidly | Smooth 60fps scrolling | [ ] |
| Image loading | View products with images | Images load progressively | [ ] |
| Memory usage | Use app for 10+ minutes | No crashes, reasonable memory | [ ] |

### 12.2 Accessibility
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| VoiceOver | Enable VoiceOver, navigate app | All elements accessible | [ ] |
| Dynamic type | Increase text size in settings | Text scales appropriately | [ ] |
| Color contrast | View app content | Text readable on all backgrounds | [ ] |

### 12.3 Device Compatibility
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| iPhone SE (small) | Run on SE simulator | UI fits, no overflow | [ ] |
| iPhone 15 Pro Max | Run on large simulator | UI scales correctly | [ ] |
| iPad (if supported) | Run on iPad simulator | Layout appropriate | [ ] |
| Notch/Dynamic Island | Run on notched device | Content not obscured | [ ] |

---

## 13. CRITICAL PATH SUMMARY

These are the absolute must-pass tests before submission:

### Authentication
- [ ] Email registration works
- [ ] Email login works
- [ ] Apple Sign-In works (no crash)
- [ ] Logout works

### Shopping
- [ ] Products load and display
- [ ] Can add product to cart
- [ ] Cart persists
- [ ] Can complete checkout flow

### Payment
- [ ] MercadoPago WebView opens
- [ ] Payment callback returns to app
- [ ] Success/failure screens work

### Profile
- [ ] Profile displays user info
- [ ] Can change password
- [ ] Privacy policy accessible

### Store Locator
- [ ] Stores load and display
- [ ] Can select store for pickup

---

## Test Execution Log

| Date | Tester | Environment | Issues Found | Notes |
|------|--------|-------------|--------------|-------|
| | | | | |

---

## Known Issues to Monitor

1. **Google Sign-In**: May have placeholder credentials - verify it works or shows proper error
2. **MercadoPago**: Using test credentials - use test cards from MercadoPago sandbox
3. **Deep linking**: Verify URL schemes are correctly registered

## MercadoPago Test Cards

For sandbox testing:
- **Approved**: 5031 7557 3453 0604 (CVV: 123, Exp: 11/25)
- **Rejected**: 5031 7557 3453 0604 (CVV: 456)
- **Pending**: Use different test card configurations

---

---

## 14. MISSING SCREENS & FEATURES (Added from Audit)

### 14.1 Tifossi Explore Screen (App Exclusive Products)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Load Tifossi Explore | Navigate to Explore tab | App-exclusive products displayed | [ ] |
| Video background | View explore screen | Video plays (or falls back to image) | [ ] |
| Tap "Ver Producto" | Tap button on product | Navigate to product detail | [ ] |
| Personalizable tag | View customizable product | Shows "Personalizable" tag | [ ] |
| Scroll products | Swipe through products | Smooth vertical scrolling | [ ] |

### 14.2 Order History & Tracking
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View order history | Profile → Orders section | List of past orders shown | [ ] |
| Order details | Tap on order | Order details with items shown | [ ] |
| Order status | View order | Current status displayed | [ ] |
| Order timeline | View order | Status progression shown | [ ] |

### 14.3 Email Verification Flow
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Verify email prompt | After registration | Verification email sent | [ ] |
| Enter verification code | Input code from email | Account verified | [ ] |
| Resend code | Tap resend link | New code sent | [ ] |
| Expired code | Enter old code | Error message shown | [ ] |
| Verification success | Complete verification | Success screen displayed | [ ] |

### 14.4 Terms & Conditions Screen
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open terms | Navigate to terms | Terms content displayed | [ ] |
| Scroll through | Scroll entire document | All content readable | [ ] |
| Close terms | Tap close/back | Returns to previous screen | [ ] |

### 14.5 Product Search Overlay
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open search | Tap search icon | Search overlay opens | [ ] |
| Type query | Enter search term | Results appear | [ ] |
| Tap result | Tap product result | Navigate to product detail | [ ] |
| No results | Search gibberish | "No results" message | [ ] |
| Clear search | Clear input | Results cleared | [ ] |
| Close overlay | Tap outside or X | Overlay closes | [ ] |

### 14.6 Shipping Selection Overlay
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open shipping overlay | In checkout | Shipping options displayed | [ ] |
| Select delivery | Tap "Envío a domicilio" | Delivery method selected | [ ] |
| Select pickup | Tap "Retiro en tienda" | Pickup method selected | [ ] |
| Show cost | View with cart < $100 | Shows shipping cost | [ ] |
| Show free shipping | View with cart >= $100 | Shows "Envío gratis" | [ ] |

### 14.7 Checkout Zone/City Selection
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View cities | Select pickup method | City list shown | [ ] |
| Select city | Tap Montevideo/Punta del Este | Zones shown | [ ] |
| Select zone | Tap zone | Stores in zone shown | [ ] |

---

## 15. EDGE CASES & BUSINESS LOGIC (Added from Audit)

### 15.1 Cart & Inventory Edge Cases
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Cart sync failure | Add item, lose network mid-sync | Rollback, show error | [ ] |
| Product out of stock at checkout | Add in-stock item, make unavailable, checkout | Error before payment | [ ] |
| Max unique items (100+) | Add 100+ different products | App doesn't crash | [ ] |
| Cart item product deleted | Add item, delete product from backend | Warning shown in cart | [ ] |
| Duplicate variant handling | Add same product/size/color twice | Quantity increases, not duplicate | [ ] |

### 15.2 Payment Edge Cases
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Payment amount mismatch | Price changes during checkout | Validation error shown | [ ] |
| Invalid external reference | Malformed callback URL | Graceful error handling | [ ] |
| Duplicate payment callback | Deep link fires twice | Order not duplicated | [ ] |
| Payment timeout | Slow/failing backend | Retry option shown | [ ] |
| Missing product at checkout | Product deleted, user checkouts | Validation catches it | [ ] |

### 15.3 Address & Validation Edge Cases
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Phone number formats | Test +598 99 123456, 099123456 | All valid formats accepted | [ ] |
| Spanish characters in name | Enter "José María García" | Saved and displayed correctly | [ ] |
| Max length address | Fill all fields to max | No truncation, works correctly | [ ] |
| Concurrent address updates | Update + add simultaneously | Only one default address | [ ] |

### 15.4 Pricing Edge Cases
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Free shipping boundary $99.99 | Cart total $99.99 | Shipping = $10 | [ ] |
| Free shipping boundary $100.00 | Cart total $100.00 | Shipping = $0 | [ ] |
| Free shipping boundary $100.01 | Cart total $100.01 | Shipping = $0 | [ ] |
| Discount percentage rounding | Various discount amounts | % displays correctly | [ ] |
| Discounted product deleted | Discounted item in cart, delete from backend | Warning shown | [ ] |

### 15.5 Session & Auth Edge Cases
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Token expires during checkout | Start checkout, wait for expiry | Re-login prompt, cart preserved | [ ] |
| Double logout tap | Tap logout rapidly twice | Single logout, no crash | [ ] |
| Network loss during login | Try login without network | Network error message | [ ] |

### 15.6 Guest to User Migration
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Guest cart + user cart merge | Guest: 2 items, User: 3 items, login | 5 items (merged, no duplicates) | [ ] |
| Same product different quantities | Guest: qty 2, Server: qty 3, same product | Merged qty = 5 | [ ] |
| Favorites migration | Add favorites as guest, login | Favorites synced to server | [ ] |

---

## 16. iOS PLATFORM COMPLIANCE (CRITICAL - Added from Audit)

### 16.1 iOS Permissions
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Photo Library permission | Tap change profile picture | iOS permission dialog appears | [ ] |
| Allow photo access | Grant permission | Photo picker opens | [ ] |
| Deny photo access | Deny permission | Graceful error message in Spanish | [ ] |
| Permission already denied | Try again after denial | Settings redirect or clear error | [ ] |

### 16.2 Apple Sign-In (iOS-Specific)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Apple Sign-In with Face ID | Tap button, authenticate | Successfully logged in | [ ] |
| Apple Sign-In with Touch ID | Tap button, authenticate | Successfully logged in | [ ] |
| Apple Sign-In with Passcode | Tap button, use passcode | Successfully logged in | [ ] |
| Hide email option | Choose to hide email | Private relay email stored | [ ] |
| Cancel Face ID | Start then cancel | Returns to login, no crash | [ ] |
| Associated domains work | Complete Apple Sign-In | No domain validation errors | [ ] |

### 16.3 Deep Linking (iOS)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Payment success deep link | Complete MercadoPago payment | App opens to success screen | [ ] |
| Payment failure deep link | Cancel MercadoPago payment | App opens to failure screen | [ ] |
| Email verification deep link | Tap link in email | App opens verification screen | [ ] |
| Password reset deep link | Tap link in email | App opens reset screen | [ ] |
| Malformed deep link | Open with invalid params | Graceful error, no crash | [ ] |
| Deep link cold start | App killed, tap deep link | App opens to correct screen | [ ] |
| Deep link from background | App in background, tap link | Returns to correct screen | [ ] |

### 16.4 Secure Storage
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Token stored in Keychain | Login, check storage | Token NOT in AsyncStorage | [ ] |
| Token cleared on logout | Logout | Token removed from Keychain | [ ] |
| Session recovery | Force kill during login, reopen | Session recovers or clean state | [ ] |
| Token not in logs | Check console output | No tokens visible | [ ] |

### 16.5 Network Security
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| All API calls HTTPS | Monitor network | No HTTP calls in production | [ ] |
| Backend connection | App connects to Strapi | Successful HTTPS connection | [ ] |
| SSL certificate valid | Check certificate | No certificate warnings | [ ] |

### 16.6 Device Compatibility
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| iPhone SE (small screen) | Run on SE simulator | UI fits, no overflow | [ ] |
| iPhone 15 Pro Max (large) | Run on large simulator | UI scales correctly | [ ] |
| Dynamic Island | Run on iPhone 14 Pro+ | Content not obscured | [ ] |
| Notch handling | Run on iPhone X-13 | Safe area respected | [ ] |
| iOS 12 (minimum) | Test on iOS 12 simulator | App runs without issues | [ ] |
| iOS 18 (latest) | Test on latest iOS | App runs without issues | [ ] |

### 16.7 Google Sign-In (iOS)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Google Sign-In works | Tap Google button | Google picker appears | [ ] |
| Select Google account | Choose account | Successfully logged in | [ ] |
| Cancel Google Sign-In | Cancel from picker | Returns to login gracefully | [ ] |
| Multiple Google accounts | Device has multiple accounts | Can select any account | [ ] |

---

## 17. CRITICAL iOS BLOCKERS TO VERIFY

Before App Store submission, verify these are fixed:

| Blocker | Status | Notes |
|---------|--------|-------|
| NSPhotoLibraryUsageDescription in Info.plist | [ ] | Required for profile picture |
| NSUserTrackingUsageDescription in Info.plist | [ ] | Required if analytics enabled |
| Privacy Manifest populated | [ ] | Required since iOS 17 |
| Bundle ID consistent (app.tiffosi.store) | [ ] | Check app.json, eas.json, entitlements |
| Production certificates configured | [ ] | Cannot submit without |
| Real Google Sign-In credentials | [ ] | Test credentials won't work |
| Apple Sign-In entitlements valid | [ ] | Check provisioning profile |

---

## 18. OVERLAYS & MODALS (Added from Audit)

### 18.1 Product Filter Overlay
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open filter overlay | Tap filter icon in catalog | Overlay animates open | [ ] |
| Select size filter | Tap size option | Size filter applied | [ ] |
| Select color filter | Tap color swatch | Color filter applied | [ ] |
| Adjust price range | Move slider | Price filter applied | [ ] |
| Apply multiple filters | Set size + color + price | All filters combined | [ ] |
| Clear all filters | Tap "Limpiar todo" | All filters removed | [ ] |
| Close overlay | Tap backdrop or X | Overlay closes | [ ] |

### 18.2 Product Edit Overlay (Cart)
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open edit overlay | Tap edit on cart item | Edit overlay opens | [ ] |
| Change size | Select different size | Size updated in cart | [ ] |
| Change color | Select different color | Color updated in cart | [ ] |
| Cancel edit | Tap cancel or outside | No changes made | [ ] |
| Confirm edit | Tap confirm | Changes saved | [ ] |

### 18.3 Quantity Overlay
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Open quantity picker | Tap quantity in cart | Quantity overlay opens | [ ] |
| Increment to max | Increase to 99 | Cannot exceed 99 | [ ] |
| Decrement to min | Decrease to 1 | Cannot go below 1 | [ ] |
| Submit quantity | Tap confirm | Quantity updated | [ ] |

### 18.4 Delete Confirmation
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Delete item prompt | Swipe to delete | Confirmation appears | [ ] |
| Confirm delete | Tap confirm | Item removed | [ ] |
| Cancel delete | Tap cancel | Item stays in cart | [ ] |

---

## 19. isACTIVE FILTERING (CRITICAL - Delivery Plan Mandatory Feature)

### 19.1 Product isActive Filtering
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Hidden product in catalog | Admin sets product isActive: false | Product disappears from catalog | [ ] |
| Hidden product in search | Search for hidden product | Product not in results | [ ] |
| Hidden product in related | View product with hidden related | Hidden product not shown | [ ] |
| All products hidden | All products isActive: false | "No hay productos" message | [ ] |

### 19.2 Color/Size isActive Filtering
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Hidden color variant | Color isActive: false | Color not in selector | [ ] |
| Hidden size variant | Size isActive: false | Size not in selector | [ ] |
| All sizes hidden | All sizes isActive: false | "No hay tallas disponibles" | [ ] |
| All colors hidden | All colors isActive: false | "Color no disponible" | [ ] |

### 19.3 Store isActive Filtering
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Hidden store in pickup | Store isActive: false | Store not in pickup list | [ ] |
| All stores hidden | All stores isActive: false | "No hay locales disponibles" | [ ] |

---

## 20. COLOR-SPECIFIC FEATURES (Delivery Plan: Product-Color Schema)

### 20.1 Color Image Switching
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Color changes main image | Select different color | Main image updates to color's mainImage | [ ] |
| Color changes gallery | Select different color | Gallery shows color's additionalImages | [ ] |
| Color without images | Select color with no images | Falls back to frontImage | [ ] |
| Thumbnail navigation | Tap color thumbnail | Main image changes | [ ] |

### 20.2 Color Stock Display
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Color stock count | Select color | Shows "X disponibles en [color]" | [ ] |
| Color out of stock | Color with quantity: 0 | Shows "Agotado" or disabled | [ ] |
| Low color stock | Color with quantity < 3 | Shows low stock warning | [ ] |

---

## 21. SIZE STOCK FEATURES (Delivery Plan: Size Stock Mapping)

### 21.1 Size Stock Display
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Size stock count | View size options | Each size shows stock count | [ ] |
| Size out of stock | Size with stock: 0 | Size disabled or "Agotado" | [ ] |
| Low size stock | Size with stock < 3 | Shows "Solo quedan X" | [ ] |
| Quantity limited by stock | Try to add qty > stock | Limited to available stock | [ ] |

### 21.2 Color + Size Stock Interaction
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Stock per color+size | Select color, then size | Stock reflects combo availability | [ ] |
| Change color updates sizes | Select different color | Size availability updates | [ ] |

---

## 22. STORE SELECTION PERSISTENCE (Delivery Plan: Critical Fix)

### 22.1 Pickup Order Store Data
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Store saved to order | Select store, complete checkout | Order includes storeLocation | [ ] |
| Store in order details | View completed pickup order | Store name/address shown | [ ] |
| Store in order history | View order history | Pickup orders show store | [ ] |

---

## 23. COMPLETE USER JOURNEYS (End-to-End Flows)

### 23.1 New User First Purchase Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Full registration flow | Register → Verify email → Browse → Add to cart → Checkout → Pay | Complete purchase successful | [ ] |

### 23.2 Guest to Authenticated Purchase Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Full guest flow | Browse as guest → Add items → Proceed to checkout → Login prompt → Login → Cart merged → Complete payment | All items in cart, payment successful | [ ] |

### 23.3 Returning User Purchase Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Full returning user flow | Login → Browse → Filter → Add to cart → Add to favorites → Checkout with saved address → Pay | Purchase complete, favorite saved | [ ] |

### 23.4 Pickup Order Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Full pickup flow | Add item → Checkout → Select Pickup → Select City → Select Zone → Select Store → Pay | Order shows selected store | [ ] |

### 23.5 Delivery Order Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Full delivery flow | Add item → Checkout → Select Delivery → Add new address → Confirm → Pay | Order shows delivery address | [ ] |

### 23.6 Profile Management Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Profile update flow | Login → Profile → Update picture → Change password → Logout → Login with new password | All changes persisted | [ ] |

### 23.7 Order History Journey
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| View orders flow | Complete purchase → Navigate to orders → View order details → See status | Order visible with correct status | [ ] |

---

## 24. SEARCH FUNCTIONALITY (Delivery Plan: Core Deliverable)

### 24.1 Product Search
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Search by name | Search "mochila" | Only backpacks shown | [ ] |
| Search relevance | Search partial word | Relevant results appear | [ ] |
| Real-time search | Type query | Results update as typing | [ ] |
| Search + filter combo | Search then apply filter | Both applied correctly | [ ] |
| Clear search | Clear search input | All products shown again | [ ] |

---

## 25. STRAPI BACKEND INTEGRATION

### 25.1 API Endpoints
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Products endpoint | Fetch /api/products | Returns products with colors, sizes | [ ] |
| Store locations endpoint | Fetch /api/store-locations | Returns active stores only | [ ] |
| Orders endpoint | POST /api/orders | Creates order with items | [ ] |
| User profile endpoint | GET /api/users/me | Returns user data | [ ] |

### 25.2 Data Consistency
| Test Case | Steps | Expected Result | Pass |
|-----------|-------|-----------------|------|
| Product data complete | View any product | All fields populated | [ ] |
| Store data complete | View any store | Address, hours, amenities shown | [ ] |
| Order data complete | View any order | Items, total, status correct | [ ] |

---

## 26. CRITICAL BUGS IDENTIFIED IN AUDIT

These issues were found during the audit and MUST be verified:

| Issue | Location | Status | Notes |
|-------|----------|--------|-------|
| Store selection NOT persisted to order | store-selection component | BROKEN | Test comment confirms not implemented |
| Email verification flow | auth screens | NOT TESTED | May not be implemented |
| Order history/tracking | profile section | NOT TESTED | Feature may be incomplete |
| Profile management | profile screens | ZERO TESTS | Needs verification |
| isActive filtering | All product/store lists | ZERO TESTS | Critical feature untested |

---

**Sign-off**

- [ ] All critical path tests pass
- [ ] All iOS platform compliance tests pass
- [ ] All edge case tests pass
- [ ] No blocking bugs found
- [ ] Ready for TestFlight
- [ ] Ready for App Store submission

Tested by: _________________ Date: _____________
