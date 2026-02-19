import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../_styles/colors';
import { fonts, fontWeights } from '../_styles/typography';
import { spacing } from '../_styles/spacing';
import TrashIconWhite from '../../assets/icons/trash_icon_white.svg';

// Import the background image
const BackgroundImage = require('../../assets/images/cart_deleted_background.png');
// Import the NEW white Trash Icon SVG

function CartItemDeletedScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Redirect to cart after 1 second
      router.replace('/(tabs)/cart'); // Replace to prevent back navigation to this screen
    }, 1000);

    // Cleanup the timer if the component unmounts before the timer fires
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ImageBackground source={BackgroundImage} style={styles.background}>
      {/* Ensure overlay covers the entire background */}
      <View style={styles.backgroundOverlay} />
      {/* Content container, positioned above the overlay */}
      <View style={styles.contentContainer}>
        <TrashIconWhite width={64} height={64} strokeWidth={2.4} fill="none" />
        <Text style={styles.messageText}>El producto ha sido quitado de su carrito.</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Added overlay style
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject, // Cover the entire background
    backgroundColor: 'rgba(0, 0, 0, 0.72)', // Black overlay with 28% opacity
    zIndex: 0, // Ensure overlay is behind the content
  },
  contentContainer: {
    // Ensure content is above the overlay
    zIndex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  messageText: {
    fontFamily: fonts.secondary,
    fontSize: 18,
    fontWeight: fontWeights.regular,
    lineHeight: 18 * 1.5555555555555556,
    color: colors.background.light, // White text
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});

// Default export should be the component itself for Expo Router
export default CartItemDeletedScreen;

// Removed the utilityExport object and the named export
