# Production Troubleshooting - Quick Reference Card

**Print this page and keep it handy for on-call emergencies**

---

## Emergency Response (P0 - Critical Outage)

**Symptoms**: Backend completely down, all users affected

**Immediate Actions**:
```bash
# 1. Check service status
curl -I https://tifossi-strapi-backend.onrender.com/_health

# 2. Check Render service status
open https://dashboard.render.com

# 3. If down: Rollback immediately
# Render Dashboard → tifossi-strapi-backend → Events → Rollback
```

**Decision Tree**:
- Service responding? → Check logs (see below)
- Service down? → Check Render status page
- Render operational? → Rollback to last good deployment
- Render down? → Wait for Render recovery (check status.render.com)

---

## Common Issues - Fast Diagnosis

### Issue: "Payments not working"

**Quick Check**:
```bash
# Check if backend is in production mode
render logs --tail | grep "MercadoPago service initialized"
# Expected: "...in PRODUCTION mode"

# Check for credential errors
render logs --tail | grep -i "mercadopago.*error"
```

**Fix**:
- If TEST mode: Verify `NODE_ENV=production` in environment variables
- If credential error: Re-check `MP_ACCESS_TOKEN` and `MP_PUBLIC_KEY`

---

### Issue: "Invalid webhook signature"

**Quick Check**:
```bash
render logs --tail | grep "Invalid.*signature"
```

**Common Causes**:
1. Wrong webhook secret → Check `MP_WEBHOOK_SECRET` matches MercadoPago dashboard
2. Duplicate webhook → Check webhook_logs table for previous processing
3. Malformed request → Verify MercadoPago is sending correct signature headers (x-signature, x-request-id)

**Fix**:
- Verify webhook secret: Render Environment → `MP_WEBHOOK_SECRET`
- Check database: Query webhook_logs table to see if webhook was already processed
- If urgent: Review signature validation logic in mercadopago-service.ts

---

### Issue: "Order stuck in PENDING but payment approved"

**Quick Diagnosis**:
```sql
-- Connect to database via Render Dashboard
SELECT * FROM orders WHERE "orderNumber" = '[ORDER-NUMBER]';
-- Check: status, mpPaymentId, paidAt

SELECT * FROM webhook_logs WHERE "dataId" = '[PAYMENT-ID]';
-- Check: status, metadata
```

**Manual Fix**:
```sql
-- If payment confirmed in MercadoPago dashboard:
UPDATE orders
SET status = 'PAID',
    "paidAt" = NOW(),
    "mpPaymentId" = '[PAYMENT-ID]'
WHERE "orderNumber" = '[ORDER-NUMBER]';
```

---

### Issue: "Database connection errors"

**Quick Check**:
```bash
render logs --tail | grep -i "database\|postgres"
```

**Common Causes**:
1. Connection pool exhausted → Increase `DATABASE_POOL_MAX`
2. Database service down → Check Render Database status
3. Network issue → Check Render status page

**Fix**:
- Restart service: Render Dashboard → Manual Deploy
- Check database status: Render Dashboard → Database Service
- If persistent: Rollback

---

### Issue: "High memory usage / crashes"

**Quick Check**:
- Render Dashboard → Metrics → Memory usage

**Symptoms**:
- Memory >95% = Imminent crash
- Frequent restarts = Out of memory

**Immediate Fix**:
1. Restart service (temporary relief)
2. Upgrade plan: Starter (512MB) → Standard (2GB)
3. Investigate memory leak in logs

---

## Fast Commands Reference

**Health Check**:
```bash
curl https://tifossi-strapi-backend.onrender.com/_health
# Expected: {"status":"ok",...}
```

**Recent Errors**:
```bash
render logs --tail | grep -i "error" | head -20
```

**Payment Activity**:
```bash
render logs --tail | grep -i "payment\|webhook" | head -30
```

**Database Quick Status**:
```sql
-- Most recent orders
SELECT "orderNumber", status, total, "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 10;

-- Webhook processing (last hour)
SELECT status, COUNT(*)
FROM webhook_logs
WHERE "processedAt" > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

---

## Rollback Decision Matrix

| Situation | Rollback? | Timeline |
|-----------|-----------|----------|
| All payments failing | YES | Immediate |
| Database corruption | YES | Immediate |
| Multiple 500 errors | YES | Within 15 min |
| Single webhook failures | NO | Investigate first |
| Slow response times | NO | Monitor, optimize |
| Cosmetic issues | NO | Fix in next release |

**Rollback Steps**:
1. Render Dashboard → tifossi-strapi-backend
2. Events tab → Find last good deployment
3. Click "Rollback" → Confirm
4. Wait 2-3 minutes
5. Verify: `curl https://tifossi-strapi-backend.onrender.com/_health`

---

## Escalation Path

**Level 1** (0-15 min): On-call engineer investigates
- Check logs, metrics, service status
- Attempt quick fixes
- Rollback if critical

**Level 2** (15-30 min): Backup engineer engaged
- If on-call unavailable or issue persists
- Begin deeper investigation

**Level 3** (30+ min): Emergency contact
- Multiple systems affected
- Data integrity concerns
- Requires architectural decisions

---

## Key Metrics - Normal vs Alert

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| CPU Usage | <50% | 50-80% | >80% |
| Memory Usage | <80% | 80-95% | >95% |
| Response Time (p95) | <500ms | 500ms-2s | >2s |
| Error Rate | <1% | 1-5% | >5% |
| Webhook Success | >99% | 95-99% | <95% |
| Payment Success | >95% | 90-95% | <90% |

---

## Contact Information

**Render Dashboard**: https://dashboard.render.com
**MercadoPago Dashboard**: https://www.mercadopago.com.uy/developers
**Service Status**: https://status.render.com

**Emergency Access**:
- Render login: [your-email]
- MercadoPago account: [your-email]
- Database credentials: Stored in Render Dashboard

---

## Customer Communication Templates

**Minor Issue** (P2/P3):
```
We're aware of a temporary issue with [feature].
Our team is working on a fix.
Orders and payments are not affected.
Estimated resolution: [timeframe]
```

**Major Issue** (P1):
```
We're experiencing technical difficulties with [feature].
You may experience [specific impact].
Payments are [affected/not affected].
We're actively working on a fix.
Updates every [timeframe].
```

**Critical Outage** (P0):
```
Tifossi is temporarily unavailable due to technical issues.
We're working urgently to restore service.
No orders or payments are being processed at this time.
Expected restoration: [timeframe or "investigating"].
We apologize for the inconvenience.
```

---

## Post-Incident Checklist

After resolving any P0 or P1 issue:

- [ ] Service fully restored and verified
- [ ] Root cause identified and documented
- [ ] Affected customers notified (if applicable)
- [ ] Data integrity verified (check orders, payments)
- [ ] Post-mortem scheduled (within 24 hours)
- [ ] This runbook updated with new learnings

---

**Last Updated**: 2025-10-21
**Version**: 1.0

*Keep this reference handy. When in doubt, check full guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`*
