# Privacy Policy Setup Guide

## Overview

A production-ready privacy policy has been implemented for the Tifossi app to comply with Apple App Store requirements. This document explains the setup and what you need to do before App Store submission.

## Implementation Details

### 1. Privacy Policy File

**Location:** `backend/strapi/public/privacy.html`

- **URL:** `https://tifossi-strapi-backend.onrender.com/privacy.html`
- **Language:** Spanish (Spanish is the primary language of the app)
- **Format:** Standalone HTML file with embedded CSS (no external dependencies)
- **Accessibility:** Publicly accessible without authentication

### 2. App Configuration

**File:** `app.json`

The privacy policy URL is configured in `app.json` under `extra.privacyPolicyUrl`:

```json
"extra": {
  "privacyPolicyUrl": "https://tifossi-strapi-backend.onrender.com/privacy.html"
}
```

### 3. In-App Access

The privacy policy is accessible from the Profile screen:

- **Path:** Profile tab → "Política de Privacidad"
- **Icon:** Shield icon (Feather)
- **Behavior:** Opens privacy policy in device browser
- **Availability:** Visible only when user is logged in

## Required Actions Before Deployment

### Step 1: Update Business Information

You need to replace the following placeholders in the privacy policy HTML file:

**File to edit:** `backend/strapi/public/privacy.html`

**Search for and replace:**

1. **Line ~613:** `TODO: Razón Social Completa`
   - Replace with your full legal business name
   - Example: "Tifossi Sport S.A." or "Juan Pérez - Tifossi Sport"

2. **Line ~614:** `TODO: Dirección Completa`
   - Replace with your complete business address
   - Example: "Av. 18 de Julio 1234, Montevideo 11200, Uruguay"

### Step 2: Update Environment Variables

**File to edit:** `render.yaml`

Update the following environment variables in the Render.com dashboard or in the YAML file:

```yaml
BUSINESS_LEGAL_NAME: "TODO: Full legal business name (e.g., Tifossi Sport S.A.)"
BUSINESS_ADDRESS: "TODO: Complete business address (Street, City, Country)"
```

**Replace with:**
- Your actual registered business name
- Your actual physical business address

### Step 3: Verify Email Addresses

The privacy policy currently uses `info@tifossi.com` for all contact purposes. Verify this is correct:

- **General contact:** info@tifossi.com
- **Privacy inquiries:** info@tifossi.com

If you want to use a different email for privacy inquiries, update:
- `PRIVACY_CONTACT_EMAIL` in `render.yaml`
- Email addresses in `privacy.html` (search for "info@tifossi.com")

### Step 4: App Store Connect Configuration

When submitting to the App Store, you'll need to provide the privacy policy URL:

1. Go to App Store Connect
2. Select your app
3. Navigate to **App Privacy** section
4. Provide the privacy policy URL:
   ```
   https://tifossi-strapi-backend.onrender.com/privacy.html
   ```

## What the Privacy Policy Covers

The privacy policy discloses all data collection practices:

### Personal Data Collected
- ✅ Account information (name, email, phone, password)
- ✅ Apple Sign-In data (Apple ID, private relay email)
- ✅ Google Sign-In data (Google account info)
- ✅ Shipping addresses (street, city, postal code)
- ✅ Order history and purchases
- ✅ Payment information (via MercadoPago)
- ✅ Device information (model, OS version)
- ✅ Usage analytics (via Firebase)

### Third-Party Services Disclosed
- ✅ Firebase (Authentication & Analytics)
- ✅ Apple Sign-In
- ✅ Google Sign-In
- ✅ MercadoPago (Payment processing)
- ✅ Cloudinary (Image storage)
- ✅ Strapi CMS (Backend)
- ✅ Render.com (Hosting)

### Legal Sections Included
- ✅ Data collection and usage
- ✅ Third-party data sharing
- ✅ Security measures
- ✅ Data retention periods
- ✅ User rights (access, deletion, correction)
- ✅ International data transfers
- ✅ Children's privacy (under 13)
- ✅ Cookies and tracking technologies
- ✅ Contact information

