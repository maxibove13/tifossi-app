import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { colors } from '../../../../styles/colors';
import { fonts, fontSizes, lineHeights } from '../../../../styles/typography';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export default function SectionHeader({
  title,
  actionText,
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionText && onActionPress && (
        <Pressable onPress={onActionPress}>
          <Text style={styles.actionText}>{actionText}</Text>
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
    color: colors.primary,
  },
  actionText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: (lineHeights.sm * 1.333) / ((fontSizes.sm * 1.333) / 12),
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
