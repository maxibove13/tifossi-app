import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius, layout } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import authService from '../_services/auth/authService';
import SubheaderClose from '../_components/common/SubheaderClose';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code: string; email: string }>();
  const { code, email } = params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    setError(null);

    if (!password.trim() || !confirmPassword.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!code) {
      setError('Código de restablecimiento no válido. Solicita un nuevo enlace.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.confirmPasswordReset(code, password);
      Alert.alert(
        'Contraseña Actualizada',
        'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer} testID="reset-password-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        <SubheaderClose title="Nueva Contraseña" onClose={handleClose} />

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <Text style={styles.infoText} testID="email-display">
              {email
                ? `Ingresa tu nueva contraseña para ${email}.`
                : 'Ingresa tu nueva contraseña.'}
            </Text>
            <Input
              placeholder="Nueva Contraseña"
              secureTextEntry
              value={password}
              testID="new-password-input"
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              error={
                error && (error.includes('6 caracteres') || error.includes('contraseña'))
                  ? error
                  : undefined
              }
              containerStyle={styles.inputSpacing}
            />
            <Input
              placeholder="Confirmar Contraseña"
              secureTextEntry
              value={confirmPassword}
              testID="confirm-password-input"
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError(null);
              }}
              error={error && error.includes('coinciden') ? error : undefined}
              containerStyle={styles.inputSpacing}
            />
            {error &&
              !error.includes('6 caracteres') &&
              !error.includes('coinciden') &&
              !error.includes('contraseña') && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </ScrollView>
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
          onPress={handleResetPassword}
          activeOpacity={0.7}
          disabled={isSubmitting}
          testID="submit-reset"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar Contraseña</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClose}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
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
    paddingTop: layout.subheaderScreenTop,
    paddingHorizontal: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    gap: spacing.lg,
  },
  infoText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputSpacing: {},
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
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
