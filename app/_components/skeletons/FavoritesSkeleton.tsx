import React from 'react';
import { StyleSheet, View, ScrollView, ViewStyle } from 'react-native';
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { getCardDimensions } from '../../_types/product-card';

// Get dimensions using the helper function
const cardDimensions = getCardDimensions('default', 'large');
const cardHeight = cardDimensions.height;

// Define Styles type
type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerTopSpace: ViewStyle;
  titlePlaceholder: ViewStyle;
  scrollContent: ViewStyle;
  gridContainer: ViewStyle;
  row: ViewStyle;
  cardPlaceholder: ViewStyle;
  cardImagePlaceholder: ViewStyle;
  cardTextPlaceholder: ViewStyle;
};

const SkeletonPlaceholder = () => (
  <View style={styles.cardPlaceholder}>
    {/* Mimic Image Area */}
    <View style={styles.cardImagePlaceholder} />
    {/* Mimic Text Area */}
    <View style={styles.cardTextPlaceholder} />
    <View style={[styles.cardTextPlaceholder, { width: '60%' }]} />
  </View>
);

const FavoritesSkeleton = () => {
  // Determine number of placeholders (e.g., 3 rows = 6 placeholders)
  const placeholderCount = 6;
  const rows = Math.ceil(placeholderCount / 2);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerTopSpace} />
        <View style={styles.titlePlaceholder} />
      </View>

      {/* Grid Skeleton - Wrapped in ScrollView for consistency */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {[...Array(rows)].map((_, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <SkeletonPlaceholder />
              <SkeletonPlaceholder />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
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
    height: 30, // Approximate height of the title
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.md, // Match header gap
  },
  scrollContent: {
    flexGrow: 1,
  },
  gridContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardPlaceholder: {
    width: '48.5%',
    height: cardHeight,
    backgroundColor: colors.background.medium,
    borderRadius: radius.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  cardImagePlaceholder: {
    height: (cardDimensions?.imageSize || 160) * 0.9,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  cardTextPlaceholder: {
    height: 14,
    width: '80%',
    backgroundColor: colors.border,
    borderRadius: radius.xs,
    marginBottom: spacing.xs,
  },
});

export default FavoritesSkeleton;
