import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import CloseIcon from '../../../assets/icons/close.svg';
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { fontWeights, fonts, fontSizes, lineHeights } from '../../_styles/typography';
import { StoreDetails } from '../../_types';
import { storesData } from '../../_data/stores';

export default function LocationStoreInfoScreen() {
  const { cityId, zoneId } = useLocalSearchParams<{ cityId: string; zoneId: string }>();

  const store = useMemo(() => {
    if (!cityId || !zoneId) return undefined;
    return storesData.find((s: StoreDetails) => s.cityId === cityId && s.zoneId === zoneId);
  }, [cityId, zoneId]);

  const handleClose = () => {
    router.back();
  };

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Tienda no encontrada.</Text>
        <TouchableOpacity onPress={handleClose}>
          <Text>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.title}>{store.name}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.storeDetailsContainer}>
          <Image source={store.image} style={styles.storeImage} resizeMode="cover" />
          <View style={styles.storeTextContainer}>
            <View style={styles.storeInfoRow}>
              <Text style={styles.storeAddress}>{store.address}</Text>
            </View>
            <View style={styles.storeInfoRow}>
              <Text style={styles.storeHours}>{store.hours}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    paddingTop: 54,
    paddingBottom: 34,
  },
  scrollView: {
    flex: 1,
    marginBottom: 40,
    paddingHorizontal: spacing.lg,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 40,
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
  storeDetailsContainer: {
    backgroundColor: colors.background.light,
    borderRadius: radius.xs,
    overflow: 'hidden',
    flex: 1,
  },
  storeImage: {
    width: '100%',
    height: 394,
  },
  storeTextContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  storeInfoRow: {},
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
  errorText: {
    color: colors.error,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
