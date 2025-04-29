// Featured design tokens
// These are used for featured components that need special styling

export const featuredColors = {
  background: '#f8f8f8',
  accent: '#0c0c0c',
  text: '#fbfbfb',
  highlight: '#f6695e',
};

export const featuredSpacing = {
  base: 8,
  small: 4,
  medium: 16,
  large: 24,
};

export const featuredTypography = {
  title: {
    fontWeight: '500',
    fontSize: 16,
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 14,
  },
  body: {
    fontWeight: '400',
    fontSize: 12,
  },
};

// Add default export to fix router warnings
const featuredTokens = {
  colors: featuredColors,
  spacing: featuredSpacing,
  typography: featuredTypography,
};

export default featuredTokens;
