# Troubleshooting

## iOS Build Issues

Full clean and rebuild:
```bash
cd ios && pod deintegrate && pod cache clean --all && rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData && cd .. && npm install && cd ios && pod install && cd ..
```

## Expo Cache
```bash
npx expo start --clear
```

## TypeScript Issues
```bash
npm run typecheck
```

## Linting Issues
```bash
npm run fix-imports  # Auto-fix unused imports
npm run lint         # Check all files
```

## MercadoPago Webhook Debugging

All webhook operations are logged with structured prefixes for easy filtering in Render logs.

### Log Prefixes

- `[MP-WEBHOOK]` - Webhook reception, validation, deduplication, queueing
- `[MP-PAYMENT]` - Payment processing, order lookup, status updates

### Filter Commands (Render)

```bash
# All webhook activity
render logs tifossi-strapi-backend | grep "\[MP-WEBHOOK\]"

# Payment processing only
render logs tifossi-strapi-backend | grep "\[MP-PAYMENT\]"

# Track specific payment
render logs tifossi-strapi-backend | grep "dataId: 12345678"

# Find errors only
render logs tifossi-strapi-backend | grep "\[MP-.*\].*FAILED\|ERROR"
```

### Common Issues

**Webhook marked as duplicate**
- Log: `[MP-WEBHOOK] Duplicate webhook - skipping`
- Normal behavior - same webhook received multiple times

**Order not found**
- Log: `[MP-PAYMENT] ORDER NOT FOUND - payment orphaned`
- Check MercadoPago dashboard for payment details

**Signature verification failed**
- Log: `[MP-WEBHOOK] Signature verification FAILED`
- Verify `MP_WEBHOOK_SECRET` matches MercadoPago dashboard

**Status unchanged**
- Log: `[MP-PAYMENT] Status unchanged - skipping transition`
- Normal - order already in correct state
