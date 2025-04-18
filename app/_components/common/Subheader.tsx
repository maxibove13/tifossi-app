import { StyleSheet, View, Text, Pressable } from 'react-native';
import { colors } from '../../_styles/colors';
import { spacing } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights } from '../../_styles/typography';

type SubheaderProps = {
  title: string;
  buttonText?: string;
  onButtonPress?: () => void;
  darkMode?: boolean;
};

export default function Subheader({
  title,
  buttonText,
  onButtonPress,
  darkMode = false,
}: SubheaderProps) {
  return (
    <View style={styles.container}>
      <Text
        style={[styles.title, darkMode && styles.titleDark]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      {buttonText && onButtonPress && (
        <Pressable onPress={onButtonPress}>
          <Text
            style={[styles.buttonText, darkMode && styles.buttonTextDark]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {buttonText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: colors.primary,
    fontSize: fontSizes.xl,
    fontFamily: fonts.primary,
    fontWeight: '400',
    lineHeight: (lineHeights.xl * 1.4) / ((fontSizes.xl * 1.4) / 20),
  },
  titleDark: {
    color: colors.background.light,
  },
  buttonText: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: (lineHeights.sm * 1.333) / ((fontSizes.sm * 1.333) / 12),
    textDecorationLine: 'underline',
  },
  buttonTextDark: {
    color: colors.background.light,
  },
});
