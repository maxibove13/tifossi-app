declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Add default export to fix router warnings
const svgTypeDeclaration = {
  name: 'SVGTypeDeclaration',
  version: '1.0.0'
};

export default svgTypeDeclaration; 