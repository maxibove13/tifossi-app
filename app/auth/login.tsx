import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';
// Apple components removed - using custom button for consistency
import { APPLE_AUTH_ERRORS_ES } from '../_types/auth';
import { UnknownError } from '../_types/ui';

// Helper function to extract error message from unknown error types
function getErrorMessage(error: UnknownError): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Error desconocido. Intenta nuevamente.';
}

export default function LoginScreen() {
  const { emailVerified, verificationError } = useLocalSearchParams<{
    emailVerified?: string;
    verificationError?: string;
  }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(emailVerified === 'true');
  const [showVerificationError, setShowVerificationError] = useState(!!verificationError);

  // Apple Sign-In specific state
  const [appleError, setAppleError] = useState<string | null>(null);

  // Use separate selectors to avoid infinite render loop
  const login = useAuthStore((state: any) => state.login);
  const loginWithGoogle = useAuthStore((state: any) => state.loginWithGoogle);
  const loginWithApple = useAuthStore((state: any) => state.loginWithApple);
  const isLoading = useAuthStore((state: any) => state.isLoading);
  const authError = useAuthStore((state: any) => state.error);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    // Validate input fields
    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      setIsSubmitting(false);
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result.needsEmailVerification) {
        // Redirect to verification screen
        router.replace({
          pathname: '/auth/verification-code',
          params: { email },
        });
        return;
      }

      // Verified - return user to where they came from
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: UnknownError) {
      // Handle login error
      setError(getErrorMessage(error) || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithGoogle();

      if (result.needsEmailVerification) {
        router.replace({
          pathname: '/auth/verification-code',
          params: { email: result.user?.email || '' },
        });
        return;
      }

      // Verified - return user to where they came from
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: UnknownError) {
      const errorMessage = getErrorMessage(error);

      // Check if user cancelled - don't show error
      if (
        errorMessage.includes('cancel') ||
        errorMessage.includes('Cancel') ||
        errorMessage.includes('cancelado') ||
        errorMessage.includes('dismissed')
      ) {
        return;
      }

      setError(errorMessage || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setAppleError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithApple();

      if (result.needsEmailVerification) {
        router.replace({
          pathname: '/auth/verification-code',
          params: { email: result.user?.email || '' },
        });
        return;
      }

      // Verified - return user to where they came from
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: UnknownError) {
      const errorObj = error && typeof error === 'object' ? (error as any) : {};
      const errorCode = errorObj?.code || errorObj?.name || 'unknown-error';
      const errorMessage = getErrorMessage(error) || APPLE_AUTH_ERRORS_ES.ERROR_UNKNOWN;

      // Check if user cancelled - don't show error
      if (
        errorCode.includes('canceled') ||
        errorCode.includes('cancel') ||
        errorMessage.includes('cancelado')
      ) {
        return;
      }

      // Set error state
      setAppleError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if no screen to go back to, e.g. navigate to a default screen
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Iniciar Sesión</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {/* Email verified success banner */}
            {showVerifiedBanner && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>
                  Correo verificado. Ahora puedes iniciar sesión.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowVerifiedBanner(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <CloseIcon width={16} height={16} stroke={colors.success} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* Verification error banner */}
            {showVerificationError && verificationError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  {verificationError.includes('expired')
                    ? 'El enlace de verificación ha expirado. Inicia sesión para reenviar.'
                    : verificationError.includes('invalid')
                      ? 'El enlace de verificación no es válido. Inicia sesión para reenviar.'
                      : `Error de verificación: ${verificationError}`}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowVerificationError(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <CloseIcon width={16} height={16} stroke={colors.error} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* General error message - shown once at top */}
            {error && error.includes('Por favor, completa') && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Input
              placeholder="Correo Electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              error={
                (error && error.includes('correo')) || (authError && authError.includes('email'))
                  ? (error ?? authError ?? undefined)
                  : undefined
              }
              containerStyle={styles.inputSpacing}
            />
            <Input
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              error={
                (error && error.includes('contraseña')) ||
                (authError && authError.includes('password'))
                  ? (error ?? authError ?? undefined)
                  : undefined
              }
              containerStyle={styles.inputSpacing}
            />
            {(error &&
              !error.includes('correo') &&
              !error.includes('contraseña') &&
              !error.includes('Por favor, completa')) ||
            (authError && !authError.includes('email') && !authError.includes('password')) ? (
              <Text style={styles.errorText}>{error || authError}</Text>
            ) : null}
            {appleError && <Text style={styles.errorText}>{appleError}</Text>}
          </View>
        </ScrollView>
      </View>
      <View style={styles.actionButtonsContainer}>
        {/* Primary action: Email/Password login */}
        <TouchableOpacity
          style={[styles.primaryButton, (isSubmitting || isLoading) && styles.disabledButton]}
          onPress={handleLogin}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social logins grouped together */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
            onPress={handleAppleLogin}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.socialButtonText}>Continuar con Apple</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
          onPress={handleGoogleLogin}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <Text style={styles.socialButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* Secondary links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  inputSpacing: {},
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    flex: 1,
    color: colors.success,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    marginRight: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    marginRight: spacing.sm,
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
  disabledButton: {
    opacity: 0.7,
    backgroundColor: colors.background.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    paddingHorizontal: spacing.md,
  },
  socialButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  socialButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  linksContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  linkText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
