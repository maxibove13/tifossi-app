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
    return validProductSizes.filter((size) => size.available);
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

  // Handle size guide press
  const handleSizeGuidePress = () => {
    // Implement size guide functionality here
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
            <TouchableOpacity onPress={handleSizeGuidePress} activeOpacity={0.7}>
              <Text style={styles.sizeGuideText}>Tabla de medidas</Text>
            </TouchableOpacity>
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
              availableSizes.map((size) => (
                <TouchableOpacity
                  key={size.value}
                  style={styles.sizeOption}
                  onPress={() => handleSelectSize(size.value)}
                  activeOpacity={0.7}
                  disabled={!size.available} // Should always be true due to filter
                >
                  <Text style={styles.sizeOptionText}>{size.value}</Text>
                  <RadioButton selected={selectedSize === size.value} />
                </TouchableOpacity>
              ))
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
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!selectedSize && !isTalleUnico} // Allow save if TalleUnico even if selectedSize is initial empty string briefly
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
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
    padding: spacing.xxl,
    paddingBottom: spacing.xxl + 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -16,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    width: '100%',
    gap: spacing.xxl + spacing.md,
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
  sizeGuideText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: lineHeights.sm,
    color: '#575757',
    textDecorationLine: 'underline',
  },
  sizeSelectionContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.md,
  },
  sizeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  sizeOptionText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: '400',
    lineHeight: lineHeights.md,
    color: '#0C0C0C',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
    paddingHorizontal: spacing.xl,
  },
  backButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.sm,
    fontWeight: '500',
    lineHeight: fontSizes.sm * 1.429,
    color: '#424242',
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.dark,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.sm,
    fontWeight: '500',
    lineHeight: fontSizes.sm * 1.429,
    color: '#FBFBFB',
  },
});
