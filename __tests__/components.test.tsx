import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// We'll rely on global mocks from setup.ts instead of mocking here
// to avoid the Jest scope issues

describe('Core Component Tests', () => {
  // Basic test for Text component
  it('renders Text components correctly', () => {
    const testMessage = 'Test Message';
    const { getByText } = render(<Text>{testMessage}</Text>);

    expect(getByText(testMessage)).toBeTruthy();
  });

  // Test for View component
  it('renders View components correctly', () => {
    const testID = 'test-view';
    const { getByTestId } = render(<View testID={testID} />);

    expect(getByTestId(testID)).toBeTruthy();
  });
});
