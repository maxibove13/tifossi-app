// SwipeableEdge styles based on Figma specification
export const colors = {
  primary: {
    background: '#0C0C0C',
    text: '#FBFBFB',
  },
  secondary: {
    text: '#DCDCDC',
    textDisabled: '#B1B1B1',
    gradientStart: '#E1E1E1',
    gradientEnd: '#A1A1A1',
    gradient: ['#E1E1E1', '#A1A1A1'] as const,
  },
  accent: {
    discount: '#F6695E',
    new: '#70BF73',
    lightGray: '#DCDCDC',
    mediumGray: '#707070',
  },
  border: '#DCDCDC',
  background: {
    light: '#FFFFFF',
    dark: '#0C0C0C',
    overlay: 'rgba(251, 251, 251, 0.25)',
    gradient: ['rgba(12, 12, 12, 0.95)', 'rgba(12, 12, 12, 1)'] as const
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 20,
  xxl: 24,
  circle: 100,
};

export const typography = {
  heading: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 20,
  },
  productTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
  },
  body: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
  },
  small: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
  },
  button: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
  },
};

// Add default export to avoid Expo Router warnings
// This isn't a component, so we export a non-component object
const stylesExport = {
  colors,
  spacing,
  radius,
  typography
};

export default stylesExport;