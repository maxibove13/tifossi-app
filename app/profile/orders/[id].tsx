import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../_styles/typography';
import { useAuthStore } from '../../_stores/authStore';
import orderService, { Order } from '../../_services/order/orderService';
import ReusableAuthPrompt from '../../_components/auth/AuthPrompt';
import { getStatusColor, formatDate, formatCurrency } from '../../_utils/orderUtils';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn, token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isLoggedIn || !token) {
        setIsLoading(false);
        return;
      }

      if (!id) {
        setIsLoading(false);
        setError('ID de pedido no válido');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        orderService.setAuthToken(token);
        const orderData = await orderService.getOrderById(id);
        setOrder(orderData);
      } catch (err) {
        const error = err as { status?: number; message?: string };
        if (error.status === 401 || error.status === 403) {
          setError('No tienes permiso para ver este pedido.');
        } else if (error.status === 404) {
          setError('El pedido no existe.');
        } else {
          setError('Error al cargar el pedido. Intenta nuevamente.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, token, isLoggedIn]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile/orders');
    }
  };

  // Auth guard - show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Pedido</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <ReusableAuthPrompt message="Inicia sesión para ver tus pedidos." />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Pedido</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Pedido</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error || 'No se encontró el pedido'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusText = orderService.getOrderStatusText(order.status);
  const statusColor = getStatusColor(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Pedido</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.orderSummaryHeader}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(order.createdAt, true)}</Text>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {(order.items ?? []).map((item, index) => (
            <View key={index} style={styles.itemCard}>
              {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />}
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.size && <Text style={styles.itemVariant}>Talle: {item.size}</Text>}
                {item.color && <Text style={styles.itemVariant}>Color: {item.color}</Text>}
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.discountedPrice || item.price)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento</Text>
              <Text style={[styles.totalValue, { color: colors.success }]}>
                -{formatCurrency(order.discount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Envío</Text>
            <Text style={styles.totalValue}>
              {order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Gratis'}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Envío</Text>
          <View style={styles.shippingInfo}>
            <Text style={styles.shippingMethod}>
              {order.shippingMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'}
            </Text>
            {order.shippingMethod === 'delivery' && order.shippingAddress && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressLine}>{order.shippingAddress.addressLine1}</Text>
                {order.shippingAddress.addressLine2 && (
                  <Text style={styles.addressLine}>{order.shippingAddress.addressLine2}</Text>
                )}
                <Text style={styles.addressLine}>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </Text>
                {order.shippingAddress.postalCode && (
                  <Text style={styles.addressLine}>CP: {order.shippingAddress.postalCode}</Text>
                )}
              </View>
            )}
            {order.trackingNumber && (
              <View style={styles.trackingContainer}>
                <Text style={styles.trackingLabel}>Tracking:</Text>
                <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Info */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Pago</Text>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Estado</Text>
              <Text
                style={[
                  styles.paymentValue,
                  {
                    color: ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                      ? colors.success
                      : colors.secondary,
                  },
                ]}
              >
                {orderService.getPaymentStatusFromOrder(order.status)}
              </Text>
            </View>
            {order.paymentMethod && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Método</Text>
                <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  headerPlaceholder: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xxl,
  },
  retryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.background.light,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastSection: {
    borderBottomWidth: 0,
    marginBottom: spacing.xl,
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNumber: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  orderDate: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  itemVariant: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  itemQuantity: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  itemPrice: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  totalValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  grandTotalValue: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  shippingInfo: {
    gap: spacing.sm,
  },
  shippingMethod: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  addressContainer: {
    marginTop: spacing.xs,
  },
  addressLine: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    lineHeight: lineHeights.sm * 1.2,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  trackingLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginRight: spacing.xs,
  },
  trackingNumber: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  paymentInfo: {
    gap: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  paymentValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
});
