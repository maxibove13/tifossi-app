import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
// SVG components for quantity control
// @ts-ignore - Import SVG components
import MinusIcon from '../../../../../assets/icons/quantity/minus.svg';
// @ts-ignore - Import SVG components
import PlusIcon from '../../../../../assets/icons/quantity/plus.svg';

// Import style tokens
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fontSizes, lineHeights } from '../../../../_styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

// Constants
const MAX_QUANTITY = 16;
const MIN_QUANTITY = 1;
const ITEM_HEIGHT = 44; // Height of each number item in the wheel

interface OverlayCheckoutQuantityProps {
  isVisible: boolean;
  onClose: () => void;
  onGoBack: () => void;
  onSave: (quantity: number) => void;
  initialQuantity?: number;
}

export default function OverlayCheckoutQuantity({
  isVisible,
  onClose,
  onGoBack,
  onSave,
  initialQuantity = 1,
}: OverlayCheckoutQuantityProps) {
  // State for quantity
  const [quantity, setQuantity] = useState(initialQuantity);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [wheelPosition] = useState(new Animated.Value(0));

  // Reset quantity when overlay opens with initialQuantity
  useEffect(() => {
    if (isVisible) {
      setQuantity(initialQuantity);
      // Set initial wheel position
      wheelPosition.setValue(-ITEM_HEIGHT * initialQuantity);
    }
  }, [isVisible, initialQuantity, wheelPosition]);

  useEffect(() => {
    if (isVisible) {
      // Start fade-in and slide-up animations when overlay becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when overlay is hidden
      fadeAnim.setValue(0);
      slideAnim.setValue(height);
    }
  }, [isVisible, fadeAnim, slideAnim]);

  // Handlers for quantity changes with animations
  const decreaseQuantity = () => {
    if (quantity > MIN_QUANTITY) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);

      // Animate wheel position
      Animated.timing(wheelPosition, {
        toValue: -ITEM_HEIGHT * newQuantity,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const increaseQuantity = () => {
    if (quantity < MAX_QUANTITY) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);

      // Animate wheel position
      Animated.timing(wheelPosition, {
        toValue: -ITEM_HEIGHT * newQuantity,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Handle save action
  const handleSave = () => {
    onSave(quantity);
    onGoBack(); // Go back to shipping overlay instead of closing completely
  };

  return (
    <Modal transparent visible={isVisible} onRequestClose={onClose} animationType="none">
      <View style={styles.modalContainer}>
        {/* Animated overlay background that can be tapped to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Animated container that slides up */}
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Modificar cantidad</Text>
          </View>

          {/* Quantity Counter */}
          <View style={styles.counterContainer}>
            <View style={styles.counter}>
              {/* Decrease button */}
              <TouchableOpacity
                style={styles.counterButton}
                onPress={decreaseQuantity}
                activeOpacity={0.7}
                disabled={quantity <= MIN_QUANTITY}
              >
                <View style={styles.iconContainer}>
                  <MinusIcon width={16} height={2} stroke="#0C0C0C" strokeWidth={1.6} />
                </View>
              </TouchableOpacity>

              {/* Display quantity with wheel effect */}
              <View style={styles.quantityDisplay}>
                {/* Selection indicator overlay */}
                <View style={styles.selectionIndicator} />

                {/* Animated wheel of numbers */}
                <View style={styles.wheelContainer}>
                  <Animated.View
                    style={[styles.wheel, { transform: [{ translateY: wheelPosition }] }]}
                  >
                    {Array.from({ length: MAX_QUANTITY + 1 }, (_, i) => i).map((num) => (
                      <View key={num} style={styles.wheelItem}>
                        <Text
                          style={[
                            styles.wheelItemText,
                            num === quantity && styles.activeWheelItemText,
                          ]}
                        >
                          {num}
                        </Text>
                      </View>
                    ))}
                  </Animated.View>
                </View>
              </View>

              {/* Increase button */}
              <TouchableOpacity
                style={styles.counterButton}
                onPress={increaseQuantity}
                activeOpacity={0.7}
                disabled={quantity >= MAX_QUANTITY}
              >
                <View style={styles.iconContainer}>
                  <PlusIcon width={16} height={16} stroke="#0C0C0C" strokeWidth={1.6} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={onGoBack} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

type Styles = {
  modalContainer: ViewStyle;
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  counterContainer: ViewStyle;
  counter: ViewStyle;
  counterButton: ViewStyle;
  iconContainer: ViewStyle;
  quantityDisplay: ViewStyle;
  selectionIndicator: ViewStyle;
  wheelContainer: ViewStyle;
  wheel: ViewStyle;
  wheelItem: ViewStyle;
  wheelItemText: TextStyle;
  activeWheelItemText: TextStyle;
  actionButtons: ViewStyle;
  backButton: ViewStyle;
  backButtonText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
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
    backgroundColor: colors.background.light,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xxl,
    paddingBottom: spacing.xxl + 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    width: '100%',
    gap: spacing.xxl + spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: fontSizes.md,
    fontWeight: '400',
    lineHeight: lineHeights.md,
    color: '#575757',
  },
  counterContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    width: 48,
    height: ITEM_HEIGHT,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(199, 199, 199, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    width: '100%',
    height: ITEM_HEIGHT,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  wheelContainer: {
    width: '100%',
    height: ITEM_HEIGHT,
    overflow: 'hidden',
  },
  wheel: {
    width: '100%',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontFamily: 'Roboto',
    fontSize: 32,
    fontWeight: '400',
    color: '#0C0C0C',
    textAlign: 'center',
  },
  activeWheelItemText: {
    color: '#0C0C0C',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#424242',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#FBFBFB',
  },
});
