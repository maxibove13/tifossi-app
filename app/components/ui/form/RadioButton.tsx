import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface RadioButtonProps {
  selected: boolean;
  style?: ViewStyle;
}

export default function RadioButton({ selected, style }: RadioButtonProps) {
  return (
    <View style={[styles.radioButton, selected && styles.radioButtonSelected, style]}>
      {selected && <View style={styles.radioButtonInner} />}
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
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#367C39',
  },
}); 