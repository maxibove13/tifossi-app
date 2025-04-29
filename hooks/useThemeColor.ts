/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from './useColorScheme';

// Define a basic colors object for theming
const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: '#2f95dc',
    tabIconDefault: '#ccc',
    tabIconSelected: '#2f95dc',
    card: '#f5f5f5',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#fff',
    background: '#121212',
    tint: '#1B95E0',
    tabIconDefault: '#888',
    tabIconSelected: '#1B95E0',
    card: '#1e1e1e',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

export type ColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

export function useThemeColor(props: { light?: string; dark?: string }, colorName: ColorName) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
