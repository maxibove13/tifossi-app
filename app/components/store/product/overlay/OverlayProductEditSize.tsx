import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  TouchableWithoutFeedback
} from 'react-native';

// Import shared components
import RadioButton from '../../../../components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { fontSizes, lineHeights } from '../../../../styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

// Available size options
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'];

interface OverlayProductEditSizeProps {
  isVisible: boolean;
  onClose: () => void;
  onGoBack: () => void;
  onSave: (size: string) => void;
  initialSize?: string;
}

export default function OverlayProductEditSize({
  isVisible,
  onClose,
  onGoBack,
  onSave,
  initialSize = ''
}: OverlayProductEditSizeProps) {
  // State for selected size
  const [selectedSize, setSelectedSize] = useState(initialSize);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  // Reset selected size when overlay opens with initialSize
  useEffect(() => {
    if (isVisible && initialSize) {
      setSelectedSize(initialSize);
    }
  }, [isVisible, initialSize]);

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

  // Handle size selection
  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
  };

  // Handle save action
  const handleSave = () => {
    onSave(selectedSize);
    onGoBack(); // Go back to shipping overlay instead of closing completely
  };

  // Handle size guide press
  const handleSizeGuidePress = () => {
    // Implement size guide functionality here
    console.log("Size guide pressed");
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
            <Text style={styles.title}>Cambiar talle</Text>
            <TouchableOpacity
              onPress={handleSizeGuidePress}
              activeOpacity={0.7}
            >
              <Text style={styles.sizeGuideText}>Tabla de medidas</Text>
            </TouchableOpacity>
          </View>

          {/* Size Selection */}
          <View style={styles.sizeSelectionContainer}>
            {SIZE_OPTIONS.map((size) => (
              <TouchableOpacity
                key={size}
                style={styles.sizeOption}
                onPress={() => handleSelectSize(size)}
                activeOpacity={0.7}
              >
                <Text style={styles.sizeOptionText}>{size}</Text>
                <RadioButton selected={selectedSize === size} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={onGoBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>
            
            {/* Save button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!selectedSize}
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
    shadowColor: "#000",
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
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: fontSizes.md,
    fontWeight: '400',
    lineHeight: lineHeights.md,
    color: '#575757',
  },
  sizeGuideText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.xs,
    fontWeight: '400',
    lineHeight: fontSizes.xs * 1.333,
    color: '#575757',
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