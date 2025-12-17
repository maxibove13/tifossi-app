import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
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
  const { isLoggedIn } = useAuthStore();
  const { currentOrderNumber } = usePaymentStore();

  const [isVerifying, setIsVerifying] = useState(true);
  const [resolvedStatus, setResolvedStatus] = useState<'success' | 'pending' | 'failed' | null>(
    null
  );

  // Extract payment result from params
  // MercadoPago may duplicate external_reference in redirect URL, causing array
  const paymentFailureParam = params.paymentFailure === 'true';
  const rawExternalRef = params.external_reference || params.externalReference;
  const externalReference = Array.isArray(rawExternalRef) ? rawExternalRef[0] : rawExternalRef;
  const error = params.error as string;

  // Order number: from params or store
  const orderNumber = externalReference || currentOrderNumber;

  // Poll backend to verify payment status (webhook is source of truth)
  useEffect(() => {
    // If payment failed at MercadoPago, show failure immediately
    if (paymentFailureParam) {
      setResolvedStatus('failed');
      setIsVerifying(false);
      return;
    }

    // No order number - can't verify
    if (!orderNumber) {
      setResolvedStatus('pending');
      setIsVerifying(false);
      return;
    }

    let isMounted = true;
    let attempts = 0;
    let verifying = true;
    let intervalId: ReturnType<typeof setInterval>;
    const maxPolls = 15; // 15 polls * 2s = 30 seconds max
    const pollInterval = 2000;
    setIsVerifying(true);

    const stopPolling = () => {
      verifying = false;
      setIsVerifying(false);
    };

    const pollStatus = async () => {
      try {
        const orderStatus = await mercadoPagoService.getOrderStatusByNumber(orderNumber);

        if (!isMounted) return;

        // Check order status (updated by webhook)
        if (orderStatus.status === 'paid' || orderStatus.status === 'processing') {
          setResolvedStatus('success');
          stopPolling();
          clearInterval(intervalId);
          return;
        }

        if (orderStatus.status === 'cancelled') {
          setResolvedStatus('failed');
          stopPolling();
          clearInterval(intervalId);
          return;
        }
      } catch (err) {
        console.error('[PaymentResult] Poll failed:', err);
      }

      attempts += 1;
      if (attempts >= maxPolls && isMounted) {
        setResolvedStatus('pending'); // Webhook may still process after timeout
        stopPolling();
        clearInterval(intervalId);
      }
    };

    // Start polling
    pollStatus();
    intervalId = setInterval(() => {
      if (attempts < maxPolls && isMounted && verifying) {
        pollStatus();
      } else {
        clearInterval(intervalId);
      }
    }, pollInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [orderNumber, paymentFailureParam]);

  // Determine final display status
  const paymentSuccess = resolvedStatus === 'success';
  const paymentPending = resolvedStatus === 'pending' || isVerifying;

  // Clear cart on successful payment
  useEffect(() => {
    if (paymentSuccess && !isVerifying) {
      clearCart();
    }
  }, [paymentSuccess, isVerifying, clearCart]);

  const handleGoToOrders = () => {
    router.replace('/profile/orders');
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
          {orderNumber && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Número de pedido:</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
          )}
          {isLoggedIn && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToOrders}>
              <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={isLoggedIn ? styles.secondaryButton : styles.primaryButton}
            onPress={handleBackToHome}
          >
            <Text style={isLoggedIn ? styles.secondaryButtonText : styles.primaryButtonText}>
              Volver al inicio
            </Text>
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
          {isVerifying ? (
            <>
              <ActivityIndicator size="large" color="#0C0C0C" style={styles.pendingIcon} />
              <Text style={styles.title}>Verificando pago...</Text>
              <Text style={styles.message}>Estamos confirmando el estado de tu pago.</Text>
            </>
          ) : (
            <>
              <View style={styles.pendingIcon}>
                <Ionicons name="time-outline" size={80} color="#FFC107" />
              </View>
              <Text style={styles.title}>Pago pendiente</Text>
              <Text style={styles.message}>Tu pago está siendo procesado.</Text>
            </>
          )}
          {orderNumber && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Número de pedido:</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
          )}
          {!isVerifying && (
            <Text style={styles.submessage}>Te notificaremos cuando el pago sea confirmado.</Text>
          )}
          {!isVerifying && isLoggedIn && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToOrders}>
              <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
            </TouchableOpacity>
          )}
          {!isVerifying && (
            <TouchableOpacity
              style={isLoggedIn ? styles.secondaryButton : styles.primaryButton}
              onPress={handleBackToHome}
            >
              <Text style={isLoggedIn ? styles.secondaryButtonText : styles.primaryButtonText}>
                Volver al inicio
              </Text>
            </TouchableOpacity>
          )}
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
