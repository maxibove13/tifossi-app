# Firebase Setup Guide for Tifossi Production App

This guide will help you set up Firebase for your Tifossi mobile app, including Apple Sign-In authentication.

## Prerequisites

Before starting, make sure you have:

- ✅ Apple Developer account (active membership required)
- ✅ Google account for Firebase Console access
- ✅ Access to Xcode on macOS (for iOS configuration)
- ✅ Your production bundle identifier ready (recommended: `com.tifossi.app`)

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Navigate to https://console.firebase.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project" or "Add project"
   - Project name: `tifossi-production`
   - Optionally disable Google Analytics (you can enable it later)
   - Click "Create project" and wait for completion

3. **Project Overview**
   - Once created, you'll see your project dashboard
   - Note your Project ID (visible in project settings)

## Step 2: Add iOS App to Firebase

1. **Add iOS App**
   - In your Firebase project dashboard, click "Add app"
   - Select the iOS icon
   - **Bundle ID**: Enter `com.tifossi.app` (or your chosen production bundle ID)
   - **App nickname**: Enter "Tifossi iOS Production"
   - **App Store ID**: Leave blank for now (add after App Store submission)

2. **Download Configuration File**
   - Download the `GoogleService-Info.plist` file
   - **Important**: Save this file in your project's `/ios` folder
   - Replace any existing placeholder file

3. **Continue Through Setup**
   - The Firebase setup wizard will show additional steps
   - These are already configured in your Tifossi project
   - Click "Continue" through the remaining steps

## Step 3: Enable Authentication

1. **Access Authentication**
   - In Firebase Console, go to "Authentication" in the left sidebar
   - Click "Get started" if this is your first time

2. **Configure Sign-in Methods**
   - Go to the "Sign-in method" tab
   - Enable **Email/Password**:
     - Toggle "Enable"
     - Click "Save"
   - Enable **Apple** (for iOS):
     - Click on "Apple" in the sign-in providers list
     - Toggle "Enable"
     - **Services ID**: Leave blank (Firebase will auto-configure)
     - **Apple Team ID**: Enter your Apple Developer Team ID (see Step 4)
     - Click "Save"

## Step 4: Configure Apple Sign-In in Apple Developer Console

1. **Access Apple Developer Console**
   - Sign in to https://developer.apple.com
   - Go to "Certificates, Identifiers & Profiles"

2. **Find Your Apple Team ID**
   - In the top-right corner, note your Team ID (format: ABC123DEF4)
   - Copy this Team ID - you'll need it for Firebase

3. **Configure App Identifier**
   - Go to "Identifiers" → "App IDs"
   - Find your app identifier (`com.tifossi.app`)
   - If it doesn't exist, create it:
     - Click "+" to add new identifier
     - Select "App IDs" → "App"
     - Description: "Tifossi Production App"
     - Bundle ID: `com.tifossi.app`

4. **Enable Apple Sign-In**
   - Select your app identifier
   - In "Capabilities", check "Sign In with Apple"
   - Click "Save"

5. **Update Firebase with Team ID**
   - Return to Firebase Console → Authentication → Sign-in method → Apple
   - Enter your Apple Team ID in the designated field
   - Click "Save"

## Step 5: Configure Environment Variables

Create a `.env.local` file in your project root with your Firebase configuration:

```env
# Firebase Configuration for Production
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tifossi-production.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tifossi-production
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tifossi-production.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# Environment
EXPO_PUBLIC_ENVIRONMENT=production
```

### How to Find These Values:

1. **In Firebase Console**:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click on your iOS app
   - Select "Config" tab
   - Copy the values from the configuration object

2. **Alternative**: Look in your downloaded `GoogleService-Info.plist` file

## Step 6: Update App Configuration

1. **Update Bundle Identifier** (in `app.json`):

   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.tifossi.app"
       },
       "android": {
         "package": "com.tifossi.app"
       }
     }
   }
   ```

2. **Update Apple Team ID** (in `app.json`):
   ```json
   {
     "plugins": [
       [
         "expo-apple-authentication",
         {
           "appleTeamId": "YOUR_ACTUAL_TEAM_ID"
         }
       ]
     ]
   }
   ```

## Step 7: Test Configuration

1. **Install and Run**:

   ```bash
   npm install
   npx expo run:ios
   ```

2. **Test Apple Sign-In**:
   - Open the app on your iOS device or simulator
   - Navigate to the login screen
   - Tap "Sign in with Apple"
   - Complete the Apple authentication flow

3. **Verify in Firebase**:
   - Go to Firebase Console → Authentication → Users
   - You should see new users appearing after successful sign-ins

## Step 8: Security Configuration

1. **Add to .gitignore**:

   ```
   .env.local
   GoogleService-Info.plist
   google-services.json
   ```

2. **Store Credentials Securely**:
   - Never commit sensitive files to version control
   - Use environment variables for different environments
   - Consider using a secure password manager for credentials

## Costs and Billing

### Firebase Authentication Pricing:

- **Free Tier**: Up to 10,000 verifications per month
- **Paid Tier**: $0.06 per verification after free limit
- **Tifossi Expected Volume**: Should remain within free tier initially

### Monthly Cost Estimate:

- **0-10,000 users**: Free
- **10,000+ users**: ~$6 per additional 1,000 verifications
- **Total with current infrastructure**: $35/month (Render) + Firebase costs

## Troubleshooting

### Common Issues:

1. **"Apple Sign-In not available"**
   - Ensure you're testing on a real iOS device or iOS 13+ simulator
   - Verify Apple Team ID is correctly configured
   - Check that Apple Sign-In is enabled in your app identifier

2. **"Configuration object is not valid"**
   - Verify all environment variables are set correctly
   - Ensure `GoogleService-Info.plist` is in the correct location
   - Check that bundle identifier matches between Firebase and Apple Developer

3. **"Identity token validation failed"**
   - Verify Apple Team ID in both Firebase and app.json
   - Ensure your Apple Developer account is active
   - Check that Apple Sign-In capability is enabled

4. **Build failures**
   - Run: `npx expo install --fix`
   - Clean build: `npx expo start --clear`
   - For iOS: Clean derived data in Xcode

### Getting Help:

1. **Firebase Documentation**: https://firebase.google.com/docs/auth/ios/apple
2. **Expo Apple Authentication**: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
3. **Apple Sign-In Documentation**: https://developer.apple.com/sign-in-with-apple/

## Security Best Practices

1. **Environment Separation**:
   - Use different Firebase projects for development, staging, and production
   - Never use production credentials in development

2. **Access Control**:
   - Limit Firebase project access to necessary team members only
   - Enable 2FA on your Google and Apple Developer accounts

3. **Regular Rotation**:
   - Rotate API keys and secrets regularly
   - Monitor authentication logs for suspicious activity

4. **Firebase Security Rules**:
   - Configure appropriate Firestore security rules if using database features
   - Regularly audit and update security rules

## Next Steps After Setup

1. **App Store Preparation**:
   - Test Apple Sign-In thoroughly on real devices
   - Prepare app for App Store submission with production bundle ID

2. **User Management**:
   - Set up user roles and permissions in Firebase
   - Configure custom user claims if needed

3. **Analytics** (Optional):
   - Enable Firebase Analytics for user insights
   - Set up conversion tracking

4. **Monitoring**:
   - Set up Firebase alerts for authentication issues
   - Monitor authentication success rates

---

**Important**: Keep this guide and all credentials secure. Never share your Firebase configuration or Apple Developer credentials publicly.

For additional support, contact your development team with any specific questions about the Tifossi app integration.
