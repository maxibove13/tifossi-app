import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface TabBarBackgroundProps {
  style?: ViewStyle;
}

/**
 * Background component for the tab bar with shadow and border radius
 */
export function TabBarBackground({ style }: TabBarBackgroundProps) {
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#121212' }, 'background');
  const shadowColor = useThemeColor(
    { light: 'rgba(0, 0, 0, 0.1)', dark: 'rgba(0, 0, 0, 0.5)' },
    'shadow'
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          shadowColor,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 83,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default TabBarBackground;
