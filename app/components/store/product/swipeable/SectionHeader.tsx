import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography } from './styles';

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
        <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  title: TextStyle;
  actionButton: ViewStyle;
  actionText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: '400',
    fontSize: typography.heading.fontSize,
    color: colors.primary.text,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  actionText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.secondary.text,
    textDecorationLine: 'underline',
  },
});