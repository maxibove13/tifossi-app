/**
 * Minimal globals setup - runs before any imports via setupFiles
 * This must be loaded via setupFiles (not setupFilesAfterEnv) to ensure
 * globals are defined before any module imports.
 */

// React Native __DEV__ global
(global as any).__DEV__ = true;
