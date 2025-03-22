import React from 'react';
import { SvgProps } from 'react-native-svg';

// Re-export the SVG type information that's in the declaration file
export type SvgComponent = React.FC<SvgProps>;

// Helper function to handle SVG props
export function withSvgProps(Component: SvgComponent, props: Partial<SvgProps>): SvgComponent {
  return (componentProps: SvgProps) => React.createElement(Component, { ...props, ...componentProps });
}

// Add default export to fix router warnings
const svgUtils = {
  name: 'SvgUtils',
  version: '1.0.0',
  withSvgProps
};

export default svgUtils;