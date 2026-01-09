import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../_styles/colors';
import { spacing, radius, components } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';
import { APPLE_AUTH_ERRORS_ES } from '../_types/auth';
import { UnknownError } from '../_types/ui';

const GoogleLogo = require('../../assets/icons/google-logo.png');
const AppleLogo = require('../../assets/icons/apple-logo.png');

// Helper function to extract error message from unknown error types
function getErrorMessage(error: UnknownError): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Error desconocido. Intenta nuevamente.';
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crear Cuenta</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Inputs */}
        <View style={styles.inputsContainer}>
          <Input
            placeholder="Nombre Completo"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            error={error && error.includes('nombre') ? error : undefined}
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
          />
        </View>

        {/* Terms and Conditions Checkbox */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, acceptedTerms ? styles.checkboxChecked : {}]}>
              {acceptedTerms && <Feather name="check" size={14} color={colors.background.light} />}
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

        {/* General error message */}
        {((error &&
          !error.includes('nombre') &&
          !error.includes('correo') &&
          !error.includes('contraseña') &&
          !error.includes('coinciden')) ||
          appleError) && <Text style={styles.errorText}>{error || appleError}</Text>}

        {/* Primary Button */}
        <TouchableOpacity
          onPress={handleSignup}
          activeOpacity={0.8}
          disabled={isSubmitting || isLoading}
          style={styles.primaryButtonWrapper}
        >
          <LinearGradient
            colors={
              isSubmitting || isLoading
                ? colors.button.disabledGradient
                : colors.button.defaultGradient
            }
            style={styles.primaryButton}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator size="small" color={colors.background.offWhite} />
            ) : (
              <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
            onPress={handleGoogleSignUp}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
            <Image source={GoogleLogo} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
              onPress={handleAppleSignUp}
              activeOpacity={0.7}
              disabled={isSubmitting || isLoading}
            >
              <Text style={styles.socialButtonText}>Continuar con Apple</Text>
              <Image source={AppleLogo} style={{ width: 15, height: 20 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={styles.loginPromptText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
            style={{ marginTop: spacing.sm }}
          >
            <View style={styles.underlinedTextContainer}>
              <Text style={styles.loginLinkText}>Inicia Sesión</Text>
              <View style={styles.textUnderline} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.offWhite,
    borderBottomWidth: 0.4,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xxxl,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  inputsContainer: {
    gap: spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: spacing.sm,
    marginTop: 2,
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
  },
  primaryButtonWrapper: {
    width: '100%',
  },
  primaryButton: {
    height: components.button.height,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.background.offWhite,
  },
  dividerContainer: {
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  socialButtonsContainer: {
    gap: spacing.sm,
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: components.button.height,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  socialButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginSection: {
    alignItems: 'center',
  },
  loginPromptText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: colors.tertiary,
  },
  loginLinkText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.tertiary,
  },
  underlinedTextContainer: {
    alignSelf: 'center',
  },
  textUnderline: {
    height: 1,
    backgroundColor: colors.tertiary,
    marginTop: 2,
  },
});
