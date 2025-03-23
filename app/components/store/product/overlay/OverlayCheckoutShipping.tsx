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
  TouchableWithoutFeedback
} from 'react-native';
import CloseIcon from '../../../../../assets/icons/close.svg';
import ChevronRight from '../../../../../assets/icons/chevron_right.svg';
import ChevronRightGreen from '../../../../../assets/icons/chevron_right_green.svg';
import OverlayCheckoutQuantity from './OverlayCheckoutQuantity';

// Import style tokens
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface OverlayCheckoutShippingProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectSize: () => void;
  onSelectQuantity: (quantity: number) => void;
  initialQuantity?: number;
}

export default function OverlayCheckoutShipping({
  isVisible,
  onClose,
  onSelectSize,
  onSelectQuantity,
  initialQuantity = 1
}: OverlayCheckoutShippingProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [isQuantityOverlayVisible, setIsQuantityOverlayVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);

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

  const handleSelectQuantity = () => {
    // Show the quantity overlay
    setIsQuantityOverlayVisible(true);
  };

  const handleQuantitySave = (quantity: number) => {
    setSelectedQuantity(quantity);
    // Just update the quantity state without calling onSelectQuantity yet
    // User will return to this overlay after selecting a quantity
  };

  return (
    <>
      <Modal
        transparent
        visible={isVisible && !isQuantityOverlayVisible}
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
              <Text style={styles.title}>Agregar al carrito</Text>
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
              {/* Size Selection Row */}
              <TouchableOpacity
                style={styles.selectionRow}
                onPress={() => {
                  onSelectSize();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionTitle}>Talle</Text>
                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>Seleccionar</Text>
                  <ChevronRight width={8} height={14} />
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
                      <Text style={[styles.actionText, styles.doneText]}>
                        Listo
                      </Text>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.10,
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
}); 