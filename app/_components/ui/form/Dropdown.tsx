import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../_styles/colors';
import { spacing } from '../../../_styles/spacing';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { radius } from '../../../_styles/spacing';
import { LinearGradient } from 'expo-linear-gradient';

interface DropdownProps {
  label: string;
  onPress: () => void;
}

export default function Dropdown({ label, onPress }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      onPress();
    }
  };

  const handleApply = () => {
    // Handle apply action
    setIsOpen(false);
    onPress();
  };

  return (
    <View style={[styles.wrapper, isOpen && styles.wrapperOpened]}>
      <TouchableOpacity onPress={handleToggle} style={styles.header} activeOpacity={0.7}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Ingresa texto"
              placeholderTextColor={colors.secondary}
            />
          </View>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <LinearGradient colors={['#373737', '#0C0C0C']} style={StyleSheet.absoluteFill} />
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background.light,
    padding: spacing.sm,
  },
  wrapperOpened: {
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xxl, // 32px gap between input and button
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    height: 40,
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    paddingHorizontal: spacing.lg,
    height: '100%',
  },
  applyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.background.light,
  },
});