## Apple App Store Compliance

### Requirements Met

1. ✅ **Privacy Policy URL** - Publicly hosted and accessible
2. ✅ **Privacy Manifest** - Basic structure added to `app.json`
3. ✅ **Apple Sign-In Disclosure** - Detailed in Section 1.2 of privacy policy
4. ✅ **Third-Party SDK Disclosure** - All services documented
5. ✅ **In-App Access** - Available from Profile screen
6. ✅ **Data Collection Transparency** - All collection types disclosed
7. ✅ **User Rights** - Access, deletion, and correction explained
8. ✅ **Contact Information** - Business contact details provided

### App Store Connect Privacy Questions

When filling out the App Privacy section in App Store Connect, reference the privacy policy for accurate answers:

**Data Types Collected:**
- Contact Info: ✅ Name, Email, Phone
- Location: ✅ Shipping Address (not GPS tracking)
- User Content: ✅ Profile Photo
- Identifiers: ✅ User ID
- Purchases: ✅ Purchase History
- Usage Data: ✅ Product Interactions
- Diagnostics: ✅ Crash Data, Performance Data

**Data Linked to User:**
- All data except anonymous analytics

**Data Used for Tracking:**
- None (no advertising or cross-app tracking)

## Testing the Privacy Policy

### Local Testing (Development)

1. Start the Strapi backend:
   ```bash
   cd backend/strapi
   npm run develop
   ```

2. Open in browser:
   ```
   http://localhost:1337/privacy.html
   ```

3. Verify all sections render correctly
4. Check that placeholder text shows where you need to update

### Production Testing (After Deployment)

1. Deploy Strapi to Render.com
2. Open in browser:
   ```
   https://tifossi-strapi-backend.onrender.com/privacy.html
   ```

3. Verify:
   - ✅ Page loads correctly
   - ✅ All business information is accurate (no TODO placeholders)
   - ✅ Links to third-party privacy policies work
   - ✅ Page is mobile-responsive
   - ✅ Page is accessible without authentication

### In-App Testing

1. Build the app with the privacy policy URL configured
2. Log in to a test account
3. Navigate to Profile tab
4. Tap "Política de Privacidad"
5. Verify browser opens with privacy policy

## Updating the Privacy Policy

If you need to update the privacy policy in the future:

1. Edit `backend/strapi/public/privacy.html`
2. Update the "Última actualización" (Last Updated) date at the top
3. Deploy the changes to Render.com
4. Consider notifying users via email or in-app notification for major changes

## Alternative Hosting Options

If you prefer not to host on Render alongside Strapi, you can:

1. **GitHub Pages** - Free static hosting
2. **Cloudflare Pages** - Free with global CDN
3. **Netlify** - Free tier available
4. **Your own website** - If you have one

To use alternative hosting:
1. Host the `privacy.html` file on your chosen platform
2. Update `app.json` → `extra.privacyPolicyUrl` with the new URL
3. Update the URL in `app/(tabs)/profile.tsx` fallback URL
4. Rebuild the app

## Support and Questions

If you have questions about the privacy policy or need assistance:

- Review Apple's privacy guidelines: https://developer.apple.com/app-store/user-privacy-and-data-use/
- Consult with a legal professional for jurisdiction-specific requirements
- Contact us if you need technical assistance with implementation

## Checklist Before App Store Submission

- [ ] Replace "TODO" placeholders in `privacy.html` with actual business information
- [ ] Update `BUSINESS_LEGAL_NAME` and `BUSINESS_ADDRESS` in Render environment variables
- [ ] Verify privacy policy URL is accessible: https://tifossi-strapi-backend.onrender.com/privacy.html
- [ ] Test opening privacy policy from within the app
- [ ] Review privacy policy content for accuracy
- [ ] Add privacy policy URL to App Store Connect
- [ ] Fill out App Privacy questionnaire in App Store Connect based on privacy policy
- [ ] Ensure privacy policy is up-to-date before each app update

---

**Last Updated:** October 18, 2025
**Privacy Policy Version:** 1.0.0
