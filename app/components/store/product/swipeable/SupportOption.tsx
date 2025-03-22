import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from './styles';

interface SupportOptionProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export default function SupportOption({
  title,
  description,
  iconName,
  onPress
}: SupportOptionProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Ionicons name={iconName} size={24} color={colors.primary.text} />
    </TouchableOpacity>
  );
}

// Define type-safe styles
type Styles = {
  container: ViewStyle;
  textContainer: ViewStyle;
  title: TextStyle;
  description: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.overlay,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: '400', // Explicit value matching typography.heading.fontWeight
    fontSize: typography.heading.fontSize,
    color: colors.primary.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400', // Explicit value matching typography.body.fontWeight
    fontSize: typography.body.fontSize,
    color: colors.primary.text,
  },
});