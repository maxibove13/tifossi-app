#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running code quality checks on all TypeScript files...');

// Get all TypeScript files in the project (excluding node_modules)
const getAllTsFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

const runChecks = () => {
  try {
    // Run prettier on all files
    console.log('Running Prettier...');
    execSync('npx prettier --write "**/*.{ts,tsx}"', { stdio: 'inherit' });
    
    // Run ESLint on all files
    console.log('\nRunning ESLint...');
    execSync('npx eslint --ext .ts,.tsx .', { stdio: 'inherit' });
    
    // Run TypeScript type checking
    console.log('\nRunning TypeScript type checking...');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    
    // Run Jest tests
    console.log('\nRunning tests...');
    execSync('npm test -- --watchAll=false', { stdio: 'inherit' });
    
    console.log('\n✅ All checks completed successfully!');
  } catch (error) {
    console.error('\n❌ Some checks failed:', error.message);
    process.exit(1);
  }
};

runChecks(); 