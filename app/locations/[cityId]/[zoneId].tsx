import React, { useMemo } from 'react';
import { Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { colors } from '../../_styles/colors';
import { fontSizes } from '../../_styles/typography';
import { spacing } from '../../_styles/spacing';

import { StoreDetails } from '../../_types';
import { storesData } from '../../_data/stores';
import StoreDetailView from '../../_components/common/StoreDetailView';

const getCityDisplayName = (cityId: string): string => {
  if (cityId === 'mvd') return 'Montevideo';
  if (cityId === 'pde') return 'Punta del Este';
  return cityId;
};

export default function LocationStoreInfoScreen() {
  const { cityId, zoneId } = useLocalSearchParams<{ cityId: string; zoneId: string }>();

  const store = useMemo(() => {
    if (!cityId || !zoneId) return undefined;
    return storesData.find((s: StoreDetails) => s.cityId === cityId && s.zoneId === zoneId);
  }, [cityId, zoneId]);

  const handleClose = () => {
    router.navigate('/(tabs)');
  };

  const handleBack = () => {
    router.back();
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
      title={getCityDisplayName(cityId!)}
      onClose={handleClose}
      onBack={handleBack}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
    paddingTop: 54,
    paddingBottom: 34,
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
