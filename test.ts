export function test(): number {
  const x: number = 5;
  if (x > 3) {
    console.log('test');
  }
  return x;
}

// Test file
console.log('Test pre-commit hook');
