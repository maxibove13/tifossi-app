// Import the function from test.ts
import { test } from './test';

describe('Test Function', () => {
  it('returns the value 5', () => {
    // Call the test function
    const result = test();

    // Assert that it returns 5
    expect(result).toBe(5);
  });
});
