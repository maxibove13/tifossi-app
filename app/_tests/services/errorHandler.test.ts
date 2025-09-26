/**
 * Error Handler Service Tests
 * Tests error recovery, retry logic, and error messaging
 * Critical for resilient app behavior and user experience
 */

import { AxiosError } from 'axios';

const mockAlert = jest.fn();

type ErrorHandlerModuleType = typeof import('../../_services/api/errorHandler');

let moduleUnderTest: ErrorHandlerModuleType;
let ApiErrorHandler: ErrorHandlerModuleType['ApiErrorHandler'];
let ApiErrorType: ErrorHandlerModuleType['ApiErrorType'];
let handleApiError: ErrorHandlerModuleType['handleApiError'];
let isRetryableError: ErrorHandlerModuleType['isRetryableError'];
let getRetryDelay: ErrorHandlerModuleType['getRetryDelay'];

describe('ErrorHandler Service', () => {
  let errorHandler: InstanceType<ErrorHandlerModuleType['ApiErrorHandler']>;

  beforeEach(() => {
    mockAlert.mockReset();
    jest.resetModules();

    jest.doMock(
      'react-native',
      () => ({
        Alert: {
          alert: jest.fn(),
        },
      }),
      { virtual: true }
    );

    jest.isolateModules(() => {
      moduleUnderTest = require('../../_services/api/errorHandler') as ErrorHandlerModuleType;
    });

    ApiErrorHandler = moduleUnderTest.ApiErrorHandler;
    ApiErrorType = moduleUnderTest.ApiErrorType;
    handleApiError = moduleUnderTest.handleApiError;
    isRetryableError = moduleUnderTest.isRetryableError;
    getRetryDelay = moduleUnderTest.getRetryDelay;

    moduleUnderTest.__setAlertHandler(mockAlert);

    errorHandler = new ApiErrorHandler();
  });

  afterEach(() => {
    moduleUnderTest.__setAlertHandler();
  });

  describe('handleError - Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      (networkError as any).request = {};
      (networkError as any).isAxiosError = true;

      const result = errorHandler.handleError(networkError);

      expect(result.type).toBe(ApiErrorType.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.message).toContain('Network connection');
    });

    it('should classify timeout errors', () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      (timeoutError as any).isAxiosError = true;

      const result = errorHandler.handleError(timeoutError);

      expect(result.type).toBe(ApiErrorType.TIMEOUT_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.message).toContain('timed out');
    });

    it('should handle 400 validation errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid email format',
              details: { field: 'email' },
            },
          },
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.VALIDATION_ERROR);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Invalid email format');
      expect(result.details).toEqual({ field: 'email' });
      expect(result.retryable).toBe(false);
    });

    it('should handle 401 authentication errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.AUTHENTICATION_ERROR);
      expect(result.statusCode).toBe(401);
      expect(result.retryable).toBe(false);
    });

    it('should handle 403 authorization errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Insufficient permissions' },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.AUTHORIZATION_ERROR);
      expect(result.statusCode).toBe(403);
      expect(result.message).toBe('Insufficient permissions');
      expect(result.retryable).toBe(false);
    });

    it('should handle 404 not found errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.NOT_FOUND_ERROR);
      expect(result.statusCode).toBe(404);
      expect(result.retryable).toBe(false);
    });

    it('should handle 429 rate limit errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {},
          statusText: 'Too Many Requests',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.RATE_LIMIT_ERROR);
      expect(result.statusCode).toBe(429);
      expect(result.retryable).toBe(true);
    });

    it('should handle 500 server errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.SERVER_ERROR);
      expect(result.statusCode).toBe(500);
      expect(result.retryable).toBe(true);
    });

    it('should handle 502 bad gateway errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 502,
          data: {},
          statusText: 'Bad Gateway',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.SERVER_ERROR);
      expect(result.statusCode).toBe(502);
      expect(result.retryable).toBe(true);
    });

    it('should handle 503 service unavailable', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {},
          statusText: 'Service Unavailable',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.SERVER_ERROR);
      expect(result.statusCode).toBe(503);
      expect(result.retryable).toBe(true);
    });

    it('should handle unknown HTTP status codes', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 418, // I'm a teapot
          data: {},
          statusText: "I'm a teapot",
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.UNKNOWN_ERROR);
      expect(result.statusCode).toBe(418);
      expect(result.retryable).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should identify retryable errors', () => {
      const retryableTypes = [
        ApiErrorType.NETWORK_ERROR,
        ApiErrorType.TIMEOUT_ERROR,
        ApiErrorType.RATE_LIMIT_ERROR,
        ApiErrorType.SERVER_ERROR,
      ];

      retryableTypes.forEach((type) => {
        const error = {
          type,
          message: 'Test error',
          timestamp: Date.now(),
          retryable: true,
          originalError: new Error(),
        };

        expect(errorHandler.isRetryable(error)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableTypes = [
        ApiErrorType.AUTHENTICATION_ERROR,
        ApiErrorType.AUTHORIZATION_ERROR,
        ApiErrorType.VALIDATION_ERROR,
        ApiErrorType.NOT_FOUND_ERROR,
      ];

      nonRetryableTypes.forEach((type) => {
        const error = {
          type,
          message: 'Test error',
          timestamp: Date.now(),
          retryable: false,
          originalError: new Error(),
        };

        expect(errorHandler.isRetryable(error)).toBe(false);
      });
    });

    it('should calculate exponential backoff correctly', () => {
      expect(errorHandler.calculateRetryDelay(1)).toBe(1000); // 1 second
      expect(errorHandler.calculateRetryDelay(2)).toBe(2000); // 2 seconds
      expect(errorHandler.calculateRetryDelay(3)).toBe(4000); // 4 seconds
      expect(errorHandler.calculateRetryDelay(4)).toBe(8000); // 8 seconds
      expect(errorHandler.calculateRetryDelay(5)).toBe(10000); // Capped at max
      expect(errorHandler.calculateRetryDelay(10)).toBe(10000); // Still capped
    });

    it('should respect custom retry configuration', () => {
      const customHandler = new ApiErrorHandler({
        baseDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 3,
      });

      expect(customHandler.calculateRetryDelay(1)).toBe(500);
      expect(customHandler.calculateRetryDelay(2)).toBe(1500);
      expect(customHandler.calculateRetryDelay(3)).toBe(4500);
      expect(customHandler.calculateRetryDelay(4)).toBe(5000); // Capped
    });

    it('should update retry configuration', () => {
      errorHandler.updateRetryConfig({
        maxAttempts: 5,
        baseDelay: 2000,
      });

      const config = errorHandler.getRetryConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelay).toBe(2000);
    });
  });

  describe('Error Messages', () => {
    it('should show user-friendly error alert', () => {
      const error = {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Technical error message',
        timestamp: Date.now(),
        retryable: true,
        originalError: new Error(),
      };

      errorHandler.showUserError(error);

      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Please check your internet connection and try again.',
        expect.any(Array)
      );
    });

    it('should not show alert when disabled', () => {
      const error = {
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error',
        timestamp: Date.now(),
        retryable: true,
        originalError: new Error(),
      };

      errorHandler.showUserError(error, false);

      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should provide appropriate messages for each error type', () => {
      const testCases = [
        {
          type: ApiErrorType.AUTHENTICATION_ERROR,
          expectedMessage: 'Please login again to continue.',
        },
        {
          type: ApiErrorType.AUTHORIZATION_ERROR,
          expectedMessage: 'You do not have permission to perform this action.',
        },
        {
          type: ApiErrorType.NOT_FOUND_ERROR,
          expectedMessage: 'The requested item could not be found.',
        },
        {
          type: ApiErrorType.RATE_LIMIT_ERROR,
          expectedMessage: 'Too many requests. Please wait a moment and try again.',
        },
        {
          type: ApiErrorType.SERVER_ERROR,
          expectedMessage: 'Server is temporarily unavailable. Please try again later.',
        },
        {
          type: ApiErrorType.TIMEOUT_ERROR,
          expectedMessage: 'Request timed out. Please try again.',
        },
      ];

      testCases.forEach(({ type, expectedMessage }) => {
        mockAlert.mockClear();

        const error = {
          type,
          message: 'Technical message',
          timestamp: Date.now(),
          retryable: false,
          originalError: new Error(),
        };

        errorHandler.showUserError(error);

        expect(mockAlert).toHaveBeenCalledWith('Error', expectedMessage, expect.any(Array));
      });
    });
  });

  describe('Error Listeners', () => {
    it('should register and notify error listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      errorHandler.onError(listener1);
      errorHandler.onError(listener2);

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(listener1).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ApiErrorType.UNKNOWN_ERROR,
        })
      );
      expect(listener2).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ApiErrorType.UNKNOWN_ERROR,
        })
      );
    });

    it('should unsubscribe listeners', () => {
      const listener = jest.fn();
      const unsubscribe = errorHandler.onError(listener);

      unsubscribe();

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const badListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      errorHandler.onError(badListener);
      errorHandler.onError(goodListener);

      const error = new Error('Test error');

      // Should not throw even if listener fails
      expect(() => errorHandler.handleError(error)).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should clear all listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      errorHandler.onError(listener1);
      errorHandler.onError(listener2);
      errorHandler.clearListeners();

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should check if error is retryable', () => {
      const retryableError = {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: Date.now(),
        retryable: true,
        originalError: new Error(),
      };

      const nonRetryableError = {
        type: ApiErrorType.VALIDATION_ERROR,
        message: 'Invalid input',
        timestamp: Date.now(),
        retryable: false,
        originalError: new Error(),
      };

      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });

    it('should get retry delay', () => {
      expect(getRetryDelay(1)).toBe(1000);
      expect(getRetryDelay(3)).toBe(4000);
    });

    it('should handle API errors with context', () => {
      const error = new Error('Test error');
      const result = handleApiError(error, 'testContext', false);

      expect(result.type).toBe(ApiErrorType.UNKNOWN_ERROR);
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should show alert when requested', () => {
      const error = new Error('Test error');
      handleApiError(error, 'testContext', true);

      expect(mockAlert).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null errors', () => {
      const result = errorHandler.handleError(null);

      expect(result.type).toBe(ApiErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe('An unknown error occurred');
    });

    it('should handle undefined errors', () => {
      const result = errorHandler.handleError(undefined);

      expect(result.type).toBe(ApiErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe('An unknown error occurred');
    });

    it('should handle string errors', () => {
      const result = errorHandler.handleError('String error message');

      expect(result.type).toBe(ApiErrorType.UNKNOWN_ERROR);
      expect(result.originalError).toBeInstanceOf(Error);
    });

    it('should handle errors with network in name', () => {
      const error = new Error('Some error');
      error.name = 'NetworkError';

      const result = errorHandler.handleError(error);

      expect(result.type).toBe(ApiErrorType.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should handle errors with timeout in message', () => {
      const error = new Error('Request timeout occurred');

      const result = errorHandler.handleError(error);

      expect(result.type).toBe(ApiErrorType.TIMEOUT_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should extract Strapi error format', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: {
              message: 'Strapi validation failed',
              details: {
                errors: [{ field: 'email', message: 'Invalid email' }],
              },
            },
          },
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.message).toBe('Strapi validation failed');
      expect(result.details).toEqual({
        errors: [{ field: 'email', message: 'Invalid email' }],
      });
    });

    it('should handle malformed response data', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: 'Not a JSON response',
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
      };

      const result = errorHandler.handleError(axiosError);

      expect(result.type).toBe(ApiErrorType.SERVER_ERROR);
      expect(result.message).toBe('An error occurred');
    });
  });
});
