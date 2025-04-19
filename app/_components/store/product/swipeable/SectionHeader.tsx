import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { colors } from '../../../../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../../../../_styles/typography';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  invertTitleColor?: boolean;
}

export default function SectionHeader({
  title,
  actionText,
  onActionPress,
  style,
  invertTitleColor = false,
}: SectionHeaderProps) {
  const titleColorStyle = {
    color: invertTitleColor ? colors.background.light : colors.primary,
  };

  const actionTextColor = invertTitleColor ? colors.secondary : colors.secondary;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, titleColorStyle]}>{title}</Text>
      {actionText && onActionPress && (
        <Pressable onPress={onActionPress}>
          <Text style={[styles.actionText, { color: actionTextColor }]}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: '400',
    lineHeight: (lineHeights.xl * 1.4) / ((fontSizes.xl * 1.4) / 20),
  },
  actionText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: (lineHeights.sm * 1.333) / ((fontSizes.sm * 1.333) / 12),
    textDecorationLine: 'underline',
  },
});
