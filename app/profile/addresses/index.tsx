import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import PlusCircle from '../../../assets/icons/plus_circle.svg';

import { colors } from '../../_styles/colors';
import { spacing, radius, layout, components } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../_styles/typography';
import { useAuthStore } from '../../_stores/authStore';
import addressService, { Address } from '../../_services/address/addressService';
import ReusableAuthPrompt from '../../_components/auth/AuthPrompt';

interface AddressItemProps {
  address: Address;
  index: number;
  onDelete: (index: number) => void;
  onSetDefault: (index: number) => void;
  isDeleting: boolean;
}

function AddressItem({ address, index, onDelete, onSetDefault, isDeleting }: AddressItemProps) {
  const handleDelete = () => {
    Alert.alert('Eliminar direccion', 'Estas seguro que deseas eliminar esta direccion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => onDelete(index),
      },
    ]);
  };

  return (
    <View style={styles.addressItem}>
      <View style={styles.addressInfo}>
        <Text style={styles.addressText}>{addressService.formatAddressDisplay(address)}</Text>
        {address.isDefault && <Text style={styles.defaultBadge}>Por defecto</Text>}
      </View>
      <View style={styles.addressActions}>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => onSetDefault(index)}
            activeOpacity={0.7}
          >
            <Feather name="check-circle" size={20} color={colors.secondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionIcon}
          onPress={handleDelete}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Feather name="trash-2" size={20} color={colors.error} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AddressesListScreen() {
  const { isLoggedIn, token } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchAddresses = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      addressService.setAuthToken(token);
      const fetchedAddresses = await addressService.fetchUserAddresses();

      if (currentRequestId !== requestIdRef.current) return;

      const sortedAddresses = [...fetchedAddresses].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return (a.id || 0) - (b.id || 0);
      });
      setAddresses(sortedAddresses);
    } catch {
      if (currentRequestId === requestIdRef.current) {
        setError('Error al cargar las direcciones. Intenta nuevamente.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && token) {
        fetchAddresses();
      } else if (isLoggedIn && !token) {
        setIsLoading(false);
      }
    }, [isLoggedIn, token, fetchAddresses])
  );

  const handleAddAddress = () => {
    router.push('/checkout/new-address');
  };

  const handleDelete = async (index: number) => {
    if (!token) return;

    setDeletingIndex(index);
    try {
      addressService.setAuthToken(token);
      await addressService.deleteAddress(index);
      await fetchAddresses();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la direccion. Intenta nuevamente.');
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleSetDefault = async (index: number) => {
    if (!token) return;

    try {
      addressService.setAuthToken(token);
      await addressService.setDefaultAddress(index);
      await fetchAddresses();
    } catch {
      Alert.alert('Error', 'No se pudo establecer como predeterminada. Intenta nuevamente.');
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.title}>Direcciones de envio</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Feather name="x" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>
        <ReusableAuthPrompt message="Inicia sesion para ver tus direcciones." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Direcciones de envio</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <Feather name="x" size={24} color={colors.secondary} />
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity style={styles.retryButton} onPress={fetchAddresses}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : addresses.length > 0 ? (
            <>
              <View style={styles.addressesContainer}>
                <Text style={styles.sectionTitle}>Mis direcciones</Text>
                <View style={styles.addressList}>
                  {addresses.map((address, index) => (
                    <AddressItem
                      key={`address-${address.id ?? index}`}
                      address={address}
                      index={address.id ?? index}
                      onDelete={handleDelete}
                      onSetDefault={handleSetDefault}
                      isDeleting={deletingIndex === (address.id ?? index)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.addAddressContainer}>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={handleAddAddress}
                  activeOpacity={0.7}
                >
                  <PlusCircle width={20} height={20} stroke={colors.primary} strokeWidth={1.6} />
                  <Text style={styles.addAddressText}>Adicionar dirección nueva</Text>
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
                  Adiciona tu dirección de envío preferida para facilitar tus futuras compras.
                </Text>
              </View>

              <View style={styles.addAddressEmptyContainer}>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={handleAddAddress}
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

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleClose} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
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
  addressActions: ViewStyle;
  actionIcon: ViewStyle;
  addAddressContainer: ViewStyle;
  addAddressEmptyContainer: ViewStyle;
  addAddressButton: ViewStyle;
  addAddressText: TextStyle;
  actionButtons: ViewStyle;
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  closeButton: {
    width: components.closeButton.width,
    height: components.closeButton.height,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xxl,
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxl,
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
  addressesContainer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  noAddressContainer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl + spacing.lg,
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
  addressActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIcon: {
    padding: spacing.xs,
  },
  addAddressContainer: {
    paddingHorizontal: spacing.xxl + spacing.lg,
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
