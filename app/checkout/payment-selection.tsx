import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  ImageSourcePropType,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
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

  // Store hooks
  const { items: cartItems } = useCartStore();
  const { user, token } = useAuthStore();
  const {
    createOrder,
    initiatePayment,
    currentOrder,
    paymentStatus,
    isLoading,
    error,
    clearCurrentPayment,
  } = usePaymentStore();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Fetch selected address
  useEffect(() => {
    const fetchSelectedAddress = async () => {
      if (selectedAddressId && token) {
        try {
          addressService.setAuthToken(token);
          const address = await addressService.getAddressById(selectedAddressId as string);
          setSelectedAddress(address);
        } catch (error) {
          console.error('Failed to fetch selected address:', error);
        }
      }
    };

    fetchSelectedAddress();
  }, [selectedAddressId, token]);

  // Initialize deep link handler for payment callbacks
  useEffect(() => {
    PaymentDeepLinks.initialize({
      onPaymentSuccess: (data) => {
        console.log('Payment success callback:', data);
        // Navigation will be handled by deep link handler
      },
      onPaymentFailure: (data) => {
        console.log('Payment failure callback:', data);
      },
      onPaymentPending: (data) => {
        console.log('Payment pending callback:', data);
      },
    });

    return () => {
      PaymentDeepLinks.stopListening();
    };
  }, []);

  // Handle payment status changes
  useEffect(() => {
    if (error) {
      Alert.alert('Error de pago', error);
    }
  }, [error]);

  // Clear payment state when leaving screen
  useEffect(() => {
    return () => {
      if (paymentStatus === 'error') {
        clearCurrentPayment();
      }
    };
  }, []);

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
    const allMethods = [...defaultPaymentMethods, ...otherPaymentMethods];
    const method = allMethods.find((m) => m.id === methodId);

    if (method && method.enabled === false) {
      Alert.alert('Método no disponible', `${method.name} estará disponible próximamente.`);
      return;
    }

    setSelectedPaymentMethod(methodId);
  };

  const handleBack = () => {
    // Navigate back to the shipping address screen
    router.back();
  };

  const handleSave = async () => {
    if (!selectedPaymentMethod) return;

    if (selectedPaymentMethod === 'mercadopago') {
      await handleMercadoPagoPayment();
    } else {
      // Handle other payment methods
      Alert.alert(
        'Método de pago',
        `${getPaymentMethodName(selectedPaymentMethod)} será implementado próximamente.`,
        [{ text: 'OK', onPress: () => router.navigate('/(tabs)') }]
      );
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

      // Prepare order request
      const orderRequest = {
        items: cartItems,
        shippingAddress: selectedAddress,
        shippingMethod: 'delivery' as const,
        notes: 'Pedido realizado desde la app móvil',
      };

      // Create order with payment
      const result = await orderService.createOrderWithPayment(orderRequest, userData);

      if (result.success && result.paymentUrl) {
        // Open MercadoPago payment page
        const preference = {
          id: result.order?.id || '',
          initPoint: result.paymentUrl,
          externalReference: result.order?.orderNumber || '',
        };

        const paymentResult = await mercadoPagoService.initiatePayment(preference);

        if (paymentResult.success) {
          console.log('Payment initiated successfully');
          // WebView will handle the rest through deep links
        } else {
          Alert.alert('Error', paymentResult.error || 'No se pudo iniciar el pago');
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el pedido');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar el pago. Intenta nuevamente.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getPaymentMethodName = (methodId: string): string => {
    const methods: Record<string, string> = {
      mercadopago: 'Mercado Pago',
      paypal: 'PayPal',
      tiffosi: 'Crédito Tiffosi',
      efectivo: 'Efectivo',
    };
    return methods[methodId] || methodId;
  };

  const handleClose = () => {
    // Navigate back to the product screen or wherever the flow started
    router.navigate('/(tabs)');
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[styles.paymentMethodItem, !method.enabled && styles.disabledPaymentMethod]}
      onPress={() => handlePaymentMethodSelect(method.id)}
      activeOpacity={0.7}
    >
      <View style={styles.paymentMethodInfo}>
        <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
        <Text style={[styles.paymentMethodText, !method.enabled && styles.disabledText]}>
          {method.name}
        </Text>
        {!method.enabled && <Text style={styles.comingSoonText}>Próximamente</Text>}
      </View>
      <RadioButton selected={selectedPaymentMethod === method.id} disabled={!method.enabled} />
    </TouchableOpacity>
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
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
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
              {defaultPaymentMethods.map(renderPaymentMethod)}
            </View>
          </View>

          {/* Other Payment Methods */}
          <View style={styles.paymentMethodsContainer}>
            <Text style={styles.sectionTitle}>Otros métodos</Text>

            <View style={styles.paymentMethodsList}>
              {otherPaymentMethods.map(renderPaymentMethod)}
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
        >
          <Text style={styles.primaryButtonText}>
            {isProcessingPayment || isLoading ? 'Procesando...' : 'Continuar con el pago'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} activeOpacity={0.7}>
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
  disabledPaymentMethod: ViewStyle;
  paymentMethodInfo: ViewStyle;
  paymentIcon: ImageStyle;
  paymentMethodText: TextStyle;
  disabledText: TextStyle;
  comingSoonText: TextStyle;
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
  disabledPaymentMethod: {
    opacity: 0.6,
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
  disabledText: {
    color: '#999999',
  },
  comingSoonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: fontWeights.regular,
    color: '#999999',
    fontStyle: 'italic',
    marginLeft: spacing.sm,
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
