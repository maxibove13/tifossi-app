import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Import style tokens
import { spacing, radius } from '../_styles/spacing';
import { fontWeights } from '../_styles/typography';

// Import stores
import { usePaymentStore } from '../_stores/paymentStore';
import { useCartStore } from '../_stores/cartStore';

export default function PaymentResultScreen() {
  const params = useLocalSearchParams();
  const { clearCart } = useCartStore();
  const { currentOrder, verifyPayment } = usePaymentStore();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Extract payment result from params
  const paymentSuccess = params.paymentSuccess === 'true';
  const paymentPending = params.paymentPending === 'true';
  const paymentFailure = params.paymentFailure === 'true';
  const paymentError = params.paymentError === 'true';
  const _orderId = params.orderId as string;
  const paymentId = params.paymentId as string;
  const error = params.error as string;

  // Verify payment status
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (paymentId && !verificationComplete) {
        setIsVerifying(true);
        try {
          await verifyPayment(paymentId);
          setVerificationComplete(true);
        } catch (error) {
          // Error is handled by Alert, no need for console logging in production
          Alert.alert(
            'Error',
            'No pudimos verificar el estado del pago. Por favor, revisa tus pedidos.'
          );
        } finally {
          setIsVerifying(false);
        }
      }
    };

    verifyPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]); // verifyPayment and verificationComplete are intentionally omitted

  // Clear cart on successful payment
  useEffect(() => {
    if (paymentSuccess && !isVerifying) {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSuccess, isVerifying]); // clearCart is intentionally omitted to prevent multiple clears

  const handleGoToOrders = () => {
    router.replace('/(tabs)/profile');
    // Navigate to orders section in profile
  };

  const handleTryAgain = () => {
    router.back(); // Go back to payment selection
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const renderSuccessContent = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
      </View>

      <Text style={styles.title}>¡Pago exitoso!</Text>
      <Text style={styles.message}>
        Tu pedido ha sido procesado correctamente. Recibirás una confirmación por email.
      </Text>

      {currentOrder && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Número de pedido:</Text>
          <Text style={styles.orderNumber}>{currentOrder.orderNumber}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={handleGoToOrders} activeOpacity={0.7}>
        <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Continuar comprando</Text>
      </TouchableOpacity>
    </>
  );

  const renderPendingContent = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="hourglass" size={80} color="#FF9800" />
      </View>

      <Text style={styles.title}>Pago en proceso</Text>
      <Text style={styles.message}>
        Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.
      </Text>

      {currentOrder && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Número de pedido:</Text>
          <Text style={styles.orderNumber}>{currentOrder.orderNumber}</Text>
        </View>
      )}

      {isVerifying && <Text style={styles.verifyingText}>Verificando estado del pago...</Text>}

      <TouchableOpacity style={styles.primaryButton} onPress={handleGoToOrders} activeOpacity={0.7}>
        <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Ir al inicio</Text>
      </TouchableOpacity>
    </>
  );

  const renderFailureContent = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="close-circle" size={80} color="#F44336" />
      </View>

      <Text style={styles.title}>Pago rechazado</Text>
      <Text style={styles.message}>
        {error
          ? `No se pudo procesar tu pago: ${error}`
          : 'No se pudo procesar tu pago. Por favor, intenta con otro método de pago.'}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain} activeOpacity={0.7}>
        <Text style={styles.primaryButtonText}>Intentar nuevamente</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Ir al inicio</Text>
      </TouchableOpacity>
    </>
  );

  const renderErrorContent = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={80} color="#FF5722" />
      </View>

      <Text style={styles.title}>Error en el pago</Text>
      <Text style={styles.message}>
        Ocurrió un error inesperado durante el proceso de pago. Por favor, intenta nuevamente.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain} activeOpacity={0.7}>
        <Text style={styles.primaryButtonText}>Intentar nuevamente</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Ir al inicio</Text>
      </TouchableOpacity>
    </>
  );

  const renderContent = () => {
    if (paymentSuccess) return renderSuccessContent();
    if (paymentPending) return renderPendingContent();
    if (paymentFailure) return renderFailureContent();
    if (paymentError) return renderErrorContent();

    // Default case
    return renderErrorContent();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  iconContainer: ViewStyle;
  title: TextStyle;
  message: TextStyle;
  orderInfo: ViewStyle;
  orderLabel: TextStyle;
  orderNumber: TextStyle;
  verifyingText: TextStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 24,
    fontWeight: fontWeights.medium,
    lineHeight: 32,
    color: '#0C0C0C',
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  orderInfo: {
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  orderLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: '#666666',
  },
  orderNumber: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: fontWeights.medium,
    color: '#0C0C0C',
  },
  verifyingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: '#999999',
    fontStyle: 'italic',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0C0C',
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
    color: '#FBFBFB',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 24,
    color: '#0C0C0C',
  },
});
