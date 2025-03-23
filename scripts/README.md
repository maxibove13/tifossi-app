# Pre-commit Hooks and Code Quality Scripts

This directory contains scripts to help maintain code quality in the Tifossi project.

## Available Scripts

### 1. `npm run precommit-check`

Runs the same checks that would run during the git pre-commit hook, but you can run it manually before committing to ensure your changes will pass the checks.

```bash
npm run precommit-check
```

### 2. `npm run check-all`

Runs all code quality checks on the entire codebase, not just staged files:
- Prettier formatting
- ESLint
- TypeScript type checking
- Tests

```bash
npm run check-all
```

### 3. `npm run fix-imports`

Automatically fixes unused imports across the codebase.

```bash
npm run fix-imports
```

## Pre-commit Hook

The pre-commit hook runs automatically when you try to commit changes. It:
- Formats code with Prettier
- Runs ESLint (including checking for unused imports)
- Runs TypeScript type checking
- Runs tests related to changed files

## Unused Imports

The codebase is configured to:
- Flag unused imports as errors (will prevent commits)
- Flag unused variables as warnings (will not prevent commits)
- Allow unused variables that start with underscore (e.g., `_unusedVar`)

If you have an unused variable that needs to be kept for some reason, prefix it with an underscore:

```typescript
// This won't cause an error
const _unusedVariable = 'This is kept for a reason';
``` 