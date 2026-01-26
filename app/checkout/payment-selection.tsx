import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  ImageSourcePropType,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import RadioButton from '../_components/ui/form/RadioButton';
import SubheaderClose from '../_components/common/SubheaderClose';
import CartProductCard from '../_components/store/product/cart/CartProductCard';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, layout } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';

// Import stores and services
import { useCartStore } from '../_stores/cartStore';
import { usePaymentStore } from '../_stores/paymentStore';
import { useAuthStore } from '../_stores/authStore';
import { useProductStore } from '../_stores/productStore';
import { Product } from '../_types/product';
import addressService from '../_services/address/addressService';
import mercadoPagoService, { OrderData } from '../_services/payment/mercadoPago';

interface PaymentMethod {
  id: string;
  name: string;
  icon: ImageSourcePropType;
  hasChevron: boolean;
  enabled?: boolean;
}

export default function PaymentSelectionScreen() {
  const navigation = useRouter();

  // Store hooks
  const { items: cartItems } = useCartStore();
  const { user, token } = useAuthStore();
  const { products: allProducts } = useProductStore();
  const isLoading = usePaymentStore((state) => state.isLoading);
  const error = usePaymentStore((state) => state.error);
  const setCurrentOrder = usePaymentStore((state) => state.setCurrentOrder);
  const clearPaymentState = usePaymentStore((state) => state.clearPaymentState);
  const setLoading = usePaymentStore((state) => state.setLoading);
  const selectedStore = usePaymentStore((state) => state.selectedStore);
  const selectedAddress = usePaymentStore((state) => state.selectedAddress);
  const guestData = usePaymentStore((state) => state.guestData);
  // Pending buy now item (for "Comprar ahora" flow without cart)
  const pendingBuyNowItem = usePaymentStore((state) => state.pendingBuyNowItem);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Cart display item type
  interface CartDisplayItem extends Product {
    quantity: number;
    selectedSize?: string;
    color?: string;
  }

  // Convert items to displayable format with product details
  // "Buy Now" flow: show ONLY the buy-now item (not mixed with cart)
  // Normal cart flow: show cart items
  const cartDisplayItems = useMemo(() => {
    const result: CartDisplayItem[] = [];

    // If pendingBuyNowItem exists, use ONLY that (industry standard "Buy Now" behavior)
    if (pendingBuyNowItem) {
      const product = allProducts?.find((p) => p.id === pendingBuyNowItem.productId);
      if (product) {
        result.push({
          ...product,
          quantity: pendingBuyNowItem.quantity,
          selectedSize: pendingBuyNowItem.size,
          color: pendingBuyNowItem.color,
        });
      }
      return result;
    }

    // Normal cart checkout: use cart items
    for (const item of cartItems) {
      const product = allProducts?.find((p) => p.id === item.productId);
      if (product) {
        result.push({
          ...product,
          quantity: item.quantity,
          selectedSize: item.size,
          color: item.color,
        });
      }
    }

    return result;
  }, [cartItems, allProducts, pendingBuyNowItem]);

  // Calculate order totals
  // "Buy Now" uses only that item; normal checkout uses cart items
  const shippingMethod = selectedStore ? 'pickup' : 'delivery';
  const subtotal = pendingBuyNowItem
    ? (pendingBuyNowItem.discountedPrice ?? pendingBuyNowItem.price) * pendingBuyNowItem.quantity
    : cartItems.reduce((sum, item) => {
        const price = item.discountedPrice ?? item.price ?? 0;
        return sum + price * item.quantity;
      }, 0);
  const shippingCost = shippingMethod === 'pickup' ? 0 : 200;
  const total = subtotal + shippingCost;
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Clear payment state when leaving screen
  useEffect(() => {
    return () => {
      clearPaymentState();
    };
  }, [clearPaymentState]);

  // Surface store-level errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error de pago', error);
    }
  }, [error]);

  // Default payment methods
  const defaultPaymentMethods: PaymentMethod[] = [
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      icon: require('../../assets/images/payment/mercadopago_icon.png'),
      hasChevron: true,
      enabled: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: require('../../assets/images/payment/paypal_icon.png'),
      hasChevron: true,
      enabled: false, // Not implemented yet
    },
  ];

  // Other payment methods
  const otherPaymentMethods: PaymentMethod[] = [
    {
      id: 'tiffosi',
      name: 'Crédito Tiffosi',
      icon: require('../../assets/images/logo/tiffosi.png'),
      hasChevron: true,
      enabled: false, // Not implemented yet
    },
    {
      id: 'efectivo',
      name: 'Efectivo',
      icon: require('../../assets/images/payment/cash.png'),
      hasChevron: true,
      enabled: false, // Not implemented yet
    },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleBack = () => {
    // Navigate back to the shipping address screen
    navigation.back();
  };

  const handleSave = async () => {
    if (!selectedPaymentMethod) return;

    if (selectedPaymentMethod === 'mercadopago') {
      await handleMercadoPagoPayment();
    }
  };

  const handleMercadoPagoPayment = async () => {
    try {
      // Check for either cart items OR pending buy now item
      if ((!cartItems || cartItems.length === 0) && !pendingBuyNowItem) {
        Alert.alert('Error', 'Tu carrito está vacío');
        return;
      }

      // Determine shipping method based on whether a store was selected
      const shippingMethod = selectedStore ? ('pickup' as const) : ('delivery' as const);

      // Only require address for delivery, not for store pickup
      // For delivery: need selectedAddress (logged in) or guestData with address fields
      if (shippingMethod === 'delivery' && !selectedAddress && !guestData?.addressLine1) {
        Alert.alert('Error', 'Debes proporcionar una dirección de envío');
        return;
      }

      setIsProcessingPayment(true);
      setLoading(true);

      // Set auth token for MercadoPago service (empty string for guests)
      mercadoPagoService.setAuthToken(token || '');

      // Prepare user data for MercadoPago (handle logged-in and guest)
      let userData;
      if (user) {
        // Logged-in user
        userData = {
          id: user.id,
          firstName: user.firstName || user.name?.split(' ')[0] || 'Usuario',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.phone
            ? {
                areaCode: '598',
                number: user.phone,
              }
            : undefined,
        };
      } else if (guestData) {
        // Guest user - use unified guestData (works for both delivery and pickup)
        userData = {
          id: `guest-${Date.now()}`,
          firstName: guestData.firstName,
          lastName: guestData.lastName,
          email: guestData.email,
          phone: guestData.phoneNumber
            ? {
                areaCode: '598',
                number: guestData.phoneNumber,
              }
            : undefined,
        };
      } else {
        Alert.alert('Error', 'Faltan datos de contacto');
        return;
      }

      // Build shipping address for delivery orders only
      const shippingAddressData =
        shippingMethod === 'delivery'
          ? selectedAddress
            ? {
                firstName: selectedAddress.firstName,
                lastName: selectedAddress.lastName,
                addressLine1: selectedAddress.addressLine1,
                addressLine2: selectedAddress.addressLine2,
                city: selectedAddress.city,
                state: selectedAddress.state,
                country: selectedAddress.country,
                postalCode: selectedAddress.postalCode,
                phoneNumber: selectedAddress.phoneNumber,
              }
            : guestData?.addressLine1
              ? {
                  firstName: guestData.firstName,
                  lastName: guestData.lastName,
                  addressLine1: guestData.addressLine1,
                  addressLine2: guestData.addressLine2,
                  city: guestData.city,
                  state: guestData.state,
                  country: guestData.country,
                  postalCode: guestData.postalCode,
                  phoneNumber: guestData.phoneNumber,
                }
              : null
          : null;

      // Build order items - "Buy Now" uses only that item, normal checkout uses cart
      // Note: productName/description are placeholders - backend fetches fresh product data
      const orderItems = pendingBuyNowItem
        ? [
            {
              productId: pendingBuyNowItem.productId,
              productName: pendingBuyNowItem.title,
              quantity: pendingBuyNowItem.quantity,
              price: pendingBuyNowItem.discountedPrice ?? pendingBuyNowItem.price,
              size: pendingBuyNowItem.size,
              color: pendingBuyNowItem.color,
            },
          ]
        : cartItems.map((item) => ({
            productId: item.productId,
            productName: `Product ${item.productId}`, // Backend overwrites with actual name
            quantity: item.quantity,
            price: item.discountedPrice ?? item.price ?? 0,
            size: item.size,
            color: item.color,
          }));

      const orderData: OrderData = {
        items: orderItems,
        user: userData,
        shippingAddress: shippingAddressData,
        shippingMethod,
        shippingCost,
        subtotal,
        discount: 0,
        total,
        // Pass store location and notes via extended data (backend extracts these)
        storeLocationCode: selectedStore?.id,
        notes: 'Pedido realizado desde la app móvil',
      } as OrderData & { storeLocationCode?: string; notes?: string };

      // Create payment preference (backend creates order + preference in one call)
      const preference = await mercadoPagoService.createPaymentPreference(orderData);

      // Store order info for display in payment result screen
      setCurrentOrder(preference.externalReference, null);

      // Open MercadoPago payment page
      const paymentResult = await mercadoPagoService.initiatePayment(preference);

      if (!paymentResult.success) {
        // Only show error if payment couldn't be initiated at all
        Alert.alert('Error', paymentResult.error || 'No se pudo iniciar el pago');
        return;
      }

      // User dismissed browser (cancelled Apple overlay or closed before completing)
      // Stay on payment screen so they can retry immediately
      // The pending order will be cancelled when they attempt again
      if (paymentResult.userDismissed) {
        return;
      }

      // User completed redirect flow - navigate to payment result to verify status
      navigation.replace({
        pathname: '/checkout/payment-result',
        params: { external_reference: preference.externalReference },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      console.error('[Checkout] Payment error:', rawMessage);

      // Convert technical errors to user-friendly messages
      let userMessage: string;
      if (rawMessage.toLowerCase().includes('network')) {
        userMessage = 'Sin conexión a internet. Verifica tu conexión.';
      } else if (rawMessage.toLowerCase().includes('auth')) {
        userMessage = 'Debes iniciar sesión para continuar.';
      } else {
        userMessage = rawMessage;
      }

      Alert.alert('Error de Pago', userMessage);
    } finally {
      setIsProcessingPayment(false);
      setLoading(false);
    }
  };

  const closeCheckoutFlow = usePaymentStore((state) => state.closeCheckoutFlow);

  const handleClose = () => {
    closeCheckoutFlow();
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <Pressable
      key={method.id}
      style={({ pressed }) => [styles.paymentMethodItem, pressed && styles.pressedPaymentMethod]}
      onPress={() => handlePaymentMethodSelect(method.id)}
      testID={`payment-method-${method.id}`}
      accessibilityRole="button"
      accessibilityState={{
        selected: selectedPaymentMethod === method.id,
      }}
    >
      <View style={styles.paymentMethodInfo}>
        <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
        <Text style={styles.paymentMethodText}>{method.name}</Text>
      </View>
      <RadioButton selected={selectedPaymentMethod === method.id} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.container}>
        {/* Header */}
        <SubheaderClose title="Resumen y pago" onClose={handleClose} closeTestID="close-button" />

        {/* Content */}
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Order Summary - Cart Items */}
            <View style={styles.orderSummaryContainer}>
              <Text style={[styles.sectionTitle, styles.orderSummaryTitle]}>Tu pedido</Text>
              <View style={styles.cartItemsList}>
                {cartDisplayItems.map((item) => (
                  <CartProductCard
                    key={`${item.id}-${item.color}-${item.selectedSize}`}
                    product={item}
                    quantity={item.quantity}
                  />
                ))}
              </View>
            </View>

            {/* Shipping Info */}
            <View style={styles.shippingInfoContainer}>
              <Text style={styles.sectionTitle}>
                {shippingMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'}
              </Text>
              <View style={styles.shippingInfoContent}>
                {shippingMethod === 'pickup' && selectedStore ? (
                  <Text style={styles.shippingInfoText}>{selectedStore.name}</Text>
                ) : selectedAddress ? (
                  <Text style={styles.shippingInfoText}>
                    {addressService.formatAddressDisplay(selectedAddress)}
                  </Text>
                ) : guestData?.addressLine1 ? (
                  <Text style={styles.shippingInfoText}>
                    {`${guestData.addressLine1}, ${guestData.city}`}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Order Totals */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Envío</Text>
                <Text style={styles.totalValue}>
                  {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.finalTotalRow]}>
                <Text style={styles.finalTotalLabel}>Total</Text>
                <Text style={styles.finalTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Default Payment Methods */}
            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.sectionTitle}>Método de pago</Text>

              <View style={styles.paymentMethodsList}>
                {defaultPaymentMethods
                  .filter((method) => method.enabled !== false)
                  .map(renderPaymentMethod)}
              </View>
            </View>

            {/* Other Payment Methods */}
            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.sectionTitle}>Otros métodos</Text>

              <View style={styles.paymentMethodsList}>
                {otherPaymentMethods
                  .filter((method) => method.enabled !== false)
                  .map(renderPaymentMethod)}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!selectedPaymentMethod || isProcessingPayment || isLoading) && styles.disabledButton,
            ]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={!selectedPaymentMethod || isProcessingPayment || isLoading}
            testID="continue-button"
            accessibilityRole="button"
            accessibilityState={{
              disabled: !selectedPaymentMethod || isProcessingPayment || isLoading,
            }}
          >
            <LinearGradient
              colors={colors.button.defaultGradient}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessingPayment || isLoading ? 'Procesando...' : 'Continuar con el pago'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBack}
            activeOpacity={0.7}
            testID="back-button"
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.secondaryButtonText}>Atrás</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

type Styles = {
  safeArea: ViewStyle;
  container: ViewStyle;
  scrollView: ViewStyle;
  content: ViewStyle;
  orderSummaryContainer: ViewStyle;
  orderSummaryTitle: TextStyle;
  cartItemsList: ViewStyle;
  shippingInfoContainer: ViewStyle;
  shippingInfoContent: ViewStyle;
  shippingInfoText: TextStyle;
  totalsContainer: ViewStyle;
  totalRow: ViewStyle;
  totalLabel: TextStyle;
  totalValue: TextStyle;
  finalTotalRow: ViewStyle;
  finalTotalLabel: TextStyle;
  finalTotalValue: TextStyle;
  paymentMethodsContainer: ViewStyle;
  sectionTitle: TextStyle;
  paymentMethodsList: ViewStyle;
  paymentMethodItem: ViewStyle;
  pressedPaymentMethod: ViewStyle;
  paymentMethodInfo: ViewStyle;
  paymentIcon: ImageStyle;
  paymentMethodText: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonGradient: ViewStyle;
  disabledButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    paddingTop: layout.subheaderScreenTop,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  orderSummaryContainer: {
    backgroundColor: colors.background.light,
    paddingTop: spacing.md,
  },
  orderSummaryTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  cartItemsList: {
    gap: 0,
  },
  shippingInfoContainer: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  shippingInfoContent: {
    marginTop: spacing.sm,
  },
  shippingInfoText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  totalsContainer: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  totalValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  finalTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.background.medium,
  },
  finalTotalLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  finalTotalValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  paymentMethodsContainer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: '#707070',
  },
  paymentMethodsList: {
    gap: spacing.md,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  pressedPaymentMethod: {
    backgroundColor: '#F2F2F2',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  paymentIcon: {
    width: 24,
    height: 24,
  },
  paymentMethodText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#0C0C0C',
  },
  actionButtons: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
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
