import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../../styles/colors';
import { fonts, fontSizes, fontWeights } from '../../../../styles/typography';
import { spacing, radius } from '../../../../styles/spacing';

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  darkMode?: boolean;
}

export default function Counter({ 
  value, 
  onChange, 
  min = 1, 
  max = 99,
  darkMode = false
}: CounterProps) {
  
  const increment = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };
  
  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, darkMode && styles.labelDark]}>Quantity</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            darkMode && styles.buttonDark,
            value <= min && styles.buttonDisabled,
            value <= min && darkMode && styles.buttonDisabledDark
          ]} 
          onPress={decrement}
          disabled={value <= min}
        >
          <Feather 
            name="minus" 
            size={16} 
            color={
              value <= min 
                ? darkMode ? '#B1B1B1' : colors.secondary 
                : darkMode ? colors.background.light : colors.primary
            } 
          />
        </TouchableOpacity>
        
        <View style={[styles.valueContainer, darkMode && styles.valueContainerDark]}>
          <Text style={[styles.value, darkMode && styles.valueDark]}>{value}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            darkMode && styles.buttonDark,
            value >= max && styles.buttonDisabled,
            value >= max && darkMode && styles.buttonDisabledDark
          ]} 
          onPress={increment}
          disabled={value >= max}
        >
          <Feather 
            name="plus" 
            size={16} 
            color={
              value >= max 
                ? darkMode ? '#B1B1B1' : colors.secondary 
                : darkMode ? colors.background.light : colors.primary
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
    marginBottom: spacing.sm,
    fontFamily: fonts.secondary,
  },
  labelDark: {
    color: '#B1B1B1', // Light gray as per Figma
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  button: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDark: {
    borderColor: '#B1B1B1', // Light gray as per Figma
  },
  buttonDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  buttonDisabledDark: {
    borderColor: '#B1B1B1',
    opacity: 0.3,
  },
  valueContainer: {
    width: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  valueContainerDark: {
    borderColor: '#B1B1B1', // Light gray as per Figma
  },
  value: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    fontFamily: fonts.secondary,
  },
  valueDark: {
    color: colors.background.light,
  },
}); 