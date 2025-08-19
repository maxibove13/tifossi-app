// Type declarations for Detox e2e tests
import 'detox';

declare global {
  namespace Detox {
    interface TestUtils {
      // Add any custom test utility methods here
      waitForAppStart(): Promise<void>;
      resetApp(): Promise<void>;
      login(email: string, password: string): Promise<void>;
      logout(): Promise<void>;
      clearData(): Promise<void>;
    }
  }

  // Global test utilities
  var testUtils: Detox.TestUtils;

  // Re-export Detox globals to avoid redeclaration errors
  var device: Detox.DetoxExportWrapper['device'];
  var expect: Detox.DetoxExportWrapper['expect'];
  var element: Detox.DetoxExportWrapper['element'];
  var by: Detox.DetoxExportWrapper['by'];
  var waitFor: Detox.DetoxExportWrapper['waitFor'];
}

export {};
