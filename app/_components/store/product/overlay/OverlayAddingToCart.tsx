import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';

interface OverlayAddingToCartProps {
  isVisible: boolean;
  onCancel: () => void;
  onComplete: () => void;
  duration?: number;
}

const DEFAULT_DURATION = 1500;

function OverlayAddingToCart({
  isVisible,
  onCancel,
  onComplete,
  duration = DEFAULT_DURATION,
}: OverlayAddingToCartProps) {
  const [fadeAnim] = useState(new RNAnimated.Value(0));
  const [slideAnim] = useState(new RNAnimated.Value(300));
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
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

      progress.value = 0;
      progress.value = withTiming(
        1,
        {
          duration: duration,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        }
      );
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      progress.value = 0;
    }
  }, [isVisible, fadeAnim, slideAnim, progress, duration, onComplete]);

  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <Modal transparent visible={isVisible} onRequestClose={onCancel} animationType="none">
      <View style={styles.modalContainer}>
        <RNAnimated.View style={[styles.overlay, { opacity: fadeAnim }]} />

        <RNAnimated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.contentFrame}>
            <Text style={styles.addingText}>Agregando al carrito...</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <Animated.View style={[styles.progressBarFill, progressBarAnimatedStyle]} />
            </View>
          </View>

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

type Styles = {
  modalContainer: ViewStyle;
  overlay: ViewStyle;
  container: ViewStyle;
  contentFrame: ViewStyle;
  addingText: TextStyle;
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
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  addingText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    color: colors.primary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    position: 'relative',
    marginVertical: spacing.sm,
    alignSelf: 'center',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    borderRadius: 32,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 32,
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

export default OverlayAddingToCart;
