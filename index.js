/**
 * Tifossi Entry Point
 * 
 * First import gesture handler, then initialize Reanimated.
 * This order is critical for both to work properly.
 */
import 'react-native-gesture-handler';
// Explicitly require Reanimated before anything else that might use it
import 'react-native-reanimated';

// Initialize Expo Router
import 'expo-router/entry';