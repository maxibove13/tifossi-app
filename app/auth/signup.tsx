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
import { router, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
// Apple components removed - using custom button for consistency
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';
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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apple Sign-In specific state
  const [appleError, setAppleError] = useState<string | null>(null);

  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loginWithApple = useAuthStore((state) => state.loginWithApple);
  const isLoading = useAuthStore((state) => state.isLoading);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleSignup = async () => {
    setError(null);
    setIsSubmitting(true);

    // Validate all required fields
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Por favor, completa todos los campos.');
      setIsSubmitting(false);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setIsSubmitting(false);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsSubmitting(false);
      return;
    }

    // Validate terms acceptance
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      setIsSubmitting(false);
      return;
    }

    // Minimum password length check
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await register({ name, email, password });

      if (result.needsEmailVerification) {
        // After successful signup, redirect to verification code screen
        router.replace({
          pathname: '/auth/verification-code',
          params: { email },
        });
        return;
      }

      // Verified (rare for new signups) - go to home
      router.replace('/(tabs)');
    } catch (error: UnknownError) {
      // Handle signup error
      setError(getErrorMessage(error) || 'Error al crear la cuenta o el correo ya está en uso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignUp = async () => {
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

      // Also set general error for fallback display
      if (errorCode.includes('email_already_in_use')) {
        setError('Este email ya está registrado. ¿Deseas iniciar sesión?');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
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

      setError(errorMessage || 'Error al registrarse con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)'); // Fallback route
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crear Cuenta</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {/* General error message - shown once at top, not under each input */}
            {error && error.includes('Por favor, completa') && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Input
              placeholder="Nombre Completo"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              error={error && error.includes('nombre') ? error : undefined}
              containerStyle={styles.inputSpacing}
            />
            <Input
              placeholder="Correo Electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              error={error && error.includes('correo') ? error : undefined}
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
                error && error.includes('contraseña') && !error.includes('coinciden')
                  ? error
                  : undefined
              }
              containerStyle={styles.inputSpacing}
            />
            <Input
              placeholder="Confirmar Contraseña"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError(null);
              }}
              error={error && error.includes('contraseñas no coinciden') ? error : undefined}
              containerStyle={styles.inputSpacing}
            />

            {/* Terms and Conditions Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptedTerms ? styles.checkboxChecked : {}]}>
                  {acceptedTerms && (
                    <Feather name="check" size={14} color={colors.background.light} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                He leído y acepto los{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/legal/terms')}>
                  Términos y Condiciones
                </Text>{' '}
                y la{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy')}>
                  Política de Privacidad
                </Text>
              </Text>
            </View>

            {error &&
            !error.includes('nombre') &&
            !error.includes('correo') &&
            !error.includes('contraseña') &&
            !error.includes('coinciden') &&
            !error.includes('Por favor, completa') &&
            !error.includes('términos') ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {error && error.includes('términos') ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {appleError && <Text style={styles.errorText}>{appleError}</Text>}
          </View>
        </ScrollView>
      </View>
      <View style={styles.actionButtonsContainer}>
        {/* Primary action: Email/Password signup */}
        <TouchableOpacity
          style={[styles.primaryButton, (isSubmitting || isLoading) && styles.disabledButton]}
          onPress={handleSignup}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social signups grouped together */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
            onPress={handleAppleSignUp}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.socialButtonText}>Continuar con Apple</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
          onPress={handleGoogleSignUp}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <Text style={styles.socialButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* Secondary link */}
        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia Sesión</Text>
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
  inputSpacing: {
    // marginBottom: spacing.sm, // Handled by gap in formContainer
  },
  // Terms and Conditions styles
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  checkboxContainer: {
    marginRight: spacing.sm,
    marginTop: 2, // Align with first line of text
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  disabledButton: {
    opacity: 0.7,
    backgroundColor: colors.background.medium,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.background.light,
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
