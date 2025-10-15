#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Fixing unused imports in TypeScript files...');

try {
  execSync('npx eslint --ext .ts,.tsx . --fix', { stdio: 'inherit' });
  console.log('\n✅ Fixed unused imports successfully!');
} catch (error) {
  console.error('\n❌ Failed to fix some issues:', error.message);
  process.exit(1);
}
