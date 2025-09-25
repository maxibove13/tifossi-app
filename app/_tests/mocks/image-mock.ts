/**
 * Image Mock for Jest Tests
 *
 * Mocks image imports (png, jpg, jpeg, gif) to return a simple
 * React Native Image component that can be tested.
 */

import React from 'react';
import { Image, ImageProps } from 'react-native';

const ImageMock = React.forwardRef<Image, ImageProps>((props, ref) => {
  return React.createElement(Image, {
    ...props,
    ref,
    source: { uri: 'mocked-image-uri' },
    testID: props.testID || 'image-mock',
    accessibilityLabel: props.accessibilityLabel || 'Mocked Image',
  });
});

ImageMock.displayName = 'ImageMock';

export default ImageMock;
