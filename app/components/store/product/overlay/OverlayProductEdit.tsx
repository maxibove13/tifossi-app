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
import CloseIcon from '../../../../../assets/icons/close.svg';
import TrashIcon from '../../../../../assets/icons/trash_icon.svg';
import ChevronRightBlue from '../../../../../assets/icons/chevron_right_blue.svg';
import ChevronRightGreen from '../../../../../assets/icons/chevron_right_green.svg';
import OverlayCheckoutQuantity from './OverlayCheckoutQuantity';
import OverlayProductEditSize from './OverlayProductEditSize';
import OverlayDeleteConfirmation from './OverlayDeleteConfirmation';
import { Product } from '../../../../types/product';

// Import style tokens
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

interface OverlayProductEditProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (size: string, quantity: number) => void;
  onRemove: () => void;
  initialQuantity: number;
  initialSize: string;
  product?: Product;
}

// Add the component definition back
function OverlayProductEdit({
  // Changed to function declaration
  isVisible,
  onClose,
  onSave,
  onRemove,
  initialQuantity,
  initialSize,
  product,
}: OverlayProductEditProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [isQuantityOverlayVisible, setIsQuantityOverlayVisible] = useState(false);
  const [isSizeOverlayVisible, setIsSizeOverlayVisible] = useState(false);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);
  const [selectedSize, setSelectedSize] = useState(initialSize);

  // Update local state if initial props change while overlay is open
  useEffect(() => {
    setSelectedQuantity(initialQuantity);
    setSelectedSize(initialSize);
  }, [initialQuantity, initialSize]);

  useEffect(() => {
    if (isVisible) {
      // Reset state when becoming visible
      setSelectedQuantity(initialQuantity);
      setSelectedSize(initialSize);
      // Start fade-in and slide-up animations
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
      // Reset overlay visibility states
      setIsQuantityOverlayVisible(false);
      setIsSizeOverlayVisible(false);
      setIsDeleteConfirmationVisible(false);
    }
  }, [isVisible, fadeAnim, slideAnim, initialQuantity, initialSize]);

  const handleOpenQuantityOverlay = () => {
    setIsQuantityOverlayVisible(true);
  };

  const handleQuantitySave = (quantity: number) => {
    setSelectedQuantity(quantity);
    // Keep user on this overlay
    setIsQuantityOverlayVisible(false);
  };

  const handleOpenSizeOverlay = () => {
    setIsSizeOverlayVisible(true);
  };

  const handleSizeSave = (size: string) => {
    setSelectedSize(size);
    // Keep user on this overlay
    setIsSizeOverlayVisible(false);
  };

  const handleSave = () => {
    onSave(selectedSize, selectedQuantity);
    onClose();
  };

  const handleShowDeleteConfirmation = () => {
    setIsDeleteConfirmationVisible(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmationVisible(false);
  };

  const handleConfirmDelete = () => {
    // This will first close the delete confirmation overlay
    setIsDeleteConfirmationVisible(false);
    // Then call the onRemove prop passed from parent
    onRemove();
    // Finally close the edit overlay
    onClose();
  };

  // Determine if main overlay should be visible
  const isMainOverlayVisible =
    isVisible && !isQuantityOverlayVisible && !isSizeOverlayVisible && !isDeleteConfirmationVisible;

  // Flags to check if size or quantity has been changed from initial
  const hasSizeChanged = selectedSize !== initialSize;
  const hasQuantityChanged = selectedQuantity !== initialQuantity;

  return (
    <>
      <Modal
        transparent
        visible={isMainOverlayVisible}
        onRequestClose={onClose}
        animationType="none"
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Editar</Text>
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
                  {hasSizeChanged ? (
                    <>
                      <Text style={[styles.changeActionText, styles.doneText]}>Listo</Text>
                      <ChevronRightGreen width={8} height={14} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.changeActionText}>Cambiar</Text>
                      <ChevronRightBlue width={8} height={14} />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Quantity Selection Row */}
              <TouchableOpacity
                style={styles.selectionRow}
                onPress={handleOpenQuantityOverlay}
                activeOpacity={0.7}
              >
                <Text style={styles.selectionTitle}>Cantidad</Text>
                <View style={styles.actionButton}>
                  {hasQuantityChanged ? (
                    <>
                      <Text style={[styles.changeActionText, styles.doneText]}>Listo</Text>
                      <ChevronRightGreen width={8} height={14} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.changeActionText}>Cambiar</Text>
                      <ChevronRightBlue width={8} height={14} />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.trashButton}
                onPress={handleShowDeleteConfirmation}
                activeOpacity={0.7}
              >
                <TrashIcon width={24} height={24} stroke={colors.primary} strokeWidth={1.2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Quantity Overlay */}
      <OverlayCheckoutQuantity
        isVisible={isQuantityOverlayVisible}
        onClose={onClose} // Close main overlay if this is closed
        onGoBack={() => setIsQuantityOverlayVisible(false)} // Go back to main edit overlay
        onSave={handleQuantitySave}
        initialQuantity={selectedQuantity}
      />

      {/* Size Overlay */}
      <OverlayProductEditSize
        isVisible={isSizeOverlayVisible}
        onClose={onClose} // Close main overlay if this is closed
        onGoBack={() => setIsSizeOverlayVisible(false)} // Go back to main edit overlay
        onSave={handleSizeSave}
        initialSize={selectedSize}
        productSizes={product?.sizes}
      />

      {/* Delete Confirmation Overlay */}
      <OverlayDeleteConfirmation
        isVisible={isDeleteConfirmationVisible}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

// Define a type for the styles for clarity
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
  changeActionText: TextStyle;
  doneText: TextStyle;
  actionButtons: ViewStyle;
  trashButton: ViewStyle;
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
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
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
    marginBottom: spacing.xl + spacing.md,
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
  changeActionText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: '#176BAD',
  },
  doneText: {
    color: '#367C39',
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.lg,
    alignItems: 'center',
  },
  trashButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.dark,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.background.light,
  },
});

// Add default export to fix router warnings and allow default import
export default OverlayProductEdit;
