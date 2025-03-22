import { StyleSheet, View, Text, Pressable } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../styles/typography';

type SubheaderProps = {
  title: string;
  buttonText?: string;
  onButtonPress?: () => void;
  darkMode?: boolean;
};

export default function Subheader({ title, buttonText, onButtonPress, darkMode = false }: SubheaderProps) {
  return (
    <View style={styles.container}>
      <Text 
        style={[styles.title, darkMode && styles.titleDark]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      {buttonText && (
        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.button}
            onPress={onButtonPress}
          >
            <Text 
              style={[styles.buttonText, darkMode && styles.buttonTextDark]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {buttonText}
            </Text>
          </Pressable>
        </View>
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
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    color: colors.primary,
    fontSize: fontSizes.xl,
    fontFamily: fonts.primary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
  },
  titleDark: {
    color: colors.background.light,
  },
  buttonContainer: {
    width: 50,
    alignSelf: 'stretch',
    paddingVertical: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  button: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    textDecorationLine: 'underline',
    lineHeight: lineHeights.sm,
  },
  buttonTextDark: {
    color: colors.background.light,
  },
}); 