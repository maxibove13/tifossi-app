import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../_styles/colors';
import { fontSizes, fontWeights } from '../../_styles/typography';
import { errorReportingService } from '../../_services/error/errorReporting';

export enum ErrorBoundaryType {
  GLOBAL = 'global',
  SCREEN = 'screen',
  COMPONENT = 'component',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface BaseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  type?: ErrorBoundaryType;
  context?: string;
  enableRetry?: boolean;
  enableReporting?: boolean;
  severity?: ErrorSeverity;
  customErrorMessage?: string;
  showErrorDetails?: boolean;
  compact?: boolean;
  hideFromUser?: boolean;
  enableGoBack?: boolean;
  fallbackRoute?: string;
  componentName?: string;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  isReporting: boolean;
  isRestarting: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;
const MAX_COMPONENT_RETRIES = 2;

export class UnifiedErrorBoundary extends React.Component<BaseErrorBoundaryProps, State> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isReporting: false,
      isRestarting: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    const {
      type = ErrorBoundaryType.COMPONENT,
      severity = ErrorSeverity.MEDIUM,
      context,
      onError,
      enableReporting = true,
    } = this.props;

    // Call custom error handler
    onError?.(error, errorInfo);

    // Report error based on type and severity
    if (enableReporting) {
      this.reportError(error, errorInfo);
    }

    // Add breadcrumb for debugging
    errorReportingService.addBreadcrumb({
      message: `${type} error in ${context || 'Unknown'}: ${error.message}`,
      data: {
        type,
        severity: severity === ErrorSeverity.CRITICAL ? 'error' : 'warning',
      },
    });

    // Log error details in development
    if (__DEV__) {
      const logLevel = severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
      console[logLevel](
        `🔴 ${type.charAt(0).toUpperCase() + type.slice(1)} Error Boundary [${context}]:`,
        error
      );
      console[logLevel]('Error Info:', errorInfo);
    }
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    if (this.state.isReporting) return;

    this.setState({ isReporting: true });

    try {
      const {
        type = ErrorBoundaryType.COMPONENT,
        severity = ErrorSeverity.MEDIUM,
        context,
      } = this.props;

      if (type === ErrorBoundaryType.GLOBAL && severity === ErrorSeverity.CRITICAL) {
        await errorReportingService.reportCrash({
          error,
          componentStack: errorInfo?.componentStack ?? undefined,
          contextInfo: context ?? 'Global App Level',
          metadata: {
            boundaryType: type,
            severity,
            crashType: 'javascript',
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        await errorReportingService.reportError({
          error,
          contextInfo: context || 'Unknown Context',
          metadata: {
            boundaryType: type,
            severity,
            retryCount: this.state.retryCount,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  handleRetry = () => {
    const { type = ErrorBoundaryType.COMPONENT } = this.props;
    const maxRetries =
      type === ErrorBoundaryType.COMPONENT ? MAX_COMPONENT_RETRIES : MAX_RETRY_ATTEMPTS;
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount > maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        'This error has occurred multiple times. Please restart the app or contact support.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Report Issue', onPress: this.handleReportIssue },
        ]
      );
      return;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: newRetryCount,
    });
  };

  handleReportIssue = () => {
    if (this.state.error && this.state.errorInfo) {
      this.reportError(this.state.error, this.state.errorInfo);
    }
    Alert.alert('Thank you', 'Your issue has been reported to our support team.');
  };

  handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }

      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    } catch (navigationError) {
      console.error('Navigation failed after error:', navigationError);
      router.replace('/');
    }
  };

  handleGoHome = () => {
    try {
      router.replace('/');
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    } catch (navigationError) {
      console.error('Failed to navigate home after error:', navigationError);
    }
  };

  handleRestartApp = () => {
    this.setState({ isRestarting: true });

    setTimeout(() => {
      try {
        router.replace('/');
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          isRestarting: false,
        });
      } catch (navigationError) {
        console.error('Failed to navigate after error:', navigationError);
        Alert.alert(
          'Critical Error',
          'The app needs to be restarted manually. Please close and reopen the app.',
          [{ text: 'OK' }]
        );
      }
    }, 500);
  };

  getErrorMessage(): string {
    const { type, severity, customErrorMessage, componentName, screenName } = this.props;

    if (customErrorMessage) return customErrorMessage;

    if (severity === ErrorSeverity.CRITICAL) {
      return 'A critical error has occurred. Please restart the app.';
    }

    switch (type) {
      case ErrorBoundaryType.GLOBAL:
        return 'The app encountered an unexpected error. Please try restarting.';
      case ErrorBoundaryType.SCREEN:
        return `The ${screenName || 'screen'} encountered an error. You can try going back or refreshing.`;
      case ErrorBoundaryType.COMPONENT:
        return `The ${componentName || 'component'} couldn't load properly. ${this.canRetry() ? 'You can try reloading it.' : 'Please refresh the page.'}`;
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  canRetry(): boolean {
    const { enableRetry = true, type = ErrorBoundaryType.COMPONENT } = this.props;
    const maxRetries =
      type === ErrorBoundaryType.COMPONENT ? MAX_COMPONENT_RETRIES : MAX_RETRY_ATTEMPTS;
    return enableRetry && this.state.retryCount < maxRetries;
  }

  renderCompactError() {
    const { componentName } = this.props;
    const canRetry = this.canRetry();

    return (
      <View style={styles.compactErrorContainer}>
        <Text style={styles.compactErrorIcon}>⚠️</Text>
        <Text style={styles.compactErrorText}>
          {componentName ? `${componentName} failed to load` : 'Component failed to load'}
        </Text>
        {canRetry && (
          <TouchableOpacity style={styles.compactRetryButton} onPress={this.handleRetry}>
            <Text style={styles.compactRetryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  renderGlobalError() {
    const { error, isRestarting } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.criticalIcon}>🚨</Text>
          </View>

          <Text style={styles.title}>Critical Error</Text>
          <Text style={styles.subtitle}>The app encountered a serious problem</Text>

          <Text style={styles.description}>
            Don't worry - your data is safe. We've automatically reported this issue to our team.
            Please try restarting the app to continue.
          </Text>

          {__DEV__ && error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Information:</Text>
              <Text style={styles.debugText}>{error.message}</Text>
              {error.stack && (
                <Text style={styles.debugStack} numberOfLines={10}>
                  {error.stack}
                </Text>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, isRestarting && styles.disabledButton]}
              onPress={this.handleRestartApp}
              disabled={isRestarting}
            >
              <Text style={styles.primaryButtonText}>
                {isRestarting ? 'Restarting...' : 'Restart App'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={this.handleReportIssue}
              disabled={isRestarting}
            >
              <Text style={styles.secondaryButtonText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  renderStandardError() {
    const { type, enableGoBack = true, screenName, componentName, showErrorDetails } = this.props;
    const { error } = this.state;
    const canRetry = this.canRetry();
    const errorMessage = this.getErrorMessage();

    const isScreenLevel = type === ErrorBoundaryType.SCREEN;
    const title = isScreenLevel ? 'Screen Error' : 'Component Error';
    const contextName = screenName || componentName;

    return (
      <View style={isScreenLevel ? styles.container : styles.componentContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {contextName && <Text style={styles.contextName}>{contextName}</Text>}

        <Text style={styles.message}>{errorMessage}</Text>

        {showErrorDetails && __DEV__ && error && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>{error.message}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {canRetry && (
            <TouchableOpacity style={styles.primaryButton} onPress={this.handleRetry}>
              <Text style={styles.primaryButtonText}>
                Try Again{' '}
                {this.state.retryCount > 0 &&
                  `(${this.state.retryCount}/${type === ErrorBoundaryType.COMPONENT ? MAX_COMPONENT_RETRIES : MAX_RETRY_ATTEMPTS})`}
              </Text>
            </TouchableOpacity>
          )}

          {isScreenLevel && (
            <View style={styles.secondaryButtonRow}>
              {enableGoBack && (
                <TouchableOpacity style={styles.secondaryButton} onPress={this.handleGoBack}>
                  <Text style={styles.secondaryButtonText}>Go Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleGoHome}>
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  render() {
    if (this.state.hasError) {
      const {
        fallback,
        compact = false,
        hideFromUser = false,
        type = ErrorBoundaryType.COMPONENT,
        severity = ErrorSeverity.MEDIUM,
      } = this.props;

      // If hideFromUser is true, render nothing (graceful degradation)
      if (hideFromUser) {
        return null;
      }

      // If custom fallback is provided, use it
      if (fallback) {
        return <View style={compact && styles.compactContainer}>{fallback}</View>;
      }

      // Render based on error type and severity
      if (type === ErrorBoundaryType.GLOBAL || severity === ErrorSeverity.CRITICAL) {
        return this.renderGlobalError();
      }

      if (compact) {
        return this.renderCompactError();
      }

      return this.renderStandardError();
    }

    return this.props.children;
  }
}

// Convenience wrappers for different use cases
export const GlobalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedErrorBoundary
    type={ErrorBoundaryType.GLOBAL}
    severity={ErrorSeverity.CRITICAL}
    context="Global App Level"
  >
    {children}
  </UnifiedErrorBoundary>
);

export const ScreenErrorBoundary: React.FC<{
  children: React.ReactNode;
  screenName: string;
  fallbackRoute?: string;
  enableGoBack?: boolean;
  customMessage?: string;
}> = ({ children, screenName, fallbackRoute, enableGoBack, customMessage }) => (
  <UnifiedErrorBoundary
    type={ErrorBoundaryType.SCREEN}
    severity={ErrorSeverity.MEDIUM}
    context={`Screen: ${screenName}`}
    screenName={screenName}
    fallbackRoute={fallbackRoute}
    enableGoBack={enableGoBack}
    customErrorMessage={customMessage}
  >
    {children}
  </UnifiedErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
  compact?: boolean;
  hideFromUser?: boolean;
  onError?: (error: Error) => void;
  enableRetry?: boolean;
}> = ({ children, componentName, fallback, compact, hideFromUser, onError, enableRetry }) => (
  <UnifiedErrorBoundary
    type={ErrorBoundaryType.COMPONENT}
    severity={ErrorSeverity.LOW}
    context={`Component: ${componentName}`}
    componentName={componentName}
    fallback={fallback}
    compact={compact}
    hideFromUser={hideFromUser}
    onError={onError}
    enableRetry={enableRetry}
  >
    {children}
  </UnifiedErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  componentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 8,
  },
  compactContainer: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%',
  },
  iconContainer: {
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  criticalIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  contextName: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  debugContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.background.medium,
    borderRadius: 8,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  debugTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.error,
    marginBottom: 8,
  },
  debugText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginBottom: 8,
    fontWeight: fontWeights.medium,
  },
  debugStack: {
    fontSize: fontSizes.xs,
    color: colors.secondary,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: colors.secondary,
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.background.light,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    textAlign: 'center',
  },
  // Compact styles
  compactErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.background.medium,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  compactErrorIcon: {
    fontSize: 16,
  },
  compactErrorText: {
    fontSize: fontSizes.xs,
    color: colors.secondary,
    flex: 1,
  },
  compactRetryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  compactRetryText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.background.light,
  },
});

export default UnifiedErrorBoundary;
