import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import PlusCircle from '../../assets/icons/plus_circle.svg';
import RadioButton from '../components/ui/form/RadioButton';

// Import style tokens
import { colors } from '../styles/colors';
import { spacing, radius } from '../styles/spacing';
import { fontWeights } from '../styles/typography';

interface Address {
  id: string;
  name: string;
}

export default function ShippingAddressScreen() {
  const _params = useLocalSearchParams();
  // Extract product info from params if needed

  const [selectedAddress, setSelectedAddress] = useState<string>('');

  // Use useMemo to prevent recreating the array on every render
  const addresses = useMemo<Address[]>(
    () => [
      {
        id: '1',
        name: 'Calle Principal 123, Piso 2B, Madrid, España',
      },
    ],
    []
  );

  // Select the first address by default
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0].id);
    }
  }, [addresses, selectedAddress]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddress(addressId);
  };

  const handleBack = () => {
    // Navigate back to the previous screen
    router.back();
  };

  const handleNext = () => {
    if (selectedAddress) {
      // In a real app, you would save the selected address
      // Navigate to payment selection screen
      router.navigate('/checkout/payment-selection');
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
      <View style={styles.header}>
        <Text style={styles.title}>Direcciones de envío</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {addresses.length > 0 ? (
            <>
              <View style={styles.addressesContainer}>
                <Text style={styles.sectionTitle}>Mis direcciones</Text>

                <View style={styles.addressList}>
                  {addresses.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.addressItem}
                      onPress={() => handleAddressSelect(address.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addressText}>{address.name}</Text>
                      <RadioButton selected={selectedAddress === address.id} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.addAddressContainer}>
                <TouchableOpacity
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
          style={[
            styles.primaryButton,
            !selectedAddress && addresses.length > 0 && styles.disabledButton,
          ]}
          onPress={handleNext}
          activeOpacity={0.7}
          disabled={!selectedAddress && addresses.length > 0}
        >
          <Text style={styles.primaryButtonText}>Siguiente</Text>
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
  addressesContainer: ViewStyle;
  noAddressContainer: ViewStyle;
  noAddressTitle: TextStyle;
  noAddressSubtitle: TextStyle;
  sectionTitle: TextStyle;
  addressList: ViewStyle;
  addressItem: ViewStyle;
  addressText: TextStyle;
  addAddressContainer: ViewStyle;
  addAddressEmptyContainer: ViewStyle;
  addAddressButton: ViewStyle;
  addAddressText: TextStyle;
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
  addressesContainer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  noAddressContainer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl + spacing.lg,
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
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  addressText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    color: '#0C0C0C',
  },
  addAddressContainer: {
    paddingHorizontal: 48,
  },
  addAddressEmptyContainer: {
    paddingHorizontal: spacing.xl + spacing.lg,
  },
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
