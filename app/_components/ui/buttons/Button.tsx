import { useState } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'solo-icon';

type ButtonProps = {
  onPress?: () => void;
  text?: string;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function Button({
  onPress,
  text,
  variant = 'primary',
  icon,
  disabled = false,
  style,
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isPrimary = variant === 'primary';
  const isIcon = variant === 'icon';

  if (isPrimary || isIcon) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.base,
          styles[variant],
          isPressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={
            disabled
              ? ['#DCDCDC', '#DCDCDC']
              : isPressed
                ? ['#424242', '#424242']
                : ['#373737', '#0C0C0C']
          }
          style={StyleSheet.absoluteFill}
        />
        {icon && <Ionicons name={icon} size={24} color={disabled ? '#B1B1B1' : '#FBFBFB'} />}
        {text && <Text style={[styles.text, disabled && styles.textDisabled]}>{text}</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={24} color="#0C0C0C" />}
      {text && <Text style={styles.text}>{text}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  secondary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  secondaryPressed: {
    backgroundColor: '#DCDCDC',
  },
  icon: {
    padding: 8,
    borderRadius: 40,
  },
  'solo-icon': {
    padding: 8,
    borderRadius: 4,
  },
  'solo-iconPressed': {
    backgroundColor: '#DCDCDC',
  },
  pressed: {
    backgroundColor: '#424242',
  },
  disabled: {
    backgroundColor: '#DCDCDC',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 24,
    color: '#FBFBFB',
  },
  textDisabled: {
    color: '#B1B1B1',
  },
});
