/**
 * Custom render utilities for testing React Native components
 * Provides pre-configured providers and utilities
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockNavigation, mockRoute } from './test-setup';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
  initialQueryData?: Record<string, any>;
  navigationMock?: any;
  routeMock?: any;
}

const AllTheProviders: React.FC<{
  children: React.ReactNode;
  queryClient?: QueryClient;
}> = ({ children, queryClient }) => {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const customRender = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  const { initialQueryData, navigationMock, routeMock, ...renderOptions } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Set initial data if provided
  if (initialQueryData) {
    Object.entries(initialQueryData).forEach(([key, data]) => {
      queryClient.setQueryData([key], data);
    });
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Component wrapper for components that need navigation
export const withNavigation = (
  Component: React.ComponentType<any>,
  navigation = mockNavigation,
  route = mockRoute
) => {
  return (props: any) => <Component navigation={navigation} route={route} {...props} />;
};

// Store testing wrapper
export const withStoreProvider = (
  Component: React.ComponentType<any>,
  storeValues: Record<string, any> = {}
) => {
  return (props: any) => {
    // Mock store implementation would go here
    // For now, just render the component
    return <Component {...props} />;
  };
};

// Accessibility testing wrapper
export const withAccessibilityInfo = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Component
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Test component"
      testID="test-component"
      {...props}
    />
  );
};

// Animation testing wrapper
export const withAnimationDisabled = (Component: React.ComponentType<any>) => {
  // Disable animations for testing
  return (props: any) => <Component {...props} />;
};

// Error boundary wrapper for testing error scenarios
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // or some error UI
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (
  Component: React.ComponentType<any>,
  onError?: (error: Error) => void
) => {
  return (props: any) => (
    <TestErrorBoundary onError={onError}>
      <Component {...props} />
    </TestErrorBoundary>
  );
};

// Performance testing wrapper
export const withPerformanceTracking = (
  Component: React.ComponentType<any>,
  measurementName: string = 'component-render'
) => {
  return (props: any) => {
    React.useEffect(() => {
      performance.mark(`${measurementName}-start`);
      return () => {
        performance.mark(`${measurementName}-end`);
        performance.measure(measurementName, `${measurementName}-start`, `${measurementName}-end`);
      };
    }, []);

    return <Component {...props} />;
  };
};

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Export custom render as default
export { customRender as render };
