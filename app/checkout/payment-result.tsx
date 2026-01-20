import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius, components } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';

// Import stores and services
import { usePaymentStore } from '../_stores/paymentStore';
import { useCartStore } from '../_stores/cartStore';
import { useAuthStore } from '../_stores/authStore';
import mercadoPagoService from '../_services/payment/mercadoPago';

export default function PaymentResultScreen() {
  const params = useLocalSearchParams();
  const { clearCart } = useCartStore();
  const { isLoggedIn, token } = useAuthStore();
  const { currentOrderNumber, guestData, setPendingBuyNowItem } = usePaymentStore();

  // Get guest email for order status verification
  const guestEmail = guestData?.email;

  // Set auth token on service if logged in
  useEffect(() => {
    if (token) {
      mercadoPagoService.setAuthToken(token);
    }
  }, [token]);

  const [isVerifying, setIsVerifying] = useState(true);
  const [resolvedStatus, setResolvedStatus] = useState<'success' | 'pending' | 'failed' | null>(
    null
  );

  // Extract payment result from params
  // MercadoPago may duplicate external_reference in redirect URL, causing array
  const paymentFailureParam = params.paymentFailure === 'true';
  const rawExternalRef = params.external_reference || params.externalReference;
  const externalReference = Array.isArray(rawExternalRef) ? rawExternalRef[0] : rawExternalRef;
  const rawPaymentId = params.payment_id;
  const paymentId = Array.isArray(rawPaymentId) ? rawPaymentId[0] : rawPaymentId;
  const error = params.error as string;

  // Order number: from params or store
  const orderNumber = externalReference || currentOrderNumber;

  // Poll backend to verify payment status (webhook is source of truth)
  useEffect(() => {
    // No order number - can't verify
    if (!orderNumber) {
      setResolvedStatus('pending');
      setIsVerifying(false);
      return;
    }

    let isMounted = true;

    // If payment failed at MercadoPago but payment_id exists, do a single check
    // Edge case: payment might have gone through despite failure redirect
    if (paymentFailureParam) {
      if (paymentId) {
        // Single verification - payment was created, check if it actually succeeded
        setIsVerifying(true);
        mercadoPagoService
          .getOrderStatusByNumber(orderNumber, isLoggedIn ? undefined : guestEmail)
          .then((orderStatus) => {
            if (!isMounted) return;
            if (orderStatus.status === 'paid' || orderStatus.status === 'processing') {
              setResolvedStatus('success');
            } else if (orderStatus.status === 'pending') {
              // Payment still processing - don't show as failed
              setResolvedStatus('pending');
            } else {
              setResolvedStatus('failed');
            }
          })
          .catch(() => {
            if (isMounted) setResolvedStatus('failed');
          })
          .finally(() => {
            if (isMounted) setIsVerifying(false);
          });
      } else {
        // No payment_id - user cancelled before payment was created, show failure immediately
        setResolvedStatus('failed');
        setIsVerifying(false);
      }
      return;
    }

    // Normal flow: poll for status (browser closed or success/pending redirect)
    let attempts = 0;
    let currentDelay = 2000; // Start with 2s, will increase on 429
    const maxPolls = 5; // 5 polls, ~10-15 seconds max with backoff
    const maxDelay = 8000; // Cap backoff at 8s
    setIsVerifying(true);

    const stopPolling = () => {
      setIsVerifying(false);
    };

    const pollStatus = async () => {
      if (!isMounted) return;

      try {
        const orderStatus = await mercadoPagoService.getOrderStatusByNumber(
          orderNumber,
          isLoggedIn ? undefined : guestEmail
        );

        if (!isMounted) return;

        // Check order status (updated by webhook)
        if (orderStatus.status === 'paid' || orderStatus.status === 'processing') {
          setResolvedStatus('success');
          stopPolling();
          return;
        }

        if (orderStatus.status === 'cancelled') {
          setResolvedStatus('failed');
          stopPolling();
          return;
        }
      } catch (err) {
        console.error('[PaymentResult] Poll failed:', err);
        // Exponential backoff on errors (especially 429)
        const errorMessage = err instanceof Error ? err.message : '';
        if (errorMessage.includes('429')) {
          currentDelay = Math.min(currentDelay * 2, maxDelay);
        }
      }

      attempts += 1;
      if (attempts >= maxPolls) {
        if (isMounted) {
          setResolvedStatus('pending'); // Webhook may still process after timeout
          stopPolling();
        }
        return;
      }

      // Schedule next poll with current delay
      if (isMounted) {
        setTimeout(pollStatus, currentDelay);
      }
    };

    // Start polling
    pollStatus();

    return () => {
      isMounted = false;
    };
  }, [orderNumber, paymentFailureParam, paymentId, isLoggedIn, guestEmail]);

  // Determine final display status
  const paymentSuccess = resolvedStatus === 'success';
  const paymentPending = resolvedStatus === 'pending' || isVerifying;

  // Clear cart and pending buy now item on successful payment
  useEffect(() => {
    if (paymentSuccess && !isVerifying) {
      clearCart();
      // Clear pending buy now item to prevent stale overlay state
      setPendingBuyNowItem(null);
    }
  }, [paymentSuccess, isVerifying, clearCart, setPendingBuyNowItem]);

  const handleGoToOrders = () => {
    router.replace('/profile/orders');
  };

  const handleTryAgain = () => {
    router.replace('/checkout/payment-selection');
  };

  const handleBackToHome = () => {
    router.replace('/');
  };

  // Render icon based on state
  const renderIcon = () => {
    if (isVerifying) {
      return (
        <View style={styles.iconContainer}>
          <ActivityIndicator size="large" color={colors.background.light} />
        </View>
      );
    }

    if (paymentSuccess) {
      return (
        <View style={[styles.iconContainer, styles.iconSuccess]}>
          <Feather name="check" size={40} color={colors.background.light} />
        </View>
      );
    }

    if (paymentPending) {
      return (
        <View style={[styles.iconContainer, styles.iconPending]}>
          <Feather name="clock" size={40} color={colors.background.light} />
        </View>
      );
    }

    // Failed
    return (
      <View style={[styles.iconContainer, styles.iconError]}>
        <Feather name="x" size={40} color={colors.background.light} />
      </View>
    );
  };

  // Get content based on state
  const getContent = () => {
    if (isVerifying) {
      return {
        title: 'Verificando pago...',
        description: 'Estamos confirmando el estado de tu pago.',
        subdescription: 'Puedes salir, te notificaremos cuando se confirme.',
      };
    }

    if (paymentSuccess) {
      return {
        title: '¡Pago exitoso!',
        description: 'Tu pedido ha sido procesado correctamente.',
        subdescription: null,
      };
    }

    if (paymentPending) {
      return {
        title: 'Pago pendiente',
        description: 'Tu pago está siendo procesado.',
        subdescription: 'Te notificaremos cuando el pago sea confirmado.',
      };
    }

    // Failed
    return {
      title: 'Pago no completado',
      description: error || 'No se pudo procesar tu pago. Por favor, intenta nuevamente.',
      subdescription: null,
    };
  };

  const content = getContent();
  const showRetryButton = !paymentSuccess && !paymentPending && !isVerifying;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        <View style={styles.contentContainer}>
          {renderIcon()}

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          {orderNumber && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Número de pedido</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
              {guestEmail && paymentSuccess && (
                <Text style={styles.emailSent}>Te enviamos la confirmación a {guestEmail}</Text>
              )}
            </View>
          )}

          {content.subdescription && (
            <Text style={styles.subdescription}>{content.subdescription}</Text>
          )}
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        {showRetryButton && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTryAgain}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.button.defaultGradient}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Intentar nuevamente</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {isLoggedIn && !showRetryButton && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToOrders}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.button.defaultGradient}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={isLoggedIn && !showRetryButton ? styles.secondaryButton : styles.primaryButton}
          onPress={handleBackToHome}
          activeOpacity={0.7}
        >
          {isLoggedIn && !showRetryButton ? (
            <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
          ) : (
            <LinearGradient
              colors={colors.button.defaultGradient}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Volver al inicio</Text>
            </LinearGradient>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconSuccess: {
    backgroundColor: colors.success,
  },
  iconPending: {
    backgroundColor: '#F5A623',
  },
  iconError: {
    backgroundColor: colors.error,
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
    lineHeight: lineHeights.lg,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subdescription: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  orderInfo: {
    backgroundColor: colors.background.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  orderLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  orderNumber: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  emailSent: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    height: components.button.height,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.background.light,
  },
  secondaryButton: {
    width: '100%',
    height: components.button.height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
