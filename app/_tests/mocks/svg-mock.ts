/**
 * SVG Mock for Jest Tests
 *
 * Mocks SVG imports to return a simple React component
 * that renders as a testable element.
 */

import React from 'react';
import { View, ViewProps } from 'react-native';

interface SvgMockProps extends ViewProps {
  testID?: string;
  accessibilityLabel?: string;
}

const SvgMock: React.FC<SvgMockProps> = (props) => {
  return React.createElement(View, {
    ...props,
    testID: props.testID || 'svg-mock',
    accessibilityLabel: props.accessibilityLabel || 'SVG Image',
  });
};

SvgMock.displayName = 'SvgMock';

export default SvgMock;
