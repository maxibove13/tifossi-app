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
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';
import AppleSignInButton from '../_components/ui/buttons/AppleSignInButton';
import AppleSignInHelpText from '../_components/auth/AppleSignInHelp';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apple Sign-In specific state
  const [appleError, setAppleError] = useState<string | null>(null);

  const {
    login,
    loginWithGoogle,
    loginWithApple,
    isLoading,
    error: authError,
  } = useAuthStore((state) => ({
    login: state.login,
    loginWithGoogle: state.loginWithGoogle,
    loginWithApple: state.loginWithApple,
    isLoading: state.isLoading,
    error: state.error,
  }));

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
      // Attempt login with Firebase-integrated auth service
      await login({ email, password });

      // If successful, navigate to profile
      router.replace('/(tabs)/profile');
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
      // Attempt Google login
      await loginWithGoogle();

      // If successful, navigate to profile
      router.replace('/(tabs)/profile');
    } catch (error: UnknownError) {
      // Handle Google login error
      setError(getErrorMessage(error) || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setAppleError(null);
    setIsSubmitting(true);

    try {
      // Attempt Apple login
      await loginWithApple();

      // If successful, navigate to profile
      router.replace('/(tabs)/profile');
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
                (error && (error.includes('correo') || error.includes('Por favor, completa'))) ||
                (authError && authError.includes('email'))
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
                (error &&
                  (error.includes('contraseña') || error.includes('Por favor, completa'))) ||
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

        {Platform.OS === 'ios' && (
          <>
            <AppleSignInButton
              onPress={handleAppleLogin}
              type="signin"
              disabled={isSubmitting || isLoading}
              loading={isSubmitting}
              style={styles.appleButton}
            />
            <AppleSignInHelpText context="login" showInline={true} style={styles.appleHelpText} />
            <View style={styles.spacing} />
          </>
        )}
        <TouchableOpacity
          style={[styles.googleButton, (isSubmitting || isLoading) && styles.disabledButton]}
          onPress={handleGoogleLogin}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/signup')}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <Text style={styles.secondaryButtonText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/forgot-password')}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <Text style={styles.secondaryButtonText}>¿Olvidaste tu contraseña?</Text>
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
  googleButton: {
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
  googleButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
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
  appleButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
  },
  appleHelpText: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  spacing: {
    height: spacing.md,
  },
});
