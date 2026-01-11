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
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../_styles/colors';
import { spacing, radius, layout } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import { useAuthStore } from '../_stores/authStore';
import SubheaderClose from '../_components/common/SubheaderClose';
import { UnknownError } from '../_types/ui';

function getErrorMessage(error: UnknownError): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Error desconocido. Intenta nuevamente.';
}

export default function VerificationCodeScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';

  const [isResending, setIsResending] = useState(false);
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        'Correo Enviado',
        'Se ha enviado un nuevo correo de verificación. Por favor revisa tu bandeja de entrada.'
      );
    } catch (error: UnknownError) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        <SubheaderClose title="Verificar Email" onClose={handleClose} />

        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Feather name="mail" size={48} color={colors.primary} />
          </View>

          <Text style={styles.title}>Revisa tu correo</Text>

          <Text style={styles.description}>Hemos enviado un enlace de verificación a:</Text>

          <Text style={styles.emailText}>{email}</Text>

          <Text style={styles.instructions}>
            Haz clic en el enlace del correo para verificar tu cuenta. Si no lo encuentras, revisa
            tu carpeta de spam.
          </Text>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>No recibiste el correo?</Text>
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.resendLoader} />
            ) : (
              <TouchableOpacity onPress={handleResendEmail}>
                <Text style={styles.resendLink}>Reenviar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.7}>
          <Text style={styles.primaryButtonText}>Continuar</Text>
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
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  instructions: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
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
});
