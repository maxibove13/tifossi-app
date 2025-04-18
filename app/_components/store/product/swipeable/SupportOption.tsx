import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, typography, radius } from './styles';
import ChatBubble from '../../../../../assets/icons/chat-bubble.svg';
import HelpCircle from '../../../../../assets/icons/help-circle.svg';

interface SupportOptionProps {
  title: string;
  description: string;
  iconType: 'chat' | 'help';
  onPress: () => void;
}

const SupportIcon = ({ type, color }: { type: 'chat' | 'help', color: string }) => {
  const iconProps = {
    width: 24,
    height: 24,
    stroke: color,
    strokeWidth: 1.6
  };

  if (type === 'chat') {
    return <ChatBubble {...iconProps} />;
  } else {
    return <HelpCircle {...iconProps} />;
  }
};

export default function SupportOption({
  title,
  description,
  iconType,
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
      <SupportIcon type={iconType} color={colors.primary.text} />
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
    fontWeight: '400',
    fontSize: typography.heading.fontSize,
    color: colors.primary.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.primary.text,
  },
});