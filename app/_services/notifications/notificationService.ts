import { create } from 'zustand';
import { ApiError, ApiErrorType } from '../api/errorHandler';

// Notification types and interfaces
export enum NotificationType {
  ERROR = 'error',
  WARNING = 'warning',
  SUCCESS = 'success',
  INFO = 'info',
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  actionButton?: {
    text: string;
    onPress: () => void;
  };
}

interface NotificationState {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showError: (title: string, message: string, options?: Partial<NotificationData>) => void;
  showWarning: (title: string, message: string, options?: Partial<NotificationData>) => void;
  showSuccess: (title: string, message: string, options?: Partial<NotificationData>) => void;
  showInfo: (title: string, message: string, options?: Partial<NotificationData>) => void;
  showApiError: (apiError: ApiError, context?: string) => void;
}

// Generate unique notification ID
const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Default durations for different notification types
const DEFAULT_DURATIONS = {
  [NotificationType.ERROR]: 8000, // 8 seconds for errors
  [NotificationType.WARNING]: 6000, // 6 seconds for warnings
  [NotificationType.SUCCESS]: 4000, // 4 seconds for success
  [NotificationType.INFO]: 5000, // 5 seconds for info
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = generateNotificationId();
    const duration =
      notification.duration !== undefined
        ? notification.duration
        : DEFAULT_DURATIONS[notification.type] || 5000;

    const newNotification: NotificationData = {
      id,
      duration,
      dismissible: true,
      priority: 'medium',
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  showError: (title, message, options = {}) => {
    get().addNotification({
      type: NotificationType.ERROR,
      title,
      message,
      priority: 'high',
      ...options,
    });
  },

  showWarning: (title, message, options = {}) => {
    get().addNotification({
      type: NotificationType.WARNING,
      title,
      message,
      priority: 'medium',
      ...options,
    });
  },

  showSuccess: (title, message, options = {}) => {
    get().addNotification({
      type: NotificationType.SUCCESS,
      title,
      message,
      priority: 'low',
      ...options,
    });
  },

  showInfo: (title, message, options = {}) => {
    get().addNotification({
      type: NotificationType.INFO,
      title,
      message,
      priority: 'low',
      ...options,
    });
  },

  showApiError: (apiError, context) => {
    const { title, message, actionButton } = getApiErrorNotificationContent(apiError, context);

    get().addNotification({
      type: NotificationType.ERROR,
      title,
      message,
      priority: getApiErrorPriority(apiError.type),
      actionButton,
      duration: apiError.retryable ? 10000 : 8000, // Longer duration for retryable errors
    });
  },
}));

// Helper function to get notification content for API errors
function getApiErrorNotificationContent(
  apiError: ApiError,
  context?: string
): {
  title: string;
  message: string;
  actionButton?: { text: string; onPress: () => void };
} {
  const contextPrefix = context ? `${context}: ` : '';

  switch (apiError.type) {
    case ApiErrorType.NETWORK_ERROR:
      return {
        title: 'Connection Error',
        message: `${contextPrefix}Please check your internet connection and try again.`,
        actionButton: apiError.retryable
          ? {
              text: 'Retry',
              onPress: () => {
                // This would trigger a retry mechanism
              },
            }
          : undefined,
      };

    case ApiErrorType.AUTHENTICATION_ERROR:
      return {
        title: 'Authentication Required',
        message: `${contextPrefix}Please log in again to continue.`,
        actionButton: {
          text: 'Login',
          onPress: () => {
            // Navigate to login screen
          },
        },
      };

    case ApiErrorType.AUTHORIZATION_ERROR:
      return {
        title: 'Access Denied',
        message: `${contextPrefix}You don't have permission to perform this action.`,
      };

    case ApiErrorType.VALIDATION_ERROR:
      return {
        title: 'Invalid Data',
        message: apiError.message || `${contextPrefix}Please check your input and try again.`,
      };

    case ApiErrorType.NOT_FOUND_ERROR:
      return {
        title: 'Not Found',
        message: `${contextPrefix}The requested item could not be found.`,
      };

    case ApiErrorType.RATE_LIMIT_ERROR:
      return {
        title: 'Too Many Requests',
        message: `${contextPrefix}Please wait a moment before trying again.`,
        actionButton: {
          text: 'Retry Later',
          onPress: () => {
            setTimeout(() => {}, 5000);
          },
        },
      };

    case ApiErrorType.SERVER_ERROR:
      return {
        title: 'Server Error',
        message: `${contextPrefix}Our servers are experiencing issues. Please try again later.`,
        actionButton: apiError.retryable
          ? {
              text: 'Retry',
              onPress: () => {},
            }
          : undefined,
      };

    case ApiErrorType.TIMEOUT_ERROR:
      return {
        title: 'Request Timeout',
        message: `${contextPrefix}The request took too long to complete. Please try again.`,
        actionButton: {
          text: 'Retry',
          onPress: () => {},
        },
      };

    default:
      return {
        title: 'Error',
        message: apiError.message || `${contextPrefix}An unexpected error occurred.`,
      };
  }
}

// Helper function to determine notification priority based on API error type
function getApiErrorPriority(errorType: ApiErrorType): 'low' | 'medium' | 'high' | 'critical' {
  switch (errorType) {
    case ApiErrorType.SERVER_ERROR:
    case ApiErrorType.AUTHENTICATION_ERROR:
      return 'high';

    case ApiErrorType.AUTHORIZATION_ERROR:
    case ApiErrorType.VALIDATION_ERROR:
      return 'medium';

    case ApiErrorType.NETWORK_ERROR:
    case ApiErrorType.TIMEOUT_ERROR:
    case ApiErrorType.RATE_LIMIT_ERROR:
    case ApiErrorType.NOT_FOUND_ERROR:
      return 'low';

    default:
      return 'medium';
  }
}

// Notification service class for direct usage
class NotificationService {
  private getStore(): NotificationState {
    return useNotificationStore.getState();
  }

  // Convenience methods that match the store interface
  showError(title: string, message: string, options?: Partial<NotificationData>) {
    this.getStore().showError(title, message, options);
  }

  showWarning(title: string, message: string, options?: Partial<NotificationData>) {
    this.getStore().showWarning(title, message, options);
  }

  showSuccess(title: string, message: string, options?: Partial<NotificationData>) {
    this.getStore().showSuccess(title, message, options);
  }

  showInfo(title: string, message: string, options?: Partial<NotificationData>) {
    this.getStore().showInfo(title, message, options);
  }

  showApiError(apiError: ApiError, context?: string) {
    this.getStore().showApiError(apiError, context);
  }

  // Specialized notification methods for common scenarios
  showNetworkError(context?: string) {
    this.showError(
      'Connection Error',
      `${context ? `${context}: ` : ''}Please check your internet connection.`,
      {
        priority: 'medium',
        actionButton: {
          text: 'Retry',
          onPress: () => {},
        },
      }
    );
  }

  showAuthenticationError() {
    this.showError('Authentication Required', 'Your session has expired. Please log in again.', {
      priority: 'high',
      duration: 0, // Persistent until manually dismissed
      actionButton: {
        text: 'Login',
        onPress: () => {},
      },
    });
  }

  showPaymentError(message?: string) {
    this.showError(
      'Payment Failed',
      message || 'There was an issue processing your payment. Please try again.',
      {
        priority: 'high',
        duration: 10000,
        actionButton: {
          text: 'Try Again',
          onPress: () => {},
        },
      }
    );
  }

  showValidationError(field: string, message: string) {
    this.showWarning('Invalid Input', `${field}: ${message}`, {
      priority: 'medium',
      duration: 6000,
    });
  }

  showSuccessMessage(action: string, details?: string) {
    this.showSuccess('Success', details || `${action} completed successfully.`, {
      priority: 'low',
      duration: 4000,
    });
  }

  // Batch operations
  clearAll() {
    this.getStore().clearAll();
  }

  // Error recovery suggestions
  showRecoveryOptions(error: Error, context: string) {
    this.showError('Recovery Options', `${context} failed. Try refreshing or restarting the app.`, {
      priority: 'medium',
      duration: 0, // Persistent
      actionButton: {
        text: 'Refresh',
        onPress: () => {},
      },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;

// Utility export for Expo Router
const utilityExport = {
  name: 'NotificationService',
  version: '1.0.0',
};

export { utilityExport };
