import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changePassword = useAuthStore((state) => state.changePassword);
  const isChangingPassword = useAuthStore((state) => state.isChangingPassword);
  const authError = useAuthStore((state) => state.error);

  const validateForm = (): boolean => {
    setError(null);

    // Check if all fields are filled
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setError('Por favor, completa todos los campos.');
      return false;
    }

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return false;
    }

    // Check if current and new password are different
    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return false;
    }

    // Check if new password meets minimum requirements (min 8 chars)
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the Firebase-integrated changePassword function
      await changePassword({
        currentPassword,
        newPassword,
      });

      Alert.alert('Contraseña Actualizada', 'Tu contraseña ha sido cambiada exitosamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      setError(error.message || 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        {/* Custom Header - Matching existing auth screens */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <Input
              placeholder="Contraseña Actual"
              secureTextEntry
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (error) setError(null);
              }}
              error={
                (error && error.includes('actual')) || (authError && authError.includes('current'))
                  ? (error ?? authError ?? undefined)
                  : undefined
              }
              containerStyle={styles.inputSpacing}
            />
            <Input
              placeholder="Nueva Contraseña"
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (error) setError(null);
              }}
              error={
                error && (error.includes('nueva') || error.includes('8 caracteres'))
                  ? error
                  : undefined
              }
              containerStyle={styles.inputSpacing}
            />
            <Input
              placeholder="Confirmar Nueva Contraseña"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={(text) => {
                setConfirmNewPassword(text);
                if (error) setError(null);
              }}
              error={error && error.includes('coinciden') ? error : undefined}
              containerStyle={styles.inputSpacing}
            />
            {((error &&
              !error.includes('actual') &&
              !error.includes('nueva') &&
              !error.includes('coinciden') &&
              !error.includes('8 caracteres')) ||
              (authError && !authError.includes('current') && !authError.includes('password'))) && (
              <Text style={styles.errorText}>{error || authError}</Text>
            )}
          </View>
        </ScrollView>
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isSubmitting || isChangingPassword) && styles.disabledButton,
          ]}
          onPress={handleChangePassword}
          activeOpacity={0.7}
          disabled={isSubmitting || isChangingPassword}
        >
          {isSubmitting || isChangingPassword ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClose}
          activeOpacity={0.7}
          disabled={isSubmitting || isChangingPassword}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles matching other auth screens for consistency
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
    // Gap handled by container
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
    opacity: 0.6,
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
