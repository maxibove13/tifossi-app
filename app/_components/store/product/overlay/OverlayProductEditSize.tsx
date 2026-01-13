import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import shared components
import RadioButton from '../../../../_components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fontSizes, lineHeights } from '../../../../_styles/typography';
import { ProductSize } from '../../../../_types/product';

// Get screen dimensions
const { height } = Dimensions.get('window');

interface OverlayProductEditSizeProps {
  isVisible: boolean;
  onClose: () => void;
  onGoBack: () => void;
  onSave: (size: string) => void;
  initialSize?: string;
  productSizes?: ProductSize[]; // Add product sizes prop
}

export default function OverlayProductEditSize({
  isVisible,
  onClose,
  onGoBack,
  onSave,
  initialSize = '',
  productSizes = [], // Default to empty array
}: OverlayProductEditSizeProps) {
  // State for selected size
  const [selectedSize, setSelectedSize] = useState(''); // Initialize empty

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  // Determine available sizes and if it's a single 'Talle Unico' using useMemo
  const availableSizes = useMemo(() => {
    const validProductSizes = productSizes || []; // Ensure productSizes is an array
    return validProductSizes.filter(
      (size) => size.available && (size.stock === undefined || size.stock > 0)
    );
  }, [productSizes]);

  const isTalleUnico = useMemo(() => availableSizes.length <= 1, [availableSizes]);

  const talleUnicoValue = useMemo(() => {
    if (!isTalleUnico) return '';
    // Use provided value or default to 'Talle Único'
    return availableSizes.length === 1 ? availableSizes[0].value : 'Talle Único';
  }, [isTalleUnico, availableSizes]);

  // Effect to set the *initial* selected size when the modal becomes visible
  // or if the underlying product/initial data changes while it's open.
  useEffect(() => {
    if (isVisible) {
      let newInitialSelection = '';
      if (isTalleUnico) {
        newInitialSelection = talleUnicoValue;
      } else if (initialSize && availableSizes.some((s) => s.value === initialSize)) {
        // Set initial size only if it's one of the available ones
        newInitialSelection = initialSize;
      }
      // Only update if the calculated initial selection differs from the current selection
      // Use functional update to avoid adding selectedSize to dependencies
      setSelectedSize((currentSelection) =>
        currentSelection !== newInitialSelection ? newInitialSelection : currentSelection
      );
    }
    // selectedSize is intentionally omitted from dependencies to prevent resetting user selection
  }, [isVisible, initialSize, availableSizes, isTalleUnico, talleUnicoValue]);

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

  // Handle size selection
  const handleSelectSize = (size: string) => {
    // Do not allow selection change if it's Talle Unico
    if (!isTalleUnico) {
      setSelectedSize(size);
    }
  };

  // Handle save action
  const handleSave = () => {
    // Ensure the correct value is saved, using the current selectedSize
    onSave(selectedSize);
    onGoBack();
  };

  // Helper to format stock display
  const getStockText = (stock: number): string | null => {
    if (stock === 0) return 'Sin stock';
    if (stock < 5) return `(${stock} disponible${stock > 1 ? 's' : ''})`;
    return null; // Don't show stock for items with 5+ in stock
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
            <Text style={styles.title}>Cambiar talle</Text>
          </View>

          {/* Size Selection */}
          <View style={styles.sizeSelectionContainer}>
            {isTalleUnico ? (
              // Display only 'Talle Unico' (using the determined value)
              <View style={styles.sizeOption}>
                <Text style={styles.sizeOptionText}>{talleUnicoValue}</Text>
                <RadioButton selected={true} />
              </View>
            ) : (
              // Display list of available sizes
              availableSizes.map((size) => {
                const stock = size.stock ?? 0;
                const stockText = getStockText(stock);
                const isOutOfStock = stock === 0;
                return (
                  <TouchableOpacity
                    key={size.value}
                    style={styles.sizeOption}
                    onPress={() => handleSelectSize(size.value)}
                    activeOpacity={0.7}
                    disabled={!size.available || isOutOfStock}
                  >
                    <View style={styles.sizeInfoContainer}>
                      <Text
                        style={[
                          styles.sizeOptionText,
                          isOutOfStock && styles.sizeOptionTextDisabled,
                        ]}
                      >
                        {size.value}
                      </Text>
                      {stockText && (
                        <Text
                          style={[styles.stockText, isOutOfStock && styles.stockTextOutOfStock]}
                        >
                          {stockText}
                        </Text>
                      )}
                    </View>
                    <RadioButton selected={selectedSize === size.value} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={onGoBack} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity
              style={styles.saveButtonWrapper}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!selectedSize && !isTalleUnico}
            >
              <LinearGradient colors={['#373737', '#0C0C0C']} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -16,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    width: '100%',
    gap: 40,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: fontSizes.lg,
    fontWeight: '400',
    lineHeight: lineHeights.lg,
    color: '#575757',
  },
  sizeSelectionContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  sizeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  sizeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sizeOptionText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.lg,
    fontWeight: '400',
    lineHeight: lineHeights.lg,
    color: '#0C0C0C',
  },
  sizeOptionTextDisabled: {
    color: '#9E9E9E',
  },
  stockText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.xs,
    fontWeight: '400',
    lineHeight: lineHeights.xs,
    color: colors.secondary,
  },
  stockTextOutOfStock: {
    color: '#9E9E9E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: '500',
    lineHeight: lineHeights.md,
    color: '#424242',
  },
  saveButtonWrapper: {
    flex: 1,
    height: 44,
  },
  saveButton: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: '500',
    lineHeight: lineHeights.md,
    color: '#FBFBFB',
  },
});
