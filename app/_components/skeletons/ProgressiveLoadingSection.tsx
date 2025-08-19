import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonPlaceholder } from '../common/SkeletonLoader';

interface ProgressiveLoadingSectionProps {
  /**
   * Whether the content is loading
   */
  isLoading: boolean;

  /**
   * The skeleton component to show when loading
   */
  skeleton: React.ReactNode;

  /**
   * The actual content to show when loaded
   */
  children: React.ReactNode;

  /**
   * Optional container style
   */
  style?: any;
}

/**
 * A component that shows a skeleton while loading and the actual content when loaded
 * Use this for progressive loading of sections
 */
export default function ProgressiveLoadingSection({
  isLoading,
  skeleton,
  children,
  style,
}: ProgressiveLoadingSectionProps) {
  return <View style={[styles.container, style]}>{isLoading ? skeleton : children}</View>;
}

// Export a helper to create standard section skeletons
export function createSectionSkeleton(options: {
  title?: boolean;
  viewMore?: boolean;
  height: number;
  width?: number | string;
  borderRadius?: number;
  count?: number;
  horizontal?: boolean;
  style?: any;
}) {
  const {
    title = true,
    viewMore = true,
    height,
    width = '100%',
    borderRadius = 8,
    count = 1,
    horizontal = false,
    style,
  } = options;

  return (
    <View style={style}>
      {title && (
        <View style={styles.sectionHeader}>
          <SkeletonPlaceholder style={styles.sectionTitle} animationType="shimmer" />
          {viewMore && (
            <SkeletonPlaceholder style={styles.sectionViewMore} animationType="shimmer" />
          )}
        </View>
      )}
      <View style={horizontal ? styles.horizontalContent : styles.verticalContent}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonPlaceholder
            key={i}
            animationType="shimmer"
            style={{
              height,
              width: width as any,
              borderRadius,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No specific styles needed here, we just pass through
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  sectionViewMore: {
    width: 80,
    height: 24,
    borderRadius: 4,
  },
  horizontalContent: {
    flexDirection: 'row',
    gap: 12,
  },
  verticalContent: {
    flexDirection: 'column',
    gap: 12,
  },
});
