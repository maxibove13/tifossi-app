import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../../_styles/colors';

type TextVariant = 'title' | 'body' | 'caption' | 'link';

type TextProps = {
  variant?: TextVariant;
  children: React.ReactNode;
  style?: TextStyle;
};

export default function Text({ variant = 'body', children, style }: TextProps) {
  return (
    <RNText style={[styles[variant], style]}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.primary,
    fontFamily: 'Roboto',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
    fontFamily: 'Inter',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
    fontFamily: 'Inter',
  },
  link: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
}); 