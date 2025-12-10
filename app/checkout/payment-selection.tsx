import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import RadioButton from '../_components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fontWeights } from '../_styles/typography';

// Import stores and services
import { useCartStore } from '../_stores/cartStore';
import { usePaymentStore } from '../_stores/paymentStore';
import { useAuthStore } from '../_stores/authStore';
import { PaymentDeepLinks } from '../_utils/payment/deepLinkHandler';
import orderService from '../_services/order/orderService';
import addressService, { Address } from '../_services/address/addressService';
import mercadoPagoService from '../_services/payment/mercadoPago';

interface PaymentMethod {
  id: string;
  name: string;
  icon: ImageSourcePropType;
  hasChevron: boolean;
  enabled?: boolean;
}

export default function PaymentSelectionScreen() {
  const params = useLocalSearchParams();
  const { selectedAddressId } = params;
  const navigation = useRouter();

  // Store hooks
  const { items: cartItems } = useCartStore();
  const { user, token } = useAuthStore();
  const isLoading = usePaymentStore((state) => state.isLoading);
  const error = usePaymentStore((state) => state.error);
  const setCurrentOrder = usePaymentStore((state) => state.setCurrentOrder);
  const clearPaymentState = usePaymentStore((state) => state.clearPaymentState);
  const setLoading = usePaymentStore((state) => state.setLoading);
  const selectedStore = usePaymentStore((state) => state.selectedStore);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Fetch selected address by index
  useEffect(() => {
    const fetchSelectedAddress = async () => {
      if (selectedAddressId && token) {
        try {
          addressService.setAuthToken(token);
          const addresses = await addressService.fetchUserAddresses();
          const index = parseInt(selectedAddressId as string, 10);
          if (!isNaN(index) && index >= 0 && index < addresses.length) {
            setSelectedAddress(addresses[index]);
          } else {
            Alert.alert('Error', 'No pudimos cargar la dirección de envío.');
          }
        } catch {
          Alert.alert('Error', 'No pudimos cargar la dirección de envío.');
        }
      }
    };

    fetchSelectedAddress();
  }, [selectedAddressId, token]);

  // Initialize deep link handler for payment callbacks
  useEffect(() => {
    PaymentDeepLinks.initialize({
      onPaymentSuccess: (_data) => {
        // Navigation will be handled by deep link handler
      },
      onPaymentFailure: (_data) => {},
      onPaymentPending: (_data) => {},
    });

    return () => {
      PaymentDeepLinks.stopListening();
    };
  }, []);

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
      if (!user) {
        Alert.alert('Error', 'Debes estar autenticado para realizar el pago');
        return;
      }

      if (!cartItems || cartItems.length === 0) {
        Alert.alert('Error', 'Tu carrito está vacío');
        return;
      }

      if (!selectedAddress) {
        Alert.alert('Error', 'Debes seleccionar una dirección de envío');
        return;
      }

      setIsProcessingPayment(true);
      setLoading(true);

      // Set auth tokens for services
      orderService.setAuthToken(token);
      mercadoPagoService.setAuthToken(token || '');

      // Prepare user data for MercadoPago
      const userData = {
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

      // Determine shipping method based on whether a store was selected
      const shippingMethod = selectedStore ? ('pickup' as const) : ('delivery' as const);

      // Prepare order request
      const orderRequest = {
        items: cartItems,
        shippingAddress: selectedAddress,
        shippingMethod,
        storeLocationCode: selectedStore?.id,
        notes: 'Pedido realizado desde la app móvil',
      };

      // Create order with payment
      const result = await orderService.createOrderWithPayment(orderRequest, userData);

      if (result.success && result.paymentUrl) {
        // Store order info for display in payment result screen
        setCurrentOrder(result.order?.orderNumber || null, result.order?.id || null);

        // Open MercadoPago payment page
        const preference = {
          id: result.order?.id || '',
          initPoint: result.paymentUrl,
          externalReference: result.order?.orderNumber || '',
        };

        const paymentResult = await mercadoPagoService.initiatePayment(preference);

        if (paymentResult.success) {
          // WebView will handle the rest through deep links
        } else {
          Alert.alert('Error', paymentResult.error || 'No se pudo iniciar el pago');
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el pedido');
      }
    } catch (error) {
      // Determine appropriate error message based on error type
      let errorMessage = 'Ocurrió un error al procesar el pago.';

      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Sin conexión a internet. Verifica tu conexión.';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Debes iniciar sesión para continuar.';
        }
      }

      Alert.alert('Error de Pago', errorMessage);
    } finally {
      setIsProcessingPayment(false);
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Navigate back to the product screen or wherever the flow started
    navigation.navigate('/(tabs)');
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Método de pago</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="close-button"
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Default Payment Methods */}
          <View style={styles.paymentMethodsContainer}>
            <Text style={styles.sectionTitle}>Métodos predeterminados</Text>

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
          <Text style={styles.primaryButtonText}>
            {isProcessingPayment || isLoading ? 'Procesando...' : 'Continuar con el pago'}
          </Text>
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
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  scrollView: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  content: ViewStyle;
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
  disabledButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 54,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: fontWeights.regular,
    lineHeight: 28,
    color: '#424242',
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
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
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: 34,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0C0C',
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
