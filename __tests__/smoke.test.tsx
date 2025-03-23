import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

// A simple smoke test component
function SmokeTestComponent() {
  return (
    <View testID="smoke-test-container">
      <Text testID="smoke-test-text">Tifossi App is working!</Text>
    </View>
  );
}

// A basic smoke test
describe('Basic Smoke Test', () => {
  it('renders a simple component without crashing', () => {
    const { getByTestId } = render(<SmokeTestComponent />);

    // Verify the component rendered
    const container = getByTestId('smoke-test-container');
    const text = getByTestId('smoke-test-text');

    expect(container).toBeTruthy();
    expect(text).toBeTruthy();
    expect(text.props.children).toBe('Tifossi App is working!');
  });

  // Add an additional test
  it('test pre-commit hook', () => {
    expect(true).toBe(true);
  });
});
