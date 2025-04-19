/**
 * Preload Service entry point
 *
 * This file exports the main service instance and all types
 * But imports and hooks are moved to separate files to avoid circular dependencies
 */

// Re-export service and types
import preloadServiceInstance from './service';
export * from './types';

// Export hooks for convenience (without creating circular dependencies)
export * from './hooks';
export * from './hoc';

// Default export is the service instance
export default preloadServiceInstance;

// Add a utility export to prevent Expo Router from treating this as a route
const utilityExport = {
  name: 'PreloadService',
  version: '1.0.0',
};

export { utilityExport };
