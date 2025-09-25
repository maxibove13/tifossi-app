/**
 * Smoke Test
 * Basic test to verify test infrastructure is working
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// Simple test component
function TestComponent() {
  return (
    <View>
      <Text>Test Component</Text>
    </View>
  );
}

describe('Smoke Test', () => {
  it('should render a simple component', () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText('Test Component')).toBeTruthy();
  });

  it('should perform basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBe(true);
    expect('hello').toContain('ell');
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});
