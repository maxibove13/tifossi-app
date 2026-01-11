import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius, components, layout } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import { useAuthStore } from '../_stores/authStore';
import SubheaderClose from '../_components/common/SubheaderClose';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);

  const validateEmail = (text: string) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handlePasswordReset = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordReset(email);
      Alert.alert(
        'Solicitud Enviada',
        'Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/login'); // Fallback to login screen
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SubheaderClose title="Recuperar Contraseña" onClose={handleClose} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.infoText}>
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu
          contraseña.
        </Text>

        <Input
          placeholder="Correo Electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          error={error || undefined}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Primary Button */}
        <TouchableOpacity
          onPress={handlePasswordReset}
          activeOpacity={0.8}
          disabled={isSubmitting}
          style={styles.primaryButtonWrapper}
        >
          <LinearGradient
            colors={isSubmitting ? colors.button.disabledGradient : colors.button.defaultGradient}
            style={styles.primaryButton}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background.offWhite} />
            ) : (
              <Text style={styles.primaryButtonText}>Enviar Instrucciones</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClose}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
    paddingTop: layout.subheaderScreenTop,
    paddingHorizontal: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  infoText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    textAlign: 'center',
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
  secondaryButton: {
    width: '100%',
    height: components.button.height,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});
