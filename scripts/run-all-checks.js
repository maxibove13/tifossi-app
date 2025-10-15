#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Running all quality checks...');

try {
  console.log('1. Running linting...');
  execSync('npm run lint', { stdio: 'inherit' });

  console.log('\n2. Running type checking...');
  execSync('npm run typecheck', { stdio: 'inherit' });

  console.log('\n3. Running tests...');
  execSync('npm run test:ci', { stdio: 'inherit' });

  console.log('\n✅ All checks passed!');
} catch (error) {
  console.error('\n❌ Some checks failed');
  process.exit(1);
}
