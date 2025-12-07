import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Animated, Easing, ViewStyle } from 'react-native';
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';

interface SkeletonPlaceholderProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  animationType?: 'pulse' | 'shimmer';
}

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({
  style,
  children,
  animationType = 'pulse',
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation =
      animationType === 'shimmer'
        ? Animated.loop(
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            })
          )
        : Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: 600,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: 600,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          );

    animation.start();
    return () => animation.stop();
  }, [animValue, animationType]);

  if (animationType === 'shimmer') {
    const translateX = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    return (
      <View style={[styles.shimmerContainer, style]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX }],
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        />
        {children}
      </View>
    );
  }

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return <Animated.View style={[styles.placeholder, { opacity }, style]}>{children}</Animated.View>;
};

// Product Card Skeleton
const ProductCardSkeleton: React.FC = () => (
  <View style={styles.cardContainer}>
    <SkeletonPlaceholder style={styles.imagePlaceholder} />
    <View style={styles.textContainer}>
      <SkeletonPlaceholder style={styles.textLineShort} />
      <SkeletonPlaceholder style={styles.textLineLong} />
      <SkeletonPlaceholder style={styles.textLineMedium} />
      <SkeletonPlaceholder style={styles.colorDotsContainer}>
        <SkeletonPlaceholder style={styles.colorDot} />
        <SkeletonPlaceholder style={styles.colorDot} />
        <SkeletonPlaceholder style={styles.colorDot} />
      </SkeletonPlaceholder>
    </View>
  </View>
);

// Header Skeleton
const HeaderSkeleton: React.FC = () => (
  <View style={styles.header}>
    <View style={styles.headerTopSpace} />
    <SkeletonPlaceholder style={styles.titlePlaceholder} />
  </View>
);

// Grid Row Skeleton
const GridRowSkeleton: React.FC = () => (
  <View style={styles.gridRow}>
    <ProductCardSkeleton />
    <ProductCardSkeleton />
  </View>
);

// Skeleton Loader Types
export type SkeletonType =
  | 'productGrid'
  | 'favorites'
  | 'homeScreen'
  | 'productCard'
  | 'header'
  | 'list';

interface SkeletonLoaderProps {
  type: SkeletonType;
  rows?: number;
  count?: number;
  animationType?: 'pulse' | 'shimmer';
  isLoading?: boolean;
  children?: React.ReactNode;
  // For progressive loading
  sections?: string[];
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  rows = 3,
  count = 6,
  animationType = 'pulse',
  isLoading = true,
  children,
  sections: _sections,
}) => {
  if (!isLoading) {
    return children ? <>{children}</> : null;
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'productGrid':
        return (
          <View style={styles.gridContainer}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <View style={styles.gridRow} key={`skeleton-row-${rowIndex}`}>
                <View style={styles.gridItem}>
                  <ProductCardSkeleton />
                </View>
                <View style={styles.gridItem}>
                  <ProductCardSkeleton />
                </View>
              </View>
            ))}
          </View>
        );

      case 'favorites':
        return (
          <View style={styles.container}>
            <HeaderSkeleton />
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.favoritesGrid}>
                {[...Array(Math.ceil(count / 2))].map((_, rowIndex) => (
                  <GridRowSkeleton key={rowIndex} />
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 'homeScreen':
        return (
          <View style={styles.container}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.homeHeader}>
                <SkeletonPlaceholder style={styles.headerLogo} animationType={animationType} />
              </View>

              {/* Highlighted Section */}
              <View style={styles.highlightedSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {[1, 2, 3].map((key) => (
                    <SkeletonPlaceholder
                      key={key}
                      style={styles.highlightedCard}
                      animationType={animationType}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Section with products */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderContainer}>
                  <SkeletonPlaceholder style={styles.sectionTitle} animationType={animationType} />
                  <SkeletonPlaceholder style={styles.sectionButton} animationType={animationType} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {[1, 2, 3, 4].map((key) => (
                    <SkeletonPlaceholder
                      key={key}
                      style={styles.promotionCard}
                      animationType={animationType}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Grid Section */}
              <View style={styles.section}>
                <View style={styles.productGrid}>
                  {[1, 2, 3, 4].map((key) => (
                    <SkeletonPlaceholder
                      key={key}
                      style={styles.homeGridCard}
                      animationType={animationType}
                    />
                  ))}
                </View>
              </View>

              {/* Footer */}
              <SkeletonPlaceholder style={styles.footer} animationType={animationType} />
            </ScrollView>
          </View>
        );

      case 'productCard':
        return <ProductCardSkeleton />;

      case 'header':
        return <HeaderSkeleton />;

      case 'list':
        return (
          <View style={styles.listContainer}>
            {Array.from({ length: count }).map((_, index) => (
              <SkeletonPlaceholder
                key={index}
                style={styles.listItem}
                animationType={animationType}
              />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return renderSkeleton();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  placeholder: {
    backgroundColor: colors.border,
    borderRadius: radius.xs,
  },
  shimmerContainer: {
    overflow: 'hidden',
    backgroundColor: colors.border,
    borderRadius: radius.xs,
  },
  // Header styles
  header: {
    backgroundColor: colors.background.light,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopSpace: {
    height: spacing.xxxl,
  },
  titlePlaceholder: {
    width: '40%',
    height: 30,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  homeHeader: {
    paddingHorizontal: spacing.lg,
    height: 48,
    marginBottom: spacing.lg,
  },
  headerLogo: {
    width: 50.7,
    height: 48,
    borderRadius: 4,
  },
  // Grid styles
  gridContainer: {
    paddingVertical: spacing.xl,
    gap: spacing.xxxl,
    alignItems: 'center',
    flexGrow: 1,
    backgroundColor: colors.background.light,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  gridItem: {
    flex: 1,
  },
  favoritesGrid: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // Card styles
  cardContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.sm,
  },
  textContainer: {
    paddingHorizontal: 0,
    gap: spacing.xs + 2,
    flex: 1,
  },
  textLineShort: {
    height: 10,
    width: '40%',
    borderRadius: radius.xs,
  },
  textLineLong: {
    height: 12,
    width: '80%',
    borderRadius: radius.xs,
  },
  textLineMedium: {
    height: 12,
    width: '60%',
    borderRadius: radius.xs,
  },
  colorDotsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    backgroundColor: 'transparent',
    height: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Home screen styles
  highlightedSection: {
    marginBottom: spacing.xl,
  },
  section: {
    paddingVertical: spacing.xl,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  sectionButton: {
    width: 80,
    height: 24,
    borderRadius: 4,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  highlightedCard: {
    width: 280,
    height: 180,
    borderRadius: 8,
  },
  promotionCard: {
    width: 132,
    height: 132,
    borderRadius: 8,
  },
  productGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  homeGridCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  footer: {
    height: 300,
    marginTop: spacing.xl,
    borderRadius: 8,
  },
  // List styles
  listContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  listItem: {
    height: 60,
    borderRadius: radius.md,
  },
});

export default SkeletonLoader;
export { SkeletonPlaceholder };
