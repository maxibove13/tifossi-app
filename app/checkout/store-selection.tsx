import React, { useMemo } from 'react';
import { Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { colors } from '../_styles/colors';
import { fontSizes } from '../_styles/typography';
import { spacing, layout } from '../_styles/spacing';

import { StoreDetails } from '../_types';
import { storesData } from '../_data/stores';
import { usePaymentStore } from '../_stores/paymentStore';
import { useAuthStore } from '../_stores/authStore';
import StoreDetailView from '../_components/common/StoreDetailView';

export default function StoreSelectionScreen() {
  const { cityId, zoneId } = useLocalSearchParams<{ cityId: string; zoneId?: string }>();
  const setSelectedStore = usePaymentStore((state) => state.setSelectedStore);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const store = useMemo(() => {
    return storesData.find((s: StoreDetails) => s.cityId === cityId && s.zoneId === zoneId);
  }, [cityId, zoneId]);

  const handleConfirm = () => {
    if (store) {
      setSelectedStore({
        id: store.id,
        cityId: store.cityId,
        zoneId: store.zoneId,
        name: store.name,
        address: store.address,
      });
    }
    // Guests need to provide contact info after store selection
    if (isLoggedIn) {
      router.push('/checkout/payment-selection');
    } else {
      router.push('/checkout/guest-contact-info');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    router.navigate('/(tabs)');
  };

  if (!store) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Tienda no encontrada.</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <StoreDetailView
      store={store}
      title="Seleccionar local"
      onClose={handleClose}
      onConfirm={handleConfirm}
      onBack={handleBack}
      closeTestID="store-detail-close-button"
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
    paddingTop: layout.subheaderScreenTop,
    paddingBottom: layout.safeAreaBottom,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
