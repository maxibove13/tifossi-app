import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = useAuthStore((state) => state.register);
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
      // Register the user with our auth store
      await register({ name, email, password });

      // After successful signup, redirect to verification code screen
      // passing the email as a parameter
      router.replace({
        pathname: '/auth/verification-code',
        params: { email },
      });
    } catch (error: any) {
      // Handle signup error
      setError(error.message || 'Error al crear la cuenta o el correo ya está en uso.');
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
            <Input
              placeholder="Nombre Completo"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              error={
                error && (error.includes('nombre') || error.includes('Por favor, completa'))
                  ? error
                  : undefined
              }
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
              error={
                error && (error.includes('correo') || error.includes('Por favor, completa'))
                  ? error
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
                error &&
                ((error.includes('contraseña') && !error.includes('coinciden')) ||
                  error.includes('Por favor, completa'))
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
              error={
                error &&
                (error.includes('contraseñas no coinciden') ||
                  error.includes('Por favor, completa'))
                  ? error
                  : undefined
              }
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
          </View>
        </ScrollView>
      </View>
      <View style={styles.actionButtonsContainer}>
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
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
        >
          <Text style={styles.secondaryButtonText}>¿Ya tienes cuenta? Inicia Sesión</Text>
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
