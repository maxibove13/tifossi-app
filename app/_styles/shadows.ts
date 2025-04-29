import { Platform } from 'react-native';

export const shadows = {
  button: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  small: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  medium: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  large: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
  },
};

export default shadows;
