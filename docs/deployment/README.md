# Tifossi Production Deployment Documentation

This directory contains comprehensive documentation for deploying Tifossi to production.

---

## Documentation Overview

### 1. [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) (Main Guide)
**43 KB | 1,649 lines | Complete Reference**

Comprehensive step-by-step guide covering:
- Pre-deployment checklist (code fixes, credentials, compliance)
- MercadoPago production activation process
- Render Dashboard configuration (all environment variables)
- Webhook registration (MCP tool + manual methods)
- Firebase production setup
- Deployment procedures (automated + manual)
- Post-deployment verification tests
- Monitoring setup and KPIs
- Rollback procedures
- Troubleshooting guide
- Production support runbook

**Use this when**: Deploying for the first time or need detailed instructions.

---

### 2. [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) (Quick Checklist)
**3.3 KB | 124 lines | Pre-Flight Check**

Quick checklist format covering:
- Critical code fixes (BLOCKING items)
- Required credentials
- Deployment steps
- Verification steps
- Emergency contacts

**Use this when**: Ready to deploy and need to ensure nothing is missed.

---

### 3. [TROUBLESHOOTING_QUICK_REFERENCE.md](./TROUBLESHOOTING_QUICK_REFERENCE.md) (Emergency Reference)
**6.5 KB | 273 lines | On-Call Guide**

Quick diagnostic and resolution guide:
- Emergency response for critical outages
- Common issues with fast diagnosis steps
- Fast command reference
- Rollback decision matrix
- Escalation procedures
- Key metrics (normal vs alert thresholds)
- Customer communication templates

**Use this when**: Production issue occurs and need immediate guidance.
**Tip**: Print this page for on-call rotation.

---

## Quick Start

### For First-Time Production Deployment:

1. **Start here**: Read [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) Section 1-6
2. **Fix code**: Complete all CRITICAL fixes in Section 6
3. **Get credentials**: Follow Sections 2, 3, 5 to obtain all credentials
4. **Deploy**: Follow Section 7 deployment procedure
5. **Verify**: Complete Section 8 verification checklist
6. **Monitor**: Set up Section 9 monitoring

### For Routine Deployments:

1. Use [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Ensure all items checked before deploying
3. Run verification tests after deployment

### For Emergency Troubleshooting:

1. Open [TROUBLESHOOTING_QUICK_REFERENCE.md](./TROUBLESHOOTING_QUICK_REFERENCE.md)
2. Identify issue severity (P0-P3)
3. Follow fast diagnosis steps
4. Execute rollback if needed
5. Escalate if unresolved after 15 minutes

---

## Critical Information

**Production URL**: https://tifossi-strapi-backend.onrender.com
**Admin Panel**: https://tifossi-strapi-backend.onrender.com/admin
**MercadoPago Application ID**: 4166909433694983
**Health Check**: https://tifossi-strapi-backend.onrender.com/_health

**Expected Costs**:
- Infrastructure: $35/month (Render)
- Payments: 5.23% per transaction (MercadoPago)
- Storage: $0 initially (Cloudinary free tier)
- Auth: $0 (Firebase free tier)

---

## Related Documentation

**In This Project**:
- [Firebase Setup Guide](../guides/FIREBASE_SETUP_GUIDE.md) - Detailed Firebase configuration
- [Tifossi Delivery Plan](../project/TIFOSSI_DELIVERY_PLAN.md) - Current project status
- [Operational Costs](../business/COSTOS_OPERATIVOS_URUGUAY_2025.md) - Infrastructure costs breakdown

**Backend Configuration**:
- `/backend/strapi/render.yaml` - Infrastructure as code
- `/backend/strapi/.env.example` - Environment variable reference

**External Resources**:
- [MercadoPago Developer Docs](https://www.mercadopago.com/developers/en/docs)
- [Render Documentation](https://render.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## Document Maintenance

**Last Updated**: 2025-10-21
**Created By**: AI Agent 11 (Production Deployment Checklist Generator)
**Review Cycle**: Update after each production deployment or incident

**Change Log**:
- 2025-10-21: Initial comprehensive deployment documentation created
- Includes: Main guide, quick checklist, troubleshooting reference

---

## Support Contacts

**For Production Issues**:
1. Check [TROUBLESHOOTING_QUICK_REFERENCE.md](./TROUBLESHOOTING_QUICK_REFERENCE.md)
2. Review recent logs: `render logs tifossi-strapi-backend --tail`
3. Check service status: https://status.render.com
4. Escalate if unresolved after 15 minutes (P0) or 1 hour (P1)

**For Deployment Questions**:
- Refer to [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- Check code comments in `/backend/strapi` for implementation details
- Review commit history for recent changes

---

## Document Status

| Document | Status | Completeness | Last Verified |
|----------|--------|--------------|---------------|
| PRODUCTION_DEPLOYMENT_GUIDE.md | ✅ Complete | 100% | 2025-10-21 |
| PRODUCTION_CHECKLIST.md | ✅ Complete | 100% | 2025-10-21 |
| TROUBLESHOOTING_QUICK_REFERENCE.md | ✅ Complete | 100% | 2025-10-21 |

**All documents are production-ready and can be used immediately for deployment.**

---

## Known Issues & Blockers

**Critical Blockers** (must fix before App Store submission):
1. iOS Entitlements file empty (will crash on Apple Sign-In)
2. Privacy Manifest data types not declared (automatic rejection)
3. Missing ATT permission for analytics (legal violation)
4. Backend payment service crashes without credentials

**See**: [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) Section 6 for fixes.

---

**Ready to deploy?** Start with [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) ✅
