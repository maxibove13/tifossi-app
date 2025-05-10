import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Animated as RNAnimated, // Rename default Animated
} from 'react-native';
// Import Reanimated
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';

interface OverlayProductRemovingProps {
  isVisible: boolean;
  onCancel: () => void;
  duration?: number; // Optional duration for progress animation
}

// Default removal duration (matches timeout in OverlayProductEdit)
const DEFAULT_DURATION = 3000;

function OverlayProductRemoving({
  isVisible,
  onCancel,
  duration = DEFAULT_DURATION,
}: OverlayProductRemovingProps) {
  // Using RNAnimated for fade/slide
  const [fadeAnim] = useState(new RNAnimated.Value(0));
  const [slideAnim] = useState(new RNAnimated.Value(300));
  // Using Reanimated for progress bar
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Start fade/slide animations
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start progress bar animation
      progress.value = 0; // Reset progress
      progress.value = withTiming(1, {
        duration: duration, // Use provided or default duration
        easing: Easing.linear, // Linear progress for removal
      });
    } else {
      // Reset fade/slide animations
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      // Reset progress (optional, happens on next show anyway)
      progress.value = 0;
    }
    // Add progress and duration to dependencies
  }, [isVisible, fadeAnim, slideAnim, progress, duration]);

  // Animated style for the progress bar fill
  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <Modal transparent visible={isVisible} onRequestClose={onCancel} animationType="none">
      <View style={styles.modalContainer}>
        {/* Semi-transparent background overlay */}
        <RNAnimated.View style={[styles.overlay, { opacity: fadeAnim }]} />

        {/* Animated container sliding up */}
        <RNAnimated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Content Frame (Frame 168) */}
          <View style={styles.contentFrame}>
            <Text style={styles.removingText}>Eliminando...</Text>
            {/* Progress Bar - adapted from SplashScreen */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <Animated.View style={[styles.progressBarFill, progressBarAnimatedStyle]} />
            </View>
          </View>

          {/* Button Frame (Frame 170) */}
          <View style={styles.buttonFrame}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

// Styles based on Figma spec overlay-product-remove
type Styles = {
  modalContainer: ViewStyle;
  overlay: ViewStyle;
  container: ViewStyle;
  contentFrame: ViewStyle;
  removingText: TextStyle;
  // Add progress bar styles
  progressBarContainer: ViewStyle;
  progressBarBackground: ViewStyle;
  progressBarFill: ViewStyle;
  buttonFrame: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Align container to bottom
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Standard overlay dim
  },
  container: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 10,
    gap: spacing.xxl,
    width: '100%',
  },
  contentFrame: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  removingText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    color: colors.primary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  // Progress bar styles adapted from SplashScreen
  progressBarContainer: {
    width: '80%', // Make it wider than splash screen's
    height: 4, // Same height
    position: 'relative',
    marginVertical: spacing.sm,
    alignSelf: 'center', // Center the container
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.border, // Use border color for background
    borderRadius: 32, // Match splash screen
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.primary, // Use primary color for fill
    borderRadius: 32, // Match splash screen
  },
  buttonFrame: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  cancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
  },
  cancelButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: '#424242',
  },
});

export default OverlayProductRemoving;
