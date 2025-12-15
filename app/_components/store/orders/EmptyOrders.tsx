import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../_styles/typography';
import { spacing, radius } from '../../../_styles/spacing';
import { colors } from '../../../_styles/colors';

interface EmptyOrdersProps {
  onGoToStore: () => void;
}

export default function EmptyOrders({ onGoToStore }: EmptyOrdersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>No tienes pedidos.</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Cuando realices una compra, tus pedidos aparecerán aquí.
          </Text>
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity onPress={onGoToStore} style={styles.buttonContainer} activeOpacity={0.8}>
          <LinearGradient
            colors={[...colors.button.defaultGradient]}
            locations={[0.25, 0.75]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Ir a Tienda</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.background.offWhite} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    width: '100%',
  },
  messageContainer: {
    paddingHorizontal: spacing.lg,
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
    width: '100%',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.regular,
    color: colors.primary,
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  descriptionContainer: {
    alignSelf: 'stretch',
  },
  description: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    color: colors.secondary,
    alignSelf: 'stretch',
  },
  buttonWrapper: {
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  buttonContainer: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  buttonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.medium,
    color: colors.background.offWhite,
  },
});
