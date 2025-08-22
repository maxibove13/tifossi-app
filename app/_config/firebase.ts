/**
 * Firebase Configuration
 *
 * This file initializes Firebase for the Tifossi app.
 * Configuration values should be stored in environment variables.
 */

import { initializeApp, getApps } from '@react-native-firebase/app';

// Firebase configuration object
// These values should come from your Firebase project settings
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'your-measurement-id',
};

// Initialize Firebase
let app;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export default app;
export { firebaseConfig };
