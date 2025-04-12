import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import CloseIcon from '../../../../../assets/icons/close.svg';
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography';

interface OverlayDeleteConfirmationProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function OverlayDeleteConfirmation({
  isVisible,
  onClose,
  onConfirm,
}: OverlayDeleteConfirmationProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (isVisible) {
      // Start fade-in and scale-up animations when overlay becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when overlay is hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [isVisible, fadeAnim, scaleAnim]);

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal transparent visible={isVisible} onRequestClose={onClose} animationType="none">
      <View style={styles.modalContainer}>
        {/* Animated overlay background that can be tapped to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Animated container that scales up */}
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>¿Eliminar producto?</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon width={20} height={20} stroke={colors.primary} strokeWidth={1.2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.warningText}>Esta acción es irreversible.</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
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
  warningText: TextStyle;
  actionButtons: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  deleteButton: ViewStyle;
  deleteButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.background.light,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    width: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: 24,
    fontWeight: fontWeights.regular,
    lineHeight: 32,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  content: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  warningText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    color: colors.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    fontFamily: 'Inter',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: colors.background.light,
  },
});

export default OverlayDeleteConfirmation;
