import { StyleSheet, View, Text, Image, ViewStyle } from 'react-native';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { colors } from '../../../_styles/colors';
import { spacing } from '../../../_styles/spacing';

type FooterProps = {
  style?: ViewStyle;
};

export default function Footer({ style }: FooterProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.tagline}>Sos parte.</Text>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../../assets/images/logo/tiffosi.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.background.light,
    paddingTop: 64,
    paddingBottom: 16,
    gap: spacing.md,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tagline: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md * 1.4286,
    color: colors.primary,
    fontFamily: fonts.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoWrapper: {
    width: 75,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 2,
    opacity: 0.25,
  },
  logo: {
    width: 40,
    height: 40,
  },
});
