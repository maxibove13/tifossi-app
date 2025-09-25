import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CloseIcon from '../../assets/icons/close.svg';

import { colors } from '../_styles/colors';
import { spacing, radius } from '../_styles/spacing';
import { fontWeights, fonts, fontSizes, lineHeights } from '../_styles/typography';

import { StoreDetails } from '../_types';
import { storesData } from '../_data/stores';

export default function StoreSelectionScreen() {
  const { cityId, zoneId } = useLocalSearchParams<{ cityId: string; zoneId?: string }>();

  const store = useMemo(() => {
    return storesData.find((s: StoreDetails) => s.cityId === cityId && s.zoneId === zoneId);
  }, [cityId, zoneId]);

  const handleConfirm = () => {
    router.push('/checkout/payment-selection');
  };

  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    router.navigate('/(tabs)');
  };

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Tienda no encontrada.</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Seleccionar local</Text>
        <TouchableOpacity
          testID="store-selection-close-button"
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.storeDetailsContainer}>
          <Image source={store.image} style={styles.storeImage} resizeMode="cover" />
          <View style={styles.storeTextContainer}>
            <View style={styles.storeInfoRow}>
              <Text style={styles.storeName}>{store.name}</Text>
            </View>
            <View style={styles.storeInfoRow}>
              <Text style={styles.storeAddress}>{store.address}</Text>
            </View>
            <View style={styles.storeInfoRow}>
              <Text style={styles.storeHours}>{store.hours}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.background.dark]}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Confirmar</Text>
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
  scrollContentContainer: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  storeDetailsContainer: ViewStyle;
  storeImage: ImageStyle;
  storeTextContainer: ViewStyle;
  storeInfoRow: ViewStyle;
  storeName: TextStyle;
  storeAddress: TextStyle;
  storeHours: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
  errorText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
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
  storeName: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md * 1.5,
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
  actionButtons: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    borderRadius: radius.circle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md * 1.5,
    color: colors.background.light,
  },
  secondaryButton: {
    borderRadius: radius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
  },
  secondaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md * 1.5,
    color: colors.primary,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
