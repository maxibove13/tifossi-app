import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';

export default function VerifyEmailScreen() {
  const [isResending, setIsResending] = useState(false);
  const user = useAuthStore((state) => state.user);
  const email = user?.email || '';

  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        'Código Enviado',
        'Se ha enviado un nuevo código de verificación a tu dirección de email.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo enviar el código de verificación. Intenta nuevamente.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/auth/login');
  };

  const handleClose = () => {
    // For now, just go to the login screen since we can't
    // truly proceed without verification
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verificar Email</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.emailIconContainer}>
            <Text style={styles.emailIcon}>✉️</Text>
          </View>

          <Text style={styles.title}>Verifica tu correo electrónico</Text>

          <Text style={styles.description}>Hemos enviado un correo de verificación a:</Text>

          <Text style={styles.emailText}>{email}</Text>

          <Text style={styles.instructions}>
            Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu
            cuenta. Si no encuentras el correo, revisa también tu carpeta de spam.
          </Text>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>¿No recibiste el correo?</Text>
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.resendLoader} />
            ) : (
              <TouchableOpacity onPress={handleResendEmail}>
                <Text style={styles.resendLink}>Reenviar correo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/auth/verification-code',
              params: { email },
            })
          }
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Ingresar Código</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoToLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.background.light,
    justifyContent: 'space-between',
  },
  mainContainer: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  emailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emailIcon: {
    fontSize: 40,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  instructions: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resendText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    marginRight: spacing.xs,
  },
  resendLink: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  resendLoader: {
    marginLeft: spacing.xs,
  },
  actionButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.background.light,
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xl,
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
});
