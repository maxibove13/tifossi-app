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

// Import stores and services
import { usePaymentStore } from '../_stores/paymentStore';
import { useCartStore } from '../_stores/cartStore';
import { useAuthStore } from '../_stores/authStore';
import mercadoPagoService from '../_services/payment/mercadoPago';

export default function PaymentResultScreen() {
  const params = useLocalSearchParams();
  const { clearCart } = useCartStore();
  const { token } = useAuthStore();
  const { currentOrderNumber } = usePaymentStore();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [, setPaymentStatus] = useState<string | null>(null);

  // Extract payment result from params
  const paymentSuccess = params.paymentSuccess === 'true';
  const paymentPending = params.paymentPending === 'true';
  const paymentId = params.paymentId as string;
  const error = params.error as string;

  // Verify payment status
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (paymentId && !verificationComplete && token) {
        setIsVerifying(true);
        try {
          mercadoPagoService.setAuthToken(token);
          const status = await mercadoPagoService.verifyPaymentStatus(paymentId);
          setPaymentStatus(status.status);
          setVerificationComplete(true);
        } catch {
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
  }, [paymentId, verificationComplete, token]);

  // Clear cart on successful payment
  useEffect(() => {
    if (paymentSuccess && !isVerifying) {
      clearCart();
    }
  }, [paymentSuccess, isVerifying, clearCart]);

  const handleGoToOrders = () => {
    router.replace('/(tabs)/profile');
    // Navigate to orders section in profile
  };

  const handleTryAgain = () => {
    router.back(); // Go back to payment selection
  };

  const handleBackToHome = () => {
    router.replace('/');
  };

  if (paymentSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.title}>¡Pago exitoso!</Text>
          <Text style={styles.message}>Tu pedido ha sido procesado correctamente.</Text>
          {currentOrderNumber && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Número de pedido:</Text>
              <Text style={styles.orderNumber}>{currentOrderNumber}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoToOrders}>
            <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
            <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (paymentPending) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.content}>
          <View style={styles.pendingIcon}>
            <Ionicons name="time-outline" size={80} color="#FFC107" />
          </View>
          <Text style={styles.title}>Pago pendiente</Text>
          <Text style={styles.message}>Tu pago está siendo procesado.</Text>
          {currentOrderNumber && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Número de pedido:</Text>
              <Text style={styles.orderNumber}>{currentOrderNumber}</Text>
            </View>
          )}
          <Text style={styles.submessage}>Te notificaremos cuando el pago sea confirmado.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoToOrders}>
            <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
            <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Payment failed or error
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.content}>
        <View style={styles.errorIcon}>
          <Ionicons name="close-circle" size={80} color="#F44336" />
        </View>
        <Text style={styles.title}>Pago no completado</Text>
        <Text style={styles.message}>
          {error || 'No se pudo procesar tu pago. Por favor, intenta nuevamente.'}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
          <Text style={styles.primaryButtonText}>Intentar nuevamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  } as ViewStyle,
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  successIcon: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  pendingIcon: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  errorIcon: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: fontWeights.bold as any,
    marginBottom: spacing.sm,
    textAlign: 'center',
  } as TextStyle,
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  } as TextStyle,
  submessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  } as TextStyle,
  orderInfo: {
    backgroundColor: '#F5F5F5',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  } as ViewStyle,
  orderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: spacing.xs,
  } as TextStyle,
  orderNumber: {
    fontSize: 18,
    fontWeight: fontWeights.semibold as any,
    color: '#333',
  } as TextStyle,
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: radius.circle,
    marginBottom: spacing.md,
    minWidth: 200,
    alignItems: 'center',
  } as ViewStyle,
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: fontWeights.semibold as any,
  } as TextStyle,
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  } as ViewStyle,
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    textDecorationLine: 'underline',
  } as TextStyle,
});
