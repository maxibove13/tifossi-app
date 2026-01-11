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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../../../_stores/authStore';
import ChevronRight from '../../../../../assets/icons/chevron_right.svg';
import CloseIcon from '../../../../../assets/icons/close_md.svg';
import ChevronRightGreen from '../../../../../assets/icons/chevron_right_green.svg';
import OverlayCheckoutQuantity from './OverlayCheckoutQuantity';
import OverlayProductEditSize from './OverlayProductEditSize';
import OverlayShippingSelection from './OverlayShippingSelection';
import { Product } from '../../../../_types/product';

// Import style tokens
import { colors } from '../../../../_styles/colors';
import { spacing, radius, components } from '../../../../_styles/spacing';
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
  onBuyNow,
  onAddToCart = () => {},
  initialQuantity = 1,
  initialSize = '',
  product,
}: OverlayCheckoutShippingProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [isQuantityOverlayVisible, setIsQuantityOverlayVisible] = useState(false);
  const [isSizeOverlayVisible, setIsSizeOverlayVisible] = useState(false);
  const [isShippingOverlayVisible, setIsShippingOverlayVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);
  const [selectedSize, setSelectedSize] = useState(initialSize);

  // Track explicit user selections - must be selected manually, not auto-filled
  const [hasExplicitlySelectedSize, setHasExplicitlySelectedSize] = useState(false);
  const [hasExplicitlySelectedQuantity, setHasExplicitlySelectedQuantity] = useState(false);

  // Track previous visibility to detect open transition
  const [wasVisible, setWasVisible] = useState(false);

  useEffect(() => {
    if (isVisible && !wasVisible) {
      // Reset state only when overlay OPENS (transition from hidden to visible)
      setSelectedQuantity(initialQuantity);
      setSelectedSize(initialSize);
      setHasExplicitlySelectedSize(false);
      setHasExplicitlySelectedQuantity(false);
    }
    setWasVisible(isVisible);

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
      // Reset nested overlay states to prevent blocking issues (PRODUCT-011)
      setIsQuantityOverlayVisible(false);
      setIsSizeOverlayVisible(false);
      setIsShippingOverlayVisible(false);
    }
  }, [isVisible, fadeAnim, slideAnim, initialQuantity, initialSize, wasVisible]);

  const handleSelectQuantity = () => {
    // Show the quantity overlay
    setIsQuantityOverlayVisible(true);
  };

  const handleQuantitySave = (quantity: number) => {
    setSelectedQuantity(quantity);
    setHasExplicitlySelectedQuantity(true);
    // Call the prop function to update the state in the parent (SwipeableEdge)
    onSelectQuantity(quantity);
  };

  const handleOpenSizeOverlay = () => {
    setIsSizeOverlayVisible(true);
  };

  const handleSizeSave = (size: string) => {
    setSelectedSize(size);
    setHasExplicitlySelectedSize(true);
    onSelectSize(size);
  };

  // Handle buy now action
  const handleBuyNow = () => {
    // Show the shipping overlay instead of closing
    setIsShippingOverlayVisible(true);
  };

  // Handle add to cart action
  const handleAddToCart = async () => {
    try {
      await onAddToCart(selectedSize, selectedQuantity);
      onClose();
    } catch {
      // Error is handled by the cart store (shows alert to user)
    }
  };

  const handleSelectShipping = async (method: 'delivery' | 'pickup' | '') => {
    if (!method) return;

    // PRODUCT-012: Don't add to cart yet - use onBuyNow to set pending item
    // Cart addition will happen at order confirmation
    if (onBuyNow) {
      onBuyNow(selectedSize, selectedQuantity);
    }

    setIsShippingOverlayVisible(false);
    onClose();

    if (method === 'delivery') {
      if (isLoggedIn) {
        router.navigate('/checkout/shipping-address');
      } else {
        router.navigate('/checkout/new-address?guest=true');
      }
    } else {
      // Pickup flow - store selection first, then contact info for guests
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
            {/* Frame 175: Header + Selection Rows */}
            <View style={styles.contentWrapper}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {hasExplicitlySelectedSize && hasExplicitlySelectedQuantity
                    ? 'Agregar al carrito'
                    : 'Editar'}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                  <CloseIcon width={24} height={24} />
                </TouchableOpacity>
              </View>

              {/* Selection Rows */}
              <View style={styles.selectionRows}>
                {/* Size Selection Row */}
                <TouchableOpacity
                  style={styles.selectionRow}
                  onPress={handleOpenSizeOverlay}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectionTitle}>Talle</Text>
                  <View style={styles.actionButton}>
                    {hasExplicitlySelectedSize ? (
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
                    {hasExplicitlySelectedQuantity ? (
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
            </View>

            {/* Action Buttons - only show when user has explicitly selected both */}
            {hasExplicitlySelectedSize && hasExplicitlySelectedQuantity && (
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleBuyNow} activeOpacity={0.7}>
                  <LinearGradient colors={['#373737', '#0C0C0C']} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Comprar ahora</Text>
                  </LinearGradient>
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
  contentWrapper: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  selectionRows: ViewStyle;
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
    backgroundColor: colors.background.antiflash,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: 34,
    gap: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -16,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
  },
  closeButton: {
    width: 40,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  selectionRows: {
    gap: spacing.lg,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: components.selectionRow.height,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    gap: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    height: components.button.heightLarge,
    borderRadius: radius.buttonLarge,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.background.offWhite,
  },
  secondaryButton: {
    width: '100%',
    height: components.button.heightLarge,
    borderRadius: radius.buttonLarge,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});
