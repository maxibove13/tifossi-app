import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import PlusCircle from '../../assets/icons/plus_circle.svg';
import SubheaderClose from '../_components/common/SubheaderClose';
import RadioButton from '../_components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius, layout, components } from '../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';

// Import services
import addressService, { Address } from '../_services/address/addressService';
import { useAuthStore } from '../_stores/authStore';
import { usePaymentStore } from '../_stores/paymentStore';

export default function ShippingAddressScreen() {
  const { token } = useAuthStore();
  const closeCheckoutFlow = usePaymentStore((state) => state.closeCheckoutFlow);
  const setSelectedAddressInStore = usePaymentStore((state) => state.setSelectedAddress);
  const setSelectedStore = usePaymentStore((state) => state.setSelectedStore);

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses whenever screen comes into focus (including returning from new-address)
  useFocusEffect(
    useCallback(() => {
      const fetchAddresses = async () => {
        if (!token) {
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setError(null);
          addressService.setAuthToken(token);
          const userAddresses = await addressService.fetchUserAddresses();
          setAddresses(userAddresses);

          // Select default address or first address (using index)
          const defaultIndex = userAddresses.findIndex((addr) => addr.isDefault);
          if (defaultIndex >= 0) {
            setSelectedAddress(defaultIndex);
          } else if (userAddresses.length > 0) {
            setSelectedAddress(0);
          }
        } catch {
          setError('Failed to load addresses. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchAddresses();
    }, [token])
  );

  const handleAddressSelect = (index: number) => {
    setSelectedAddress(index);
  };

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (selectedAddress !== null && addresses[selectedAddress]) {
      // Clear any stale store selection since we're doing delivery
      setSelectedStore(null);
      // Store selected address in payment store and navigate
      setSelectedAddressInStore(addresses[selectedAddress]);
      router.push('/checkout/payment-selection');
    }
  };

  const handleAddNewAddress = () => {
    // Navigate to add new address screen
    router.navigate('/checkout/new-address' as any);
  };

  const handleClose = () => {
    closeCheckoutFlow();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <SubheaderClose
        title="Direcciones de envío"
        onClose={handleClose}
        closeTestID="address-close-button"
      />

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando direcciones...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  // Retry loading addresses
                  setError(null);
                  const fetchAddresses = async () => {
                    if (!token) return;
                    try {
                      setIsLoading(true);
                      addressService.setAuthToken(token);
                      const userAddresses = await addressService.fetchUserAddresses();
                      setAddresses(userAddresses);
                    } catch {
                      setError('Failed to load addresses. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  fetchAddresses();
                }}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : addresses.length > 0 ? (
            <>
              <View style={styles.addressesContainer}>
                <Text style={styles.sectionTitle}>Mis direcciones</Text>

                <View style={styles.addressList}>
                  {addresses.map((address, index) => (
                    <TouchableOpacity
                      key={index}
                      testID={`address-item-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel="address-item"
                      style={styles.addressItem}
                      onPress={() => handleAddressSelect(index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressText}>
                          {addressService.formatAddressDisplay(address)}
                        </Text>
                        {address.isDefault && <Text style={styles.defaultBadge}>Por defecto</Text>}
                      </View>
                      <RadioButton selected={selectedAddress === index} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.addAddressContainer}>
                <TouchableOpacity
                  testID="address-add-button"
                  accessibilityRole="button"
                  accessibilityLabel="address-add-button"
                  style={styles.addAddressButton}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.7}
                >
                  <PlusCircle width={20} height={20} stroke={colors.primary} strokeWidth={1.6} />
                  <Text style={styles.addAddressText}>Añadir dirección nueva</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.noAddressContainer}>
                <Text style={styles.noAddressTitle}>
                  Parece que no tienes ninguna dirección guardada.
                </Text>
                <Text style={styles.noAddressSubtitle}>
                  Adiciona tu dirección de envío preferida para recibir tus pedidos.
                </Text>
              </View>

              <View style={styles.addAddressEmptyContainer}>
                <TouchableOpacity
                  testID="address-add-button"
                  accessibilityRole="button"
                  accessibilityLabel="address-add-button"
                  style={styles.addAddressButton}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.7}
                >
                  <PlusCircle width={20} height={20} stroke={colors.primary} strokeWidth={1.6} />
                  <Text style={styles.addAddressText}>Adicionar dirección nueva</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          testID="address-next-button"
          accessibilityRole="button"
          accessibilityLabel="address-next-button"
          style={[
            styles.primaryButton,
            selectedAddress === null && addresses.length > 0 && styles.disabledButton,
          ]}
          onPress={handleNext}
          activeOpacity={0.7}
          disabled={selectedAddress === null && addresses.length > 0}
        >
          <LinearGradient
            colors={colors.button.defaultGradient}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </LinearGradient>
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
  content: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  addressesContainer: ViewStyle;
  noAddressContainer: ViewStyle;
  noAddressTitle: TextStyle;
  noAddressSubtitle: TextStyle;
  sectionTitle: TextStyle;
  addressList: ViewStyle;
  addressItem: ViewStyle;
  addressInfo: ViewStyle;
  addressText: TextStyle;
  defaultBadge: TextStyle;
  addAddressContainer: ViewStyle;
  addAddressEmptyContainer: ViewStyle;
  addAddressButton: ViewStyle;
  addAddressText: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonGradient: ViewStyle;
  disabledButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  addressesContainer: {
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  noAddressContainer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  noAddressTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  noAddressSubtitle: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.secondary,
  },
  addressList: {
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
    color: colors.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.background.light,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addressInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  addressText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  defaultBadge: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: colors.primary,
    marginTop: spacing.xs / 2,
  },
  addAddressContainer: {
    paddingHorizontal: spacing.xxl,
  },
  addAddressEmptyContainer: {
    paddingHorizontal: spacing.xxl,
  },
  addAddressButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xxl,
  },
  addAddressText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: layout.safeAreaBottom,
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
  },
  disabledButton: {
    opacity: 0.5,
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
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});
