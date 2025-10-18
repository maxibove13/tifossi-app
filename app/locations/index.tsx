import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import CloseIcon from '../../assets/icons/close.svg';
import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fontWeights, fonts, fontSizes, lineHeights } from '../_styles/typography';
import { StoreDetails } from '../_types';
import apiManager from '../_services/api';

// Group stores by city
const groupStoresByCity = (stores: StoreDetails[]) => {
  const grouped: { [key: string]: { name: string; stores: StoreDetails[] } } = {};

  stores.forEach((store) => {
    const cityName =
      store.cityId === 'mvd'
        ? 'Montevideo'
        : store.cityId === 'pde'
          ? 'Punta del Este'
          : store.cityId;

    if (!grouped[store.cityId]) {
      grouped[store.cityId] = {
        name: cityName,
        stores: [],
      };
    }
    grouped[store.cityId].stores.push(store);
  });

  return grouped;
};

export default function StoreListScreen() {
  const [stores, setStores] = useState<StoreDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedStores = await apiManager.fetchStores();
      setStores(fetchedStores);
    } catch (err) {
      setError('Error al cargar las tiendas');
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedStores = groupStoresByCity(stores);

  const handleStorePress = (store: StoreDetails) => {
    router.push(
      `/locations/${encodeURIComponent(store.cityId)}/${encodeURIComponent(store.zoneId)}`
    );
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Nuestras Tiendas</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tiendas...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStores}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay tiendas disponibles en este momento</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
          {Object.entries(groupedStores).map(([cityId, cityData]) => (
            <View key={cityId} style={styles.citySection}>
              <Text style={styles.cityTitle}>{cityData.name}</Text>

              {cityData.stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => handleStorePress(store)}
                  activeOpacity={0.7}
                >
                  <Image source={store.image} style={styles.storeImage} resizeMode="cover" />
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <Text style={styles.storeAddress}>{store.address}</Text>
                    <Text style={styles.storeHours}>{store.hours}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    paddingTop: 54,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl * 1.4,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  citySection: {
    marginBottom: spacing.xl,
  },
  cityTitle: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  storeCard: {
    backgroundColor: colors.background.light,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeImage: {
    width: '100%',
    height: 180,
  },
  storeInfo: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  storeName: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  storeAddress: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm * 1.43,
    color: colors.secondary,
  },
  storeHours: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm * 1.43,
    color: colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.circle,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
});
