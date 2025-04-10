import React, { useState, useEffect } from 'react';
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
  Image,
  ImageStyle
} from 'react-native';
import CloseIcon from '../../../../../assets/icons/close.svg';
import HouseIcon from '../../../../../assets/icons/house.svg';

// Import style tokens
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

type ShippingMethod = 'delivery' | 'pickup' | '';

interface OverlayShippingSelectionProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectShipping: (method: ShippingMethod) => void;
  initialMethod?: ShippingMethod;
}

export default function OverlayShippingSelection({
  isVisible,
  onClose,
  onSelectShipping,
  initialMethod = ''
}: OverlayShippingSelectionProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [_, setSelectedMethod] = useState<ShippingMethod>(initialMethod);

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
        })
      ]).start();
    } else {
      // Reset animation values when overlay is hidden
      fadeAnim.setValue(0);
      slideAnim.setValue(height);
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const handleSelectMethod = (method: ShippingMethod) => {
    setSelectedMethod(method);
    onSelectShipping(method);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.modalContainer}>
        {/* Animated overlay background that can be tapped to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View 
            style={[
              styles.overlay, 
              { opacity: fadeAnim }
            ]} 
          />
        </TouchableWithoutFeedback>

        {/* Animated container that slides up */}
        <Animated.View 
          style={[
            styles.container, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar entrega</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Home Delivery Option */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelectMethod('delivery')}
              activeOpacity={0.7}
            >
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Envío a domicilio</Text>
                <Text style={styles.optionDescription}>Recibe en la dirección que indiques.</Text>
              </View>
              <HouseIcon width={24} height={24} stroke={colors.primary} strokeWidth={1.6} />
            </TouchableOpacity>

            {/* Store Pickup Option */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelectMethod('pickup')}
              activeOpacity={0.7}
            >
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Recoger en tienda</Text>
                <Text style={styles.optionDescription}>Retira en tu local Tiffosi preferido.</Text>
              </View>
              <Image 
                source={require('../../../../../assets/images/logo/tiffosi.png')} 
                style={styles.logoImage}
              />
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
  closeButton: ViewStyle;
  content: ViewStyle;
  option: ViewStyle;
  optionTextContainer: ViewStyle;
  optionTitle: TextStyle;
  optionDescription: TextStyle;
  logoImage: ImageStyle;
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
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 10,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  content: {
    paddingHorizontal: spacing.sm,
    gap: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  optionDescription: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    color: colors.secondary,
  },
  logoImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
}); 