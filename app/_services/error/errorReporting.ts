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

    console.log('[Error Reporting] Breadcrumb added:', breadcrumb.message);
  }

  /**
   * Report a crash (fatal error)
   */
  async reportCrash(report: CrashReport): Promise<void> {
    try {
      console.error('[Error Reporting] Crash reported:', {
        error: report.error.message,
        stack: report.error.stack,
        componentStack: report.componentStack,
        contextInfo: report.contextInfo,
        metadata: report.metadata,
        breadcrumbs: this.breadcrumbs,
      });

      // In a real app, you would send this to a crash reporting service
      // For now, we just log it
    } catch (err) {
      console.error('[Error Reporting] Failed to report crash:', err);
    }
  }

  /**
   * Report a non-fatal error
   */
  async reportError(report: ErrorReport): Promise<void> {
    try {
      console.error('[Error Reporting] Error reported:', {
        error: report.error.message,
        stack: report.error.stack,
        contextInfo: report.contextInfo,
        metadata: report.metadata,
        breadcrumbs: this.breadcrumbs,
      });

      // In a real app, you would send this to an error reporting service
      // For now, we just log it
    } catch (err) {
      console.error('[Error Reporting] Failed to report error:', err);
    }
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
