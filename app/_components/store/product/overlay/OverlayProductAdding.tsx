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

interface OverlayProductAddingProps {
  isVisible: boolean;
  onComplete: () => void;
  onViewCart: () => void;
  duration?: number;
}

const DEFAULT_DURATION = 1500;

function OverlayProductAdding({
  isVisible,
  onComplete,
  onViewCart,
  duration = DEFAULT_DURATION,
}: OverlayProductAddingProps) {
  const [fadeAnim] = useState(new RNAnimated.Value(0));
  const [slideAnim] = useState(new RNAnimated.Value(300));
  const [isAdded, setIsAdded] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setIsAdded(false);

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
            runOnJS(setIsAdded)(true);
          }
        }
      );
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      progress.value = 0;
      setIsAdded(false);
    }
  }, [isVisible, fadeAnim, slideAnim, progress, duration]);

  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const handleViewCart = () => {
    onComplete();
    onViewCart();
  };

  const handleDismiss = () => {
    onComplete();
  };

  return (
    <Modal transparent visible={isVisible} onRequestClose={handleDismiss} animationType="none">
      <View style={styles.modalContainer}>
        <RNAnimated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </RNAnimated.View>

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
            <Text style={styles.statusText}>
              {isAdded ? 'Producto agregado al carrito' : 'Agregando al carrito...'}
            </Text>
            {!isAdded && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground} />
                <Animated.View style={[styles.progressBarFill, progressBarAnimatedStyle]} />
              </View>
            )}
          </View>

          <View style={styles.buttonFrame}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewCart}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Ver carrito</Text>
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
  statusText: TextStyle;
  progressBarContainer: ViewStyle;
  progressBarBackground: ViewStyle;
  progressBarFill: ViewStyle;
  buttonFrame: ViewStyle;
  actionButton: ViewStyle;
  actionButtonText: TextStyle;
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
  statusText: {
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
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
  },
  actionButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: '#424242',
  },
});

export default OverlayProductAdding;
