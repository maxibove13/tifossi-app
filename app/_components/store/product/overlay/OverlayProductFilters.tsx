import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView,
  // TextStyle, // Removed unused import
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider'; // Added multi-slider
import { colors } from '../../../../_styles/colors';
import { fonts, fontSizes, fontWeights, lineHeights } from '../../../../_styles/typography';
import { spacing, radius } from '../../../../_styles/spacing';
import { ProductColor, ProductSize } from '../../../../_types/product';
import { ProductLabel } from '../../../../_types/product-status';
import { Ionicons } from '@expo/vector-icons'; // Added Ionicons import

const { height } = Dimensions.get('window'); // Re-add this line

export interface ProductFilters {
  sizes?: string[];
  colorHexes?: string[];
  priceRange?: { min: number; max: number };
  labels?: ProductLabel[];
}

interface OverlayProductFiltersProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ProductFilters) => void;
  availableSizes: ProductSize[];
  availableColors: ProductColor[];
  _availableLabels?: ProductLabel[]; // Renamed to match usage with underscore prefix
  minPrice: number;
  maxPrice: number;
  initialFilters?: ProductFilters;
}

export default function OverlayProductFilters({
  isVisible,
  onClose,
  onApplyFilters,
  availableSizes = [],
  availableColors = [],
  // Prefix unused params with underscore to satisfy linter
  _availableLabels = [],
  minPrice = 0,
  maxPrice = 5000, // Default max, should be dynamic
  initialFilters = {},
}: OverlayProductFiltersProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  // Internal state for selected filters before applying
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialFilters.sizes || []);
  const [selectedColorHexes, setSelectedColorHexes] = useState<string[]>(
    initialFilters.colorHexes || []
  );
  // Prefix unused variable with underscore to satisfy linter
  const [_selectedLabels, setSelectedLabels] = useState<ProductLabel[]>(
    initialFilters.labels || []
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number }>(
    initialFilters.priceRange || { min: minPrice, max: maxPrice }
  );

  // Reset internal state when initial filters change (e.g., filters cleared externally)
  useEffect(() => {
    setSelectedSizes(initialFilters.sizes || []);
    setSelectedColorHexes(initialFilters.colorHexes || []);
    setSelectedLabels(initialFilters.labels || []);
    setSelectedPriceRange(initialFilters.priceRange || { min: minPrice, max: maxPrice });
  }, [initialFilters, minPrice, maxPrice]);

  // Handle animations
  useEffect(() => {
    if (isVisible) {
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
      // Animation reset is handled by handleClose or next open
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height, // Slide down
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(); // Call original onClose after animation
    });
  };

  const handleApply = () => {
    const filtersToApply: ProductFilters = {};
    if (selectedSizes.length > 0) filtersToApply.sizes = selectedSizes;
    if (selectedColorHexes.length > 0) filtersToApply.colorHexes = selectedColorHexes;
    // Only apply price filter if it's different from the absolute min/max
    if (selectedPriceRange.min !== minPrice || selectedPriceRange.max !== maxPrice) {
      filtersToApply.priceRange = selectedPriceRange;
    }
    onApplyFilters(filtersToApply);
    handleClose(); // Use handleClose to animate out
  };

  const handleClear = () => {
    setSelectedSizes([]);
    setSelectedColorHexes([]);
    setSelectedPriceRange({ min: minPrice, max: maxPrice });
    // Apply empty filters immediately
    onApplyFilters({});
    handleClose(); // Use handleClose to animate out
  };

  // Toggle functions for multi-select
  const toggleSize = (sizeValue: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeValue) ? prev.filter((s) => s !== sizeValue) : [...prev, sizeValue]
    );
  };

  const toggleColor = (colorHex: string) => {
    setSelectedColorHexes((prev) =>
      prev.includes(colorHex) ? prev.filter((c) => c !== colorHex) : [...prev, colorHex]
    );
  };

  // Memoize unique colors with hex values
  const uniqueColors = useMemo(() => {
    const colorsMap = new Map<string, ProductColor>();
    availableColors.forEach((color) => {
      if (color.hex && !colorsMap.has(color.hex)) {
        colorsMap.set(color.hex, color);
      }
    });
    return Array.from(colorsMap.values());
  }, [availableColors]);

  // Memoize unique, available sizes
  const uniqueAvailableSizes = useMemo(() => {
    const sizeMap = new Map<string, ProductSize>();
    availableSizes.forEach((size) => {
      if (size.available && !sizeMap.has(size.value)) {
        sizeMap.set(size.value, size);
      }
    });
    // Consider sorting sizes if needed (e.g., S, M, L, XL)
    return Array.from(sizeMap.values());
  }, [availableSizes]);

  // Handler for the range slider
  const handlePriceRangeChange = (values: number[]) => {
    setSelectedPriceRange({ min: values[0], max: values[1] });
  };

  // Add checks before accessing .min and .max
  const displayMin =
    typeof selectedPriceRange?.min === 'number'
      ? selectedPriceRange.min.toFixed(0)
      : String(minPrice || 0); // Fallback to minPrice prop or 0

  const displayMax =
    typeof selectedPriceRange?.max === 'number'
      ? selectedPriceRange.max.toFixed(0)
      : String(maxPrice || '...'); // Fallback to maxPrice prop or '...'

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={handleClose} // Use handleClose for back button/gesture
      animationType="none" // Handled by Animated API
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContainer}>
            {/* Size Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Talle</Text>
              <View style={styles.optionsContainer}>
                {uniqueAvailableSizes.map((size) => {
                  const isSelected = selectedSizes.includes(size.value);
                  return (
                    <TouchableOpacity
                      key={size.value}
                      style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                      onPress={() => toggleSize(size.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}
                      >
                        {size.value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Color Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.optionsContainer}>
                {uniqueColors.map((color) => {
                  const isSelected = selectedColorHexes.includes(color.hex!);
                  return (
                    <TouchableOpacity
                      key={color.hex}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color.hex },
                        isSelected && styles.colorOptionSelected,
                      ]}
                      onPress={() => toggleColor(color.hex!)}
                      activeOpacity={0.8}
                    />
                  );
                })}
              </View>
            </View>

            {/* Price Range Filter - Updated */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Rango de Precio</Text>
              <View style={styles.priceLabelsContainer}>
                {/* Display selected range using safe values */}
                <Text style={styles.priceLabel}>${displayMin}</Text>
                <Text style={styles.priceLabel}>${displayMax}</Text>
              </View>
              <View style={styles.sliderContainer}>
                <MultiSlider
                  values={[selectedPriceRange.min, selectedPriceRange.max]}
                  sliderLength={Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2} // Adjust length based on padding
                  onValuesChange={handlePriceRangeChange}
                  min={minPrice}
                  max={maxPrice}
                  step={10} // Or adjust step as needed
                  allowOverlap={false}
                  snapped
                  minMarkerOverlapDistance={40} // Adjust as needed
                  // --- Styling (match previous single slider) ---
                  trackStyle={styles.sliderTrack}
                  selectedStyle={{ backgroundColor: colors.primary }}
                  unselectedStyle={{ backgroundColor: colors.border }}
                  markerStyle={styles.sliderMarker}
                  pressedMarkerStyle={styles.sliderMarkerPressed}
                  // containerStyle={styles.sliderComponentContainer} // Optional container style
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons - Replaced with TouchableOpacity to match OverlayProductEditSize */}
          <View style={styles.actionButtons}>
            {/* Clear button (like Back button) */}
            <TouchableOpacity
              style={styles.clearButtonLayout}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>

            {/* Apply button (like Save button) */}
            <TouchableOpacity
              style={styles.applyButtonLayout}
              onPress={handleApply}
              activeOpacity={0.7}
              // disabled={!selectedSize && !isTalleUnico} // Add disabled logic if needed
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
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
    backgroundColor: colors.background.light,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg, // Adjust based on safe area if needed
    maxHeight: height * 0.75, // Limit height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center', // Center title
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0, // Position to the right
    padding: spacing.sm, // Hit area
  },
  scrollContainer: {
    flexGrow: 1, // Allows scrolling if content exceeds maxHeight
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.circle,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
  },
  optionChipTextSelected: {
    color: colors.background.light,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: radius.circle,
    borderWidth: 1,
    borderColor: colors.border, // Border for light colors
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: colors.primary, // Highlight selected color
    transform: [{ scale: 1.1 }],
  },
  priceLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm, // Space between labels and slider
  },
  priceLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    minWidth: 40, // Ensure space for price
    textAlign: 'center',
  },
  sliderContainer: {
    alignItems: 'center', // Center the slider horizontally
    height: 40, // Ensure container has height for touch events
    // justifyContent: 'center', // Center slider vertically if needed
  },
  sliderTrack: {
    height: 3, // Adjust track height
    borderRadius: 1.5,
  },
  sliderMarker: {
    height: 20, // Adjust marker size
    width: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 1, // Optional border for marker
    borderColor: colors.primary,
    shadowColor: '#000', // Optional shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sliderMarkerPressed: {
    transform: [{ scale: 1.1 }], // Enlarge marker when pressed
    // Add other pressed styles if desired
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm, // Use gap from design system
    width: '100%', // Ensure full width
    marginBottom: spacing.lg, // Added margin for bottom padding
  },
  clearButtonLayout: {
    flex: 1, // Takes half the width
    height: 44,
    borderWidth: 1,
    borderColor: colors.border, // Use token
    borderRadius: 22, // Match target
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl, // Use token
  },
  clearButtonText: {
    fontFamily: fonts.secondary, // Use token (assuming Inter)
    fontSize: fontSizes.sm, // Use token
    fontWeight: fontWeights.medium, // Use token
    lineHeight: lineHeights.sm, // Use token
    color: colors.secondary, // Use token (dark gray)
  },
  applyButtonLayout: {
    flex: 1,
    height: 44,
    borderRadius: 22, // Match target
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl, // Use token
    backgroundColor: colors.primary, // Use primary dark color token
  },
  applyButtonText: {
    fontFamily: fonts.secondary, // Use token (assuming Inter)
    fontSize: fontSizes.sm, // Use token
    fontWeight: fontWeights.medium, // Use token
    lineHeight: lineHeights.sm, // Use token
    color: colors.background.light, // Use token (light color)
  },
});
