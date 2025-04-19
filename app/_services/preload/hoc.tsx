import React, { ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../../_styles/colors';
import { fonts, fontSizes } from '../../_styles/typography';
import { PreloadAsset } from './types';
import { useAssetPreload } from './hooks';

interface WithPreloadOptions {
  LoadingComponent?: React.ComponentType<any>;
  showError?: boolean;
}

interface LoadingProps {
  error: Error | null;
}

// Default loading component
const DefaultLoading: React.FC<LoadingProps> = ({ error }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    {error && <Text style={styles.errorText}>{error.message}</Text>}
  </View>
);

/**
 * HOC that adds asset preloading to a component
 *
 * @param WrappedComponent Component to wrap
 * @param assetsToPreload Assets to preload
 * @param options Options for the HOC
 * @returns Wrapped component with preloading
 */
export function withPreload<P extends object>(
  WrappedComponent: ComponentType<P>,
  assetsToPreload: PreloadAsset[] | (() => PreloadAsset[]),
  options: WithPreloadOptions = {}
) {
  const { LoadingComponent = DefaultLoading, showError = true } = options;

  // Return a new component that handles preloading
  const WithPreloadComponent: React.FC<P> = (props) => {
    // Use the preload hook to handle asset loading
    const { loaded, loading, error } = useAssetPreload(assetsToPreload, true);

    // Show loading component while assets are loading
    if (loading || !loaded) {
      return <LoadingComponent error={showError ? error : null} />;
    }

    // Render the wrapped component once assets are loaded
    return <WrappedComponent {...props} />;
  };

  // Set display name for better debugging
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithPreloadComponent.displayName = `withPreload(${wrappedName})`;

  return WithPreloadComponent;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
  },
  errorText: {
    marginTop: 10,
    color: colors.error,
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

// Add default export to prevent Expo Router from treating this as a route
const utilityExport = {
  name: 'PreloadHOC',
  version: '1.0.0',
};

export default utilityExport;
