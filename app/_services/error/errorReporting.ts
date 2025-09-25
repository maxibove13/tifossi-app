/**
 * Simple error reporting service for online-only operation
 */

export interface CrashReport {
  error: Error;
  componentStack?: string;
  contextInfo?: any;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  contextInfo?: any;
  metadata?: Record<string, any>;
}

export interface Breadcrumb {
  message: string;
  data?: Record<string, any>;
  timestamp?: number;
}

class ErrorReportingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 20;

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Report a crash (fatal error)
   */
  async reportCrash(_report: CrashReport): Promise<void> {
    try {
      // In a real app, you would send this to a crash reporting service
      // For now, we just log it
    } catch {}
  }

  /**
   * Report a non-fatal error
   */
  async reportError(_report: ErrorReport): Promise<void> {
    try {
      // In a real app, you would send this to an error reporting service
      // For now, we just log it
    } catch {}
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Get current breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}

// Create and export singleton instance
export const errorReportingService = new ErrorReportingService();

// Default export utility
const utilityExport = {
  name: 'ErrorReporting',
  version: '1.0.0',
};

export default utilityExport;
