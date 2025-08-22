/**
 * SVG Mock for Jest Tests
 * This mock handles all .svg file imports in tests
 */

import React from 'react';

// Mock SVG component that renders as a simple View with testID
const SvgMock = React.forwardRef((props, ref) => {
  const { testID, width = 24, height = 24, ...otherProps } = props;
  
  return React.createElement('View', {
    ref,
    testID: testID || 'svg-mock',
    style: {
      width: typeof width === 'string' ? parseInt(width) : width,
      height: typeof height === 'string' ? parseInt(height) : height,
      backgroundColor: 'transparent',
    },
    ...otherProps,
  });
});

SvgMock.displayName = 'SvgMock';

// Export default mock component
export default SvgMock;

// Named export for compatibility
export { SvgMock };