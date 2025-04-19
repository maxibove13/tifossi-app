import { StyleSheet, View, ScrollView, Animated } from 'react-native';
import { colors } from '../../_styles/colors';
import { spacing } from '../../_styles/spacing';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

// This defines the loading state for each section of the home screen
export interface SectionLoadingState {
  highlighted: boolean;
  featured: boolean;
  recommended: boolean;
  trending: boolean;
  newReleases: boolean;
  launchOpportunity: boolean;
}

// Props for the skeleton with options for progressive loading
interface HomeScreenSkeletonProps {
  // If true, render the full skeleton; if false, show nothing
  isLoading?: boolean;
  // If provided, enables progressive loading by section
  sectionLoadingState?: Partial<SectionLoadingState>;
  // For allowing children to be passed (actual content sections)
  children?: React.ReactNode;
}

const ShimmerPlaceholder = ({ style }: { style: any }) => {
  const translateX = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 100,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [translateX]);

  return (
    <View style={[styles.shimmerContainer, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['#F5F5F5', '#E0E0E0', '#F5F5F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

export default function HomeScreenSkeleton({
  isLoading = true,
  sectionLoadingState,
  children,
}: HomeScreenSkeletonProps) {
  // If not loading at all, render nothing (or children if provided)
  if (!isLoading && !sectionLoadingState) {
    return children ? <>{children}</> : null;
  }

  // Fallback to full skeleton if isLoading=true and no sectionLoadingState
  const shouldShowSection = (sectionName: keyof SectionLoadingState): boolean => {
    if (!sectionLoadingState) return isLoading;
    return sectionLoadingState[sectionName] ?? false;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Skeleton - Always shown during loading */}
        <View style={styles.header}>
          <ShimmerPlaceholder style={styles.headerLogo} />
        </View>

        {/* Highlighted Products Skeleton */}
        {shouldShowSection('highlighted') && (
          <View style={styles.highlightedSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {[1, 2, 3].map((key) => (
                <ShimmerPlaceholder key={key} style={styles.highlightedCard} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended Products Section (Promotions) */}
        {shouldShowSection('recommended') && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <ShimmerPlaceholder style={styles.sectionTitle} />
              <ShimmerPlaceholder style={styles.sectionButton} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {[1, 2, 3, 4].map((key) => (
                <ShimmerPlaceholder key={key} style={styles.promotionCard} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Triple Showcase Skeleton - Static content, always shown */}
        <View style={[styles.section, styles.showcaseSection]}>
          {[1, 2, 3].map((key) => (
            <ShimmerPlaceholder key={key} style={styles.showcaseItem} />
          ))}
        </View>

        {/* Trending Products Section */}
        {shouldShowSection('trending') && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <ShimmerPlaceholder style={styles.sectionTitle} />
              <ShimmerPlaceholder style={styles.sectionButton} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {[1, 2, 3, 4].map((key) => (
                <ShimmerPlaceholder key={key} style={styles.productCard} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Product */}
        {shouldShowSection('featured') && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <ShimmerPlaceholder style={styles.sectionTitle} />
            </View>
            <View style={styles.featuredCardContainer}>
              <ShimmerPlaceholder style={styles.featuredCard} />
            </View>
          </View>
        )}

        {/* Launch & Opportunity Products (Product Grid) */}
        {shouldShowSection('launchOpportunity') && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <ShimmerPlaceholder style={styles.sectionTitle} />
            </View>
            <View style={styles.productGrid}>
              {[1, 2, 3, 4].map((key) => (
                <ShimmerPlaceholder key={key} style={styles.gridCard} />
              ))}
            </View>
          </View>
        )}

        {/* CTA Button - Static content, always shown */}
        <View style={styles.buttonContainer}>
          <ShimmerPlaceholder style={styles.button} />
        </View>

        {/* Locations - Static content, always shown */}
        <ShimmerPlaceholder style={styles.locations} />

        {/* Sos parte section - Static content, always shown */}
        <View style={styles.sosParteSection}>
          <ShimmerPlaceholder style={styles.sosParteText} />
          <ShimmerPlaceholder style={styles.sosParteLogo} />
        </View>

        {/* Footer - Static content, always shown */}
        <ShimmerPlaceholder style={styles.footer} />
      </ScrollView>
    </View>
  );
}

// Export ShimmerPlaceholder for reuse in other components
export { ShimmerPlaceholder };

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
  shimmerContainer: {
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: spacing.lg,
    height: 48,
    marginBottom: spacing.lg,
  },
  headerLogo: {
    width: 50.7,
    height: 48,
    borderRadius: 4,
  },
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
    width: 160,
    height: 200,
    borderRadius: 8,
  },
  showcaseSection: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  showcaseItem: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  productCard: {
    width: 160,
    height: 240,
    borderRadius: 8,
  },
  featuredCardContainer: {
    paddingHorizontal: spacing.lg,
  },
  featuredCard: {
    height: 400,
    borderRadius: 8,
  },
  productGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    height: 240,
    borderRadius: 8,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  button: {
    width: 200,
    height: 48,
    borderRadius: 24,
  },
  locations: {
    height: 200,
    marginHorizontal: spacing.lg,
    borderRadius: 8,
  },
  sosParteSection: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  sosParteText: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  sosParteLogo: {
    width: 100,
    height: 100,
    borderRadius: 4,
  },
  footer: {
    height: 300,
    marginTop: spacing.xl,
    borderRadius: 8,
  },
});
