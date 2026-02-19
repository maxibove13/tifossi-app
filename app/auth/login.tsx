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
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius, components, layout } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';
import SubheaderClose from '../_components/common/SubheaderClose';
import { APPLE_AUTH_ERRORS_ES } from '../_types/auth';
import { UnknownError } from '../_types/ui';

const GoogleLogo = require('../../assets/icons/google-logo.png');
const AppleLogo = require('../../assets/icons/apple-logo.png');

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
  const [appleError, setAppleError] = useState<string | null>(null);

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
        router.replace({
          pathname: '/auth/verify-email',
          params: { email },
        });
        return;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: UnknownError) {
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
          pathname: '/auth/verify-email',
          params: { email: result.user?.email || '' },
        });
        return;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: UnknownError) {
      const errorMessage = getErrorMessage(error);

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
          pathname: '/auth/verify-email',
          params: { email: result.user?.email || '' },
        });
        return;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: UnknownError) {
      const errorObj = error && typeof error === 'object' ? (error as any) : {};
      const errorCode = errorObj?.code || errorObj?.name || 'unknown-error';
      const errorMessage = getErrorMessage(error) || APPLE_AUTH_ERRORS_ES.ERROR_UNKNOWN;

      if (
        errorCode.includes('canceled') ||
        errorCode.includes('cancel') ||
        errorMessage.includes('cancelado')
      ) {
        return;
      }

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
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SubheaderClose title="Iniciar Sesión" onClose={handleClose} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Form Inputs */}
        <View style={styles.inputsContainer}>
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
          />
        </View>

        {/* General error message */}
        {((error &&
          !error.includes('correo') &&
          !error.includes('contraseña') &&
          !error.includes('Por favor, completa')) ||
          (authError && !authError.includes('email') && !authError.includes('password'))) && (
          <Text style={styles.errorText}>{error || authError}</Text>
        )}
        {appleError && <Text style={styles.errorText}>{appleError}</Text>}

        {/* Primary Button */}
        <TouchableOpacity
          onPress={handleLogin}
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
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => router.push('/auth/forgot-password')}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <View style={styles.underlinedTextContainer}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            <View style={styles.textUnderline} />
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
            <Image source={GoogleLogo} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
              onPress={handleAppleLogin}
              activeOpacity={0.7}
              disabled={isSubmitting || isLoading}
            >
              <Text style={styles.socialButtonText}>Continuar con Apple</Text>
              <Image source={AppleLogo} style={{ width: 15, height: 20 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Register Section */}
        <View style={styles.registerSection}>
          <Text style={styles.registerPromptText}>¿No tienes una cuenta?</Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
            style={{ marginTop: spacing.sm }}
          >
            <View style={styles.underlinedTextContainer}>
              <Text style={styles.registerLinkText}>Regístrate</Text>
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
    paddingTop: layout.subheaderScreenTop,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 139,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    marginRight: spacing.sm,
  },
  inputsContainer: {
    gap: spacing.sm,
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
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
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
  registerSection: {
    alignItems: 'center',
  },
  registerPromptText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: colors.tertiary,
  },
  registerLinkText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.tertiary,
  },
});
