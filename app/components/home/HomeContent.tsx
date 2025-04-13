import { StyleSheet, View, Text, Pressable } from 'react-native';
import ArrowRightIcon from '../../../assets/icons/arrow_right_lg.svg';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../styles/typography';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';

type HomeContentProps = {
  onStorePress: () => void;
};

export default function HomeContent({ onStorePress }: HomeContentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Envíos gratis, productos exclusivos, lo mejor de Tiffosi, personalizado para ti.
      </Text>
      <View style={styles.buttonWrapper}>
        <Pressable style={styles.button} onPress={onStorePress}>
          <Text style={styles.buttonText}>Ir a Tienda</Text>
          <ArrowRightIcon width={24} height={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.xxl,
  },
  message: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.background.light,
    fontFamily: fonts.primary,
    fontWeight: fontWeights.medium,
  },
  buttonWrapper: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    borderRadius: radius.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  buttonText: {
    color: colors.background.light,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
});
