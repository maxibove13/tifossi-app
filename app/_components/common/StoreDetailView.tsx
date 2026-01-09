import React from 'react';
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
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CloseIcon from '../../../assets/icons/close.svg';

import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { fontWeights, fonts, fontSizes, lineHeights } from '../../_styles/typography';
import { StoreDetails } from '../../_types';

interface StoreDetailViewProps {
  store: StoreDetails;
  title?: string;
  onClose: () => void;
  onConfirm?: () => void;
  onBack?: () => void;
  confirmLabel?: string;
  backLabel?: string;
}

export default function StoreDetailView({
  store,
  title,
  onClose,
  onConfirm,
  onBack,
  confirmLabel = 'Confirmar',
  backLabel = 'Atrás',
}: StoreDetailViewProps) {
  const showActions = onConfirm || onBack;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>{title || store.name}</Text>
        <TouchableOpacity
          testID="store-detail-close-button"
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <CloseIcon width={20} height={20} stroke={colors.secondary} strokeWidth={1.2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.storeDetailsContainer}>
          <Image source={store.image} style={styles.storeImage} resizeMode="cover" />
          <View style={styles.storeTextContainer}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <Text style={styles.storeHours}>{store.hours}</Text>
          </View>
        </View>
      </ScrollView>

      {showActions && (
        <View style={styles.actionButtons}>
          {onConfirm && (
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.8}>
              <LinearGradient colors={colors.button.defaultGradient} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {onBack && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>{backLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  storeName: TextStyle;
  storeAddress: TextStyle;
  storeHours: TextStyle;
  actionButtons: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
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
    lineHeight: lineHeights.xl,
    color: colors.secondary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  storeDetailsContainer: {
    borderRadius: radius.xs,
    overflow: 'hidden',
    flex: 1,
  },
  storeImage: {
    width: '100%',
    height: 394,
  },
  storeTextContainer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  storeName: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  storeAddress: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
    color: colors.gray800,
  },
  storeHours: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  actionButtons: {
    gap: spacing.sm,
    alignItems: 'center',
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
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.background.offWhite,
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
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
});
