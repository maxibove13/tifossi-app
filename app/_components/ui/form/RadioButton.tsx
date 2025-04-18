import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface RadioButtonProps {
  selected: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function RadioButton({ selected, disabled = false, style }: RadioButtonProps) {
  return (
    <View
      style={[
        styles.radioButton,
        selected && styles.radioButtonSelected,
        disabled && styles.radioButtonDisabled,
        style,
      ]}
    >
      {selected && (
        <View style={[styles.radioButtonInner, disabled && styles.radioButtonInnerDisabled]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.6,
    borderColor: '#DCDCDC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#0C0C0C',
  },
  radioButtonDisabled: {
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#367C39',
  },
  radioButtonInnerDisabled: {
    backgroundColor: '#A0A0A0',
  },
});
