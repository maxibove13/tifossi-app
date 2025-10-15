# GitHub Secrets Setup Guide

## Overview

This guide provides a complete checklist of all GitHub Secrets required for the Tifossi app deployment pipeline. The GitHub Actions workflow will automatically use these secrets during the build process.

## 📋 Required GitHub Secrets Checklist

### 🔴 Critical Secrets (Build will fail without these)

These secrets MUST be set or the app will not build/function:

- [ ] **`EXPO_PUBLIC_API_BASE_URL`**
  - Example: `https://tifossi-strapi-backend.onrender.com`
  - Description: Your Render backend deployment URL
  - Used for: All API calls from the mobile app

- [ ] **`EXPO_PUBLIC_FIREBASE_API_KEY`**
  - Example: `AIzaSyD...`
  - Get from: Firebase Console → Project Settings → General → Web App
  - Used for: Firebase authentication

- [ ] **`EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`**
  - Example: `your-project.firebaseapp.com`
  - Get from: Firebase Console → Project Settings → General → Web App
  - Used for: Firebase authentication

- [ ] **`EXPO_PUBLIC_FIREBASE_PROJECT_ID`**
  - Example: `tifossi-app`
  - Get from: Firebase Console → Project Settings → General
  - Used for: Firebase services

- [ ] **`EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`**
  - Example: `your-project.appspot.com`
  - Get from: Firebase Console → Storage
  - Used for: Firebase storage (if using)

- [ ] **`EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`**
  - Example: `123456789012`
  - Get from: Firebase Console → Project Settings → Cloud Messaging
  - Used for: Push notifications (if using)

- [ ] **`EXPO_PUBLIC_FIREBASE_APP_ID`**
  - Example: `1:123456789012:web:abcdef`
  - Get from: Firebase Console → Project Settings → General → Web App
  - Used for: Firebase app identification

- [ ] **`EXPO_TOKEN`**
  - Get from: https://expo.dev/accounts/[your-username]/settings/access-tokens
  - Used for: EAS Build authentication
  - Required for: CI/CD pipeline

### 🟡 Important Secrets (Required for specific features)

- [ ] **`EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY`**
  - Example: `TEST-xxxxx` or `APP_USR-xxxxx`
  - Get from: MercadoPago Dashboard → Credentials
  - Used for: Payment processing
  - Note: Use TEST key for staging, APP_USR key for production

- [ ] **`GOOGLE_OAUTH_IOS_CLIENT_ID`**
  - Example: `123456789012-xxx.apps.googleusercontent.com`
  - Get from: Google Cloud Console → APIs & Services → Credentials
  - Used for: Google Sign-In on iOS

- [ ] **`GOOGLE_OAUTH_ANDROID_CLIENT_ID`**
  - Example: `123456789012-yyy.apps.googleusercontent.com`
  - Get from: Google Cloud Console → APIs & Services → Credentials
  - Used for: Google Sign-In on Android

- [ ] **`GOOGLE_OAUTH_WEB_CLIENT_ID`**
  - Example: `123456789012-zzz.apps.googleusercontent.com`
  - Get from: Google Cloud Console → APIs & Services → Credentials
  - Used for: Google OAuth web flow

### 🟢 Optional Secrets (Enhance functionality)

- [ ] **`EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`**
  - Example: `G-XXXXXXXXXX`
  - Get from: Firebase Console → Analytics
  - Used for: Google Analytics

- [ ] **`EXPO_PUBLIC_GOOGLE_ANALYTICS_ID`**
  - Example: `G-XXXXXXXXXX`
  - Get from: Google Analytics
  - Used for: Analytics tracking

- [ ] **`EXPO_PUBLIC_SENTRY_DSN`**
  - Example: `https://xxx@xxx.ingest.sentry.io/xxx`
  - Get from: Sentry Dashboard → Settings → Client Keys
  - Used for: Error tracking and monitoring

- [ ] **`EXPO_PUBLIC_APP_NAME`**
  - Example: `Tifossi`
  - Used for: App display name

- [ ] **`EXPO_PUBLIC_APP_SLUG`**
  - Example: `tifossi`
  - Used for: App identifier

- [ ] **`EXPO_PUBLIC_ENABLE_ANALYTICS`**
  - Example: `true` or `false`
  - Used for: Feature flag for analytics

- [ ] **`EXPO_PUBLIC_ENABLE_CRASH_REPORTING`**
  - Example: `true` or `false`
  - Used for: Feature flag for crash reporting

## 🚀 How to Add Secrets to GitHub

1. **Navigate to your repository on GitHub**
2. **Go to Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add each secret**:
   - **Name**: Use the exact name from the checklist (e.g., `EXPO_PUBLIC_API_BASE_URL`)
   - **Value**: Enter the corresponding value
5. **Click "Add secret"**

## 📝 Environment-Specific Values

You may want different values for different environments:

### Production

```
EXPO_PUBLIC_API_BASE_URL=https://tifossi-strapi-backend.onrender.com
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-production-key
```

### Staging

```
EXPO_PUBLIC_API_BASE_URL=https://staging-tifossi-strapi.onrender.com
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-staging-key
```

## 🔄 Workflow Behavior

The GitHub Actions workflow (`eas-build.yml`) will:

1. **Validate** that critical secrets are present
2. **Create** appropriate `.env` file based on build profile
3. **Inject** all secrets into the environment file
4. **Build** the app with these environment variables
5. **Fail fast** if critical configuration is missing

## 🧪 Testing Your Configuration

After setting up secrets:

1. **Trigger a manual build**:
   - Go to Actions → EAS Build → Run workflow
   - Select branch and build profile
   - Monitor the logs

2. **Check validation step**:
   - The workflow will validate critical secrets
   - If any are missing, you'll see: `❌ Missing critical secrets: ...`

3. **Verify environment creation**:
   - The workflow logs will show: `✅ Environment file created successfully`
   - A redacted preview will be displayed

## ⚠️ Important Notes

1. **Never commit secrets** to your repository
2. **Use different values** for production vs staging/development
3. **Rotate secrets regularly** for security
4. **Keep a secure backup** of your production secrets
5. **Limit access** to production secrets to authorized team members

## 🔍 Troubleshooting

### Build fails with "Missing critical secrets"

- Ensure all required secrets from the Critical section are set
- Check for typos in secret names
- Verify secrets are added to the correct repository

### App can't connect to backend

- Verify `EXPO_PUBLIC_API_BASE_URL` is correct
- Check if backend is deployed and running
- Ensure URL includes protocol (`https://`)

### Authentication not working

- Verify all Firebase secrets are set correctly
- Check Firebase project configuration
- Ensure bundle IDs match Firebase app configuration

### Payments not working

- Verify `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY` is set
- Use TEST key for testing, APP_USR key for production
- Check MercadoPago account configuration

## 📚 Related Documentation

- [Environment Variables Setup](./ENVIRONMENT_VARIABLES_SETUP.md)
- [Render Deployment Setup](./RENDER_DEPLOYMENT_SETUP.md)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## 🆘 Support

If you need help with secrets setup:

1. Check the workflow logs for specific error messages
2. Verify all required secrets are set
3. Contact your DevOps team for production credentials
4. Review Firebase and MercadoPago documentation for obtaining keys
