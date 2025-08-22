import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import CloseIcon from '../../assets/icons/close.svg';
import { useAuthStore } from '../_stores/authStore';
import { UnknownError } from '../_types/ui';

// Number of verification code input fields
const CODE_LENGTH = 6;

// Helper function to extract error message from unknown error types
function getErrorMessage(error: UnknownError): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Error desconocido. Intenta nuevamente.';
}

// Type for key press events
interface KeyPressEvent {
  nativeEvent: {
    key: string;
  };
}

export default function VerificationCodeScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';

  // Create refs for each input field to allow focus management
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);

  useEffect(() => {
    // Focus the first input on component mount
    if (inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, []);

  const handleChangeCode = (text: string, index: number) => {
    setError(null);

    // Only allow numeric characters
    if (!/^\d*$/.test(text)) return;

    // Update the code state
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // If input is empty, focus previous field (except for first field)
    if (text === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }

    // If input has a value, move to next field (except for last field)
    if (text !== '' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If this was the last field and all fields are filled, submit the code
    if (index === CODE_LENGTH - 1 && text !== '' && !newCode.includes('')) {
      Keyboard.dismiss();
      handleVerify();
    }
  };

  const handleKeyPress = (event: KeyPressEvent, index: number) => {
    // If delete/backspace is pressed and current field is empty, focus previous field
    if (event.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (code.includes('')) {
      setError('Por favor ingresa el código completo');
      return;
    }

    setIsVerifying(true);
    const verificationCode = code.join('');

    try {
      await verifyEmail(verificationCode);
      // Navigate to success screen on successful verification
      router.replace('/auth/verify-success');
    } catch (error: UnknownError) {
      // Handle different error messages in a user-friendly way
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Invalid verification code format') {
        setError('El código debe ser de 6 dígitos numéricos.');
      } else if (errorMessage === 'Invalid verification code') {
        setError('Código incorrecto. Por favor verifica e intenta nuevamente.');
      } else {
        // For any other errors or network issues
        setError('Error de verificación. Por favor intenta nuevamente.');
      }

      // Vibrate device for haptic feedback (optional enhancement)
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          const ReactNative = require('react-native');
          ReactNative.Vibration?.vibrate(300);
        } catch {
          // Ignore if vibration is not available
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        'Código Enviado',
        'Se ha enviado un nuevo código de verificación a tu dirección de email.'
      );
    } catch (error: UnknownError) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.mainContainer}>
          {/* Custom Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Verificar Código</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>Ingresa el código de verificación</Text>

            <Text style={styles.description}>Hemos enviado un código de verificación a:</Text>

            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.codeInputContainer}>
              {Array(CODE_LENGTH)
                .fill(0)
                .map((_, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      code[index] ? styles.codeInputFilled : {},
                      error ? styles.codeInputError : {},
                    ]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={code[index]}
                    onChangeText={(text) => handleChangeCode(text, index)}
                    onKeyPress={(event) => handleKeyPress(event, index)}
                    testID={`code-input-${index}`}
                  />
                ))}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>¿No recibiste el código?</Text>
              {isResending ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.resendLoader}
                />
              ) : (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.resendLink}>Reenviar código</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleVerify}
          disabled={isVerifying || code.includes('')}
          activeOpacity={0.7}
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color={colors.background.light} />
          ) : (
            <Text style={styles.primaryButtonText}>Verificar</Text>
          )}
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing.xxl,
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
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    color: colors.primary,
    backgroundColor: colors.background.light,
    paddingHorizontal: 0,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.background.medium,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  errorContainer: {
    backgroundColor: `${colors.error}15`, // Semi-transparent error color
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
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
