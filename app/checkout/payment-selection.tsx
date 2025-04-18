import React, { useState } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import RadioButton from '../_components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fontWeights } from '../_styles/typography';

interface PaymentMethod {
  id: string;
  name: string;
  icon: ImageSourcePropType;
  hasChevron: boolean;
}

export default function PaymentSelectionScreen() {
  const _params = useLocalSearchParams();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Default payment methods
  const defaultPaymentMethods: PaymentMethod[] = [
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      icon: require('../../assets/images/payment/mercadopago_icon.png'),
      hasChevron: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: require('../../assets/images/payment/paypal_icon.png'),
      hasChevron: true,
    },
  ];

  // Other payment methods
  const otherPaymentMethods: PaymentMethod[] = [
    {
      id: 'tiffosi',
      name: 'Crédito Tiffosi',
      icon: require('../../assets/images/logo/tiffosi.png'),
      hasChevron: true,
    },
    {
      id: 'efectivo',
      name: 'Efectivo',
      icon: require('../../assets/images/payment/cash.png'),
      hasChevron: true,
    },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleBack = () => {
    // Navigate back to the shipping address screen
    router.back();
  };

  const handleSave = () => {
    if (selectedPaymentMethod) {
      // In a real app, you would save the selected payment method
      router.navigate('/(tabs)');
    }
  };

  const handleClose = () => {
    // Navigate back to the product screen or wherever the flow started
    router.navigate('/(tabs)');
  };

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
              {defaultPaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.paymentMethodItem}
                  onPress={() => handlePaymentMethodSelect(method.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodInfo}>
                    <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
                    <Text style={styles.paymentMethodText}>{method.name}</Text>
                  </View>
                  <RadioButton selected={selectedPaymentMethod === method.id} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Other Payment Methods */}
          <View style={styles.paymentMethodsContainer}>
            <Text style={styles.sectionTitle}>Otros métodos</Text>

            <View style={styles.paymentMethodsList}>
              {otherPaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.paymentMethodItem}
                  onPress={() => handlePaymentMethodSelect(method.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodInfo}>
                    <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
                    <Text style={styles.paymentMethodText}>{method.name}</Text>
                  </View>
                  <RadioButton selected={selectedPaymentMethod === method.id} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, !selectedPaymentMethod && styles.disabledButton]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={!selectedPaymentMethod}
        >
          <Text style={styles.primaryButtonText}>Guardar</Text>
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
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
