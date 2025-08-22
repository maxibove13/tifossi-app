import { AxiosError } from 'axios';
import { Alert } from 'react-native';

// Error types
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  statusCode?: number;
  details?: any;
  originalError?: Error;
  timestamp: number;
  retryable: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ApiErrorType[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ApiErrorType.NETWORK_ERROR,
    ApiErrorType.TIMEOUT_ERROR,
    ApiErrorType.RATE_LIMIT_ERROR,
    ApiErrorType.SERVER_ERROR,
  ],
};

class ApiErrorHandler {
  private errorListeners: ((error: ApiError) => void)[] = [];
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Handles API errors and converts them to standardized ApiError format
   */
  handleError(error: unknown, context?: string): ApiError {
    const apiError = this.createApiError(error, context);

    // Log error for debugging
    this.logError(apiError, context);

    // Notify error listeners
    this.notifyListeners(apiError);

    return apiError;
  }

  /**
   * Creates standardized ApiError from various error types
   */
  private createApiError(error: unknown, context?: string): ApiError {
    const timestamp = Date.now();

    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, timestamp, context);
    }

    // Handle custom app errors
    if (error instanceof Error) {
      return this.handleGenericError(error, timestamp);
    }

    // Handle unknown errors
    return {
      type: ApiErrorType.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      timestamp,
      retryable: false,
      originalError: error instanceof Error ? error : new Error(String(error)),
    };
  }

  /**
   * Handles Axios-specific errors
   */
  private handleAxiosError(error: AxiosError, timestamp: number, _context?: string): ApiError {
    const response = error.response;
    const request = error.request;

    // Network error (no response received)
    if (!response && request) {
      return {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network connection failed. Please check your internet connection.',
        timestamp,
        retryable: true,
        originalError: error,
      };
    }

    // Request timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: ApiErrorType.TIMEOUT_ERROR,
        message: 'Request timed out. Please try again.',
        timestamp,
        retryable: true,
        originalError: error,
      };
    }

    // Response received but with error status
    if (response) {
      return this.handleHttpStatusError(response, timestamp, error);
    }

    // Request was made but no response received
    return {
      type: ApiErrorType.NETWORK_ERROR,
      message: 'Unable to connect to the server. Please check your internet connection.',
      timestamp,
      retryable: true,
      originalError: error,
    };
  }

  /**
   * Handles HTTP status code errors
   */
  private handleHttpStatusError(
    response: any,
    timestamp: number,
    originalError: AxiosError
  ): ApiError {
    const status = response.status;
    const data = response.data;

    // Try to extract Strapi error message
    let message = 'An error occurred';
    let details: any = undefined;

    if (data && typeof data === 'object') {
      if (data.error) {
        // Strapi error format
        message = data.error.message || 'An error occurred';
        details = data.error.details;
      } else if (data.message) {
        message = data.message;
      }
    }

    switch (status) {
      case 400:
        return {
          type: ApiErrorType.VALIDATION_ERROR,
          message: message || 'Invalid request data',
          statusCode: status,
          details,
          timestamp,
          retryable: false,
          originalError,
        };

      case 401:
        return {
          type: ApiErrorType.AUTHENTICATION_ERROR,
          message: message || 'Authentication required. Please login again.',
          statusCode: status,
          timestamp,
          retryable: false,
          originalError,
        };

      case 403:
        return {
          type: ApiErrorType.AUTHORIZATION_ERROR,
          message: message || 'You do not have permission to access this resource.',
          statusCode: status,
          timestamp,
          retryable: false,
          originalError,
        };

      case 404:
        return {
          type: ApiErrorType.NOT_FOUND_ERROR,
          message: message || 'The requested resource was not found.',
          statusCode: status,
          timestamp,
          retryable: false,
          originalError,
        };

      case 429:
        return {
          type: ApiErrorType.RATE_LIMIT_ERROR,
          message: message || 'Too many requests. Please wait a moment and try again.',
          statusCode: status,
          timestamp,
          retryable: true,
          originalError,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ApiErrorType.SERVER_ERROR,
          message: message || 'Server error. Please try again later.',
          statusCode: status,
          timestamp,
          retryable: true,
          originalError,
        };

      default:
        return {
          type: ApiErrorType.UNKNOWN_ERROR,
          message: message || `HTTP ${status} Error`,
          statusCode: status,
          timestamp,
          retryable: status >= 500,
          originalError,
        };
    }
  }

  /**
   * Handles generic JavaScript errors
   */
  private handleGenericError(error: Error, timestamp: number): ApiError {
    // Check for specific error types by name or message
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return {
        type: ApiErrorType.NETWORK_ERROR,
        message: error.message || 'Network error occurred',
        timestamp,
        retryable: true,
        originalError: error,
      };
    }

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return {
        type: ApiErrorType.TIMEOUT_ERROR,
        message: error.message || 'Request timed out',
        timestamp,
        retryable: true,
        originalError: error,
      };
    }

    return {
      type: ApiErrorType.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      timestamp,
      retryable: false,
      originalError: error,
    };
  }

  /**
   * Type guard for Axios errors
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return (
      error !== null &&
      typeof error === 'object' &&
      'isAxiosError' in error &&
      (error as any).isAxiosError === true
    );
  }

  /**
   * Logs error for debugging
   */
  private logError(apiError: ApiError, context?: string): void {
    const logLevel = this.getLogLevel(apiError.type);
    const contextStr = context ? ` [${context}]` : '';
    const message = `[API Error${contextStr}] ${apiError.type}: ${apiError.message}`;

    if (__DEV__) {
      switch (logLevel) {
        case 'error':
          break;
        case 'warn':
          break;
        default:
      }
    }
  }

  /**
   * Gets appropriate log level for error type
   */
  private getLogLevel(errorType: ApiErrorType): 'error' | 'warn' | 'info' {
    switch (errorType) {
      case ApiErrorType.SERVER_ERROR:
      case ApiErrorType.UNKNOWN_ERROR:
        return 'error';
      case ApiErrorType.NETWORK_ERROR:
      case ApiErrorType.TIMEOUT_ERROR:
      case ApiErrorType.RATE_LIMIT_ERROR:
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Notifies all registered error listeners
   */
  private notifyListeners(apiError: ApiError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(apiError);
      } catch (error) {}
    });
  }

  /**
   * Determines if an error is retryable
   */
  isRetryable(error: ApiError): boolean {
    return error.retryable && this.retryConfig.retryableErrors.includes(error.type);
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  calculateRetryDelay(attemptNumber: number): number {
    const delay =
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Shows user-friendly error alert
   */
  showUserError(error: ApiError, showAlert: boolean = true): void {
    if (!showAlert) return;

    const userMessage = this.getUserFriendlyMessage(error);

    Alert.alert('Error', userMessage, [
      {
        text: 'OK',
        style: 'default',
      },
    ]);
  }

  /**
   * Gets user-friendly error message
   */
  private getUserFriendlyMessage(error: ApiError): string {
    switch (error.type) {
      case ApiErrorType.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case ApiErrorType.AUTHENTICATION_ERROR:
        return 'Please login again to continue.';
      case ApiErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ApiErrorType.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again.';
      case ApiErrorType.NOT_FOUND_ERROR:
        return 'The requested item could not be found.';
      case ApiErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';
      case ApiErrorType.SERVER_ERROR:
        return 'Server is temporarily unavailable. Please try again later.';
      case ApiErrorType.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Registers an error listener
   */
  onError(listener: (error: ApiError) => void): () => void {
    this.errorListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Updates retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Gets current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Clears all error listeners
   */
  clearListeners(): void {
    this.errorListeners = [];
  }
}

// Create singleton instance
const apiErrorHandler = new ApiErrorHandler();

export default apiErrorHandler;
export { ApiErrorHandler };

// Utility functions
export function isRetryableError(error: ApiError): boolean {
  return apiErrorHandler.isRetryable(error);
}

export function getRetryDelay(attemptNumber: number): number {
  return apiErrorHandler.calculateRetryDelay(attemptNumber);
}

export function handleApiError(
  error: unknown,
  context?: string,
  showAlert: boolean = false
): ApiError {
  const apiError = apiErrorHandler.handleError(error, context);

  if (showAlert) {
    apiErrorHandler.showUserError(apiError);
  }

  return apiError;
}

const utilityExport = {
  name: 'ErrorHandler',
  version: '1.0.0',
};

export { utilityExport };
