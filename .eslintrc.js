// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['unused-imports'],
  ignorePatterns: ['/dist/*', 'node_modules/', 'backend/', '*.js', '!.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'react/react-in-jsx-scope': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};
