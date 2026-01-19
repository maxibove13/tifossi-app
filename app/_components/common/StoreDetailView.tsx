import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import SubheaderClose from './SubheaderClose';

import { colors } from '../../_styles/colors';
import { spacing, radius, layout } from '../../_styles/spacing';
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
  closeTestID?: string;
}

export default function StoreDetailView({
  store,
  title,
  onClose,
  onConfirm,
  onBack,
  confirmLabel = 'Confirmar',
  backLabel = 'Atrás',
  closeTestID,
}: StoreDetailViewProps) {
  const showActions = onConfirm || onBack;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <SubheaderClose title={title || store.name} onClose={onClose} closeTestID={closeTestID} />

        <View style={styles.contentContainer}>
          <Image source={store.image} style={styles.storeImage} resizeMode="cover" />
          <View style={styles.storeTextContainer}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <Text style={styles.storeHours}>{store.hours}</Text>
          </View>
        </View>

        {showActions && (
          <View style={[styles.actionButtons, !onConfirm && styles.actionButtonsCentered]}>
            {onConfirm && (
              <TouchableOpacity
                onPress={onConfirm}
                activeOpacity={0.8}
                style={styles.buttonTouchable}
              >
                <LinearGradient colors={colors.button.defaultGradient} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {onBack && (
              <TouchableOpacity
                style={[styles.secondaryButton, onConfirm && styles.buttonTouchable]}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>{backLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

type Styles = {
  safeArea: ViewStyle;
  container: ViewStyle;
  contentContainer: ViewStyle;
  storeImage: ImageStyle;
  storeTextContainer: ViewStyle;
  storeName: TextStyle;
  storeAddress: TextStyle;
  storeHours: TextStyle;
  actionButtons: ViewStyle;
  actionButtonsCentered: ViewStyle;
  buttonTouchable: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
  },
  container: {
    flex: 1,
    paddingTop: layout.subheaderScreenTop,
    paddingBottom: layout.safeAreaBottom,
    gap: 40,
  },
  contentContainer: {
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  storeImage: {
    width: '100%',
    flex: 1,
    borderRadius: radius.xs,
  },
  storeTextContainer: {
    paddingHorizontal: spacing.xs,
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
    paddingHorizontal: spacing.lg,
  },
  actionButtonsCentered: {
    alignItems: 'center',
  },
  buttonTouchable: {
    alignSelf: 'stretch',
  },
  primaryButton: {
    borderRadius: radius.xxl,
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
    borderRadius: radius.xxl,
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
