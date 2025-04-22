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
} from 'react-native';
import { router } from 'expo-router';
import CloseIcon from '../../../../../assets/icons/close.svg';
import ChevronRight from '../../../../../assets/icons/chevron_right.svg';
import ChevronRightGreen from '../../../../../assets/icons/chevron_right_green.svg';
import OverlayCheckoutQuantity from './OverlayCheckoutQuantity';
import OverlayProductEditSize from './OverlayProductEditSize';
import OverlayShippingSelection from './OverlayShippingSelection';
import { Product } from '../../../../_types/product';

// Import style tokens
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

interface OverlayCheckoutShippingProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  onSelectQuantity: (quantity: number) => void;
  onBuyNow?: (size: string, quantity: number) => void;
  onAddToCart?: (size: string, quantity: number) => void;
  initialQuantity?: number;
  initialSize?: string;
  product?: Product;
}

export default function OverlayCheckoutShipping({
  isVisible,
  onClose,
  onSelectSize,
  onSelectQuantity,
  onBuyNow: _onBuyNow = () => {},
  onAddToCart = () => {},
  initialQuantity = 1,
  initialSize = '',
  product,
}: OverlayCheckoutShippingProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [isQuantityOverlayVisible, setIsQuantityOverlayVisible] = useState(false);
  const [isSizeOverlayVisible, setIsSizeOverlayVisible] = useState(false);
  const [isShippingOverlayVisible, setIsShippingOverlayVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);
  const [selectedSize, setSelectedSize] = useState(initialSize);

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

  const handleSelectQuantity = () => {
    // Show the quantity overlay
    setIsQuantityOverlayVisible(true);
  };

  const handleQuantitySave = (quantity: number) => {
    setSelectedQuantity(quantity);
    // Call the prop function to update the state in the parent (SwipeableEdge)
    onSelectQuantity(quantity);
    // Just update the quantity state without calling onSelectQuantity yet
    // User will return to this overlay after selecting a quantity
  };

  const handleOpenSizeOverlay = () => {
    setIsSizeOverlayVisible(true);
  };

  const handleSizeSave = (size: string) => {
    setSelectedSize(size);
    onSelectSize(size);
  };

  // Handle buy now action
  const handleBuyNow = () => {
    // Show the shipping overlay instead of closing
    setIsShippingOverlayVisible(true);
  };

  // Handle add to cart action
  const handleAddToCart = () => {
    onAddToCart(selectedSize, selectedQuantity);
    onClose();
  };

  const handleSelectShipping = (method: 'delivery' | 'pickup' | '') => {
    setIsShippingOverlayVisible(false);
    onClose();

    if (method === 'delivery') {
      router.navigate('/checkout/shipping-address');
    } else if (method === 'pickup') {
      router.navigate('/checkout/shipping-pickup');
    }
  };

  return (
    <>
      <Modal
        transparent
        visible={
          isVisible &&
          !isQuantityOverlayVisible &&
          !isSizeOverlayVisible &&
          !isShippingOverlayVisible
        }
        onRequestClose={onClose}
        animationType="none"
      >
        <View style={styles.modalContainer}>
          {/* Animated overlay background that can be tapped to close */}
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>

          {/* Animated container that slides up */}
          <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {selectedSize && selectedQuantity > 0 ? 'Editar' : 'Agregar al carrito'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Size Selection Row */}
              <TouchableOpacity
                style={styles.selectionRow}
                onPress={handleOpenSizeOverlay}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionTitle}>Talle</Text>
                <View style={styles.actionButton}>
                  {selectedSize ? (
                    <>
                      <Text style={[styles.actionText, styles.doneText]}>Listo</Text>
                      <ChevronRightGreen width={8} height={14} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.actionText}>Seleccionar</Text>
                      <ChevronRight width={8} height={14} />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Quantity Selection Row */}
              <TouchableOpacity
                style={styles.selectionRow}
                onPress={handleSelectQuantity}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionTitle}>Cantidad</Text>
                <View style={styles.actionButton}>
                  {selectedQuantity > 0 ? (
                    <>
                      <Text style={[styles.actionText, styles.doneText]}>Listo</Text>
                      <ChevronRightGreen width={8} height={14} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.actionText}>Seleccionar</Text>
                      <ChevronRight width={8} height={14} />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons - only show when both size and quantity are selected */}
            {selectedSize && selectedQuantity > 0 && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleBuyNow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.primaryButtonText}>Comprar ahora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleAddToCart}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Agregar al carrito</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Quantity Overlay */}
      <OverlayCheckoutQuantity
        isVisible={isQuantityOverlayVisible}
        onClose={onClose}
        onGoBack={() => setIsQuantityOverlayVisible(false)}
        onSave={handleQuantitySave}
        initialQuantity={selectedQuantity}
      />

      {/* Size Overlay */}
      <OverlayProductEditSize
        isVisible={isSizeOverlayVisible}
        onClose={onClose}
        onGoBack={() => setIsSizeOverlayVisible(false)}
        onSave={handleSizeSave}
        initialSize={selectedSize}
        productSizes={product?.sizes}
      />

      {/* Shipping Overlay */}
      <OverlayShippingSelection
        isVisible={isShippingOverlayVisible}
        onClose={() => setIsShippingOverlayVisible(false)}
        onSelectShipping={handleSelectShipping}
      />
    </>
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
  selectionRow: ViewStyle;
  selectionTitle: TextStyle;
  actionButton: ViewStyle;
  actionText: TextStyle;
  doneText: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.md,
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
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  selectionTitle: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.error,
  },
  doneText: {
    color: '#367C39',
  },
  actionButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.dark,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: '#FBFBFB',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: '#0C0C0C',
  },
});
