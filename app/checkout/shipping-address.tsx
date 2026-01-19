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
import { router, useLocalSearchParams, Stack } from 'expo-router';
import PlusCircle from '../../assets/icons/plus_circle.svg';
import SubheaderClose from '../_components/common/SubheaderClose';
import RadioButton from '../_components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../_styles/colors';
import { spacing, radius, layout } from '../_styles/spacing';
import { fontWeights } from '../_styles/typography';

// Import services
import addressService, { Address } from '../_services/address/addressService';
import { useAuthStore } from '../_stores/authStore';

export default function ShippingAddressScreen() {
  const _params = useLocalSearchParams();
  const { token } = useAuthStore();

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
    if (selectedAddress !== null) {
      // Pass selected address index to payment selection screen
      router.push({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: String(selectedAddress) },
      });
    }
  };

  const handleAddNewAddress = () => {
    // Navigate to add new address screen
    router.navigate('/checkout/new-address' as any);
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
                  <PlusCircle width={20} height={20} stroke="#0C0C0C" strokeWidth={1.6} />
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
    backgroundColor: '#FAFAFA',
    paddingTop: layout.subheaderScreenTop,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  addressesContainer: {
    gap: spacing.md,
  },
  noAddressContainer: {
    gap: spacing.sm,
  },
  noAddressTitle: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: fontWeights.regular,
    lineHeight: 28,
    color: '#0C0C0C',
  },
  noAddressSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    color: '#575757',
  },
  sectionTitle: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: '#707070',
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
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    color: colors.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
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
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
    color: colors.background.light,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  addressInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  addressText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#0C0C0C',
  },
  defaultBadge: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
    color: colors.primary,
    marginTop: spacing.xs / 2,
  },
  addAddressContainer: {},
  addAddressEmptyContainer: {},
  addAddressButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 24,
  },
  addAddressText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
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
