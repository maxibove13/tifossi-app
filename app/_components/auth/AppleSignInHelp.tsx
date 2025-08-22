import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../_styles/typography';

interface AppleSignInHelpProps {
  context: 'login' | 'signup';
  showInline?: boolean;
  style?: any;
}

export function AppleSignInHelpText({ context, showInline = false, style }: AppleSignInHelpProps) {
  const [showModal, setShowModal] = useState(false);

  const getContextText = () => {
    switch (context) {
      case 'login':
        return {
          title: '¿Por qué usar Apple Sign-In?',
          description:
            'Apple Sign-In te permite acceder a tu cuenta de forma segura usando tu ID de Apple.',
        };
      case 'signup':
        return {
          title: '¿Por qué crear cuenta con Apple?',
          description:
            'Crea tu cuenta en segundos usando tu ID de Apple. Es rápido, seguro y protege tu privacidad.',
        };
      default:
        return {
          title: 'Apple Sign-In',
          description: 'Inicia sesión de forma segura con tu ID de Apple.',
        };
    }
  };

  const contextInfo = getContextText();

  const renderFullHelp = () => (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{contextInfo.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Apple Logo and Description */}
              <View style={styles.heroSection}>
                <View style={styles.appleIconContainer}>
                  <Text style={styles.appleIcon}></Text>
                </View>
                <Text style={styles.description}>{contextInfo.description}</Text>
              </View>

              {/* Simple benefits list */}
              <View style={styles.benefitsSection}>
                <Text style={styles.sectionTitle}>Ventajas:</Text>
                <View style={styles.benefitItem}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.benefitText}>Acceso rápido y seguro</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="shield" size={16} color={colors.success} />
                  <Text style={styles.benefitText}>Apple protege tu privacidad</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Feather name="lock" size={16} color={colors.success} />
                  <Text style={styles.benefitText}>Sin contraseñas adicionales</Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.gotItButton}
                onPress={() => setShowModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.gotItButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  const renderInlineHelp = () => (
    <View style={[styles.inlineContainer, style]}>
      <View style={styles.inlineContent}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={styles.inlineText}>
          Apple protege tu privacidad. Puedes ocultar tu email si lo deseas.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.learnMoreButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.learnMoreText}>Saber más</Text>
        <Feather name="info" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {showInline ? (
        renderInlineHelp()
      ) : (
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <Feather name="help-circle" size={16} color={colors.primary} />
          <Text style={styles.helpButtonText}>¿Qué es Apple Sign-In?</Text>
        </TouchableOpacity>
      )}
      {renderFullHelp()}
    </>
  );
}

const styles = StyleSheet.create({
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.primary,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    flex: 1,
    padding: spacing.lg,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  gotItButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  gotItButtonText: {
    color: colors.background.light,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
  },

  // Content sections
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appleIconContainer: {
    marginBottom: spacing.md,
  },
  appleIcon: {
    fontSize: 32,
    color: colors.primary,
  },
  description: {
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: lineHeights.md,
  },

  // Benefits section
  benefitsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.primary,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    color: colors.primary,
    marginLeft: spacing.sm,
    lineHeight: lineHeights.sm,
  },

  // Inline help styles
  inlineContainer: {
    backgroundColor: '#F8F9FF',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  inlineText: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    color: colors.secondary,
    marginLeft: spacing.sm,
    lineHeight: lineHeights.sm,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    color: colors.primary,
    marginRight: spacing.xs,
    textDecorationLine: 'underline',
  },

  // Help button styles
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  helpButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    color: colors.primary,
    marginLeft: spacing.xs,
    textDecorationLine: 'underline',
  },
});

export default AppleSignInHelpText;
