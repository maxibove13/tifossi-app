import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { getCardDimensions } from '../../_types/product-card';

const screenWidth = Dimensions.get('window').width;

// Get dimensions for the large default card to match the skeleton
const cardDimensions = getCardDimensions('default', 'large');
const cardWidth = cardDimensions.width as number; // 160
const cardHeight = cardDimensions.height; // 272
const imageSize = cardDimensions.imageSize; // 160

const SkeletonPlaceholder = ({
  style,
  children,
}: {
  style?: object;
  children?: React.ReactNode;
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sharedAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    sharedAnimation.start();
    return () => sharedAnimation.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return <Animated.View style={[styles.placeholder, { opacity }, style]}>{children}</Animated.View>;
};

const ProductCardSkeleton = () => {
  return (
    <View style={styles.cardContainer}>
      {/* Image Placeholder */}
      <SkeletonPlaceholder
        style={[styles.imagePlaceholder, { width: imageSize, height: imageSize }]}
      />
      {/* Text Placeholders */}
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
};

const ProductGridSkeleton = ({ rows = 3 }: { rows?: number }) => {
  // Calculate horizontal padding based on screen width and card width
  const totalCardsWidth = cardWidth * 2;
  const remainingSpace = screenWidth - totalCardsWidth;
  const sidePadding = Math.max(spacing.lg, remainingSpace / 3); // Ensure minimum padding lg
  const gap = screenWidth - sidePadding * 2 - totalCardsWidth; // Calculate the gap based on padding

  return (
    <View style={[styles.gridContainer, { paddingHorizontal: sidePadding }]}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View style={[styles.gridRow, { gap: gap }]} key={`skeleton-row-${rowIndex}`}>
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
};

const styles = StyleSheet.create({
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
  },
  gridItem: {
    // flex: 1, // Let width be determined by content
    width: cardWidth,
  },
  cardContainer: {
    width: cardWidth,
    height: cardHeight,
    gap: spacing.sm,
  },
  placeholder: {
    backgroundColor: colors.border, // Use a subtle color
    borderRadius: radius.xs,
  },
  imagePlaceholder: {
    borderRadius: radius.xs,
  },
  textContainer: {
    paddingHorizontal: 0, // Match card content padding
    gap: spacing.xs + 2, // Slightly more gap for text lines
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
    backgroundColor: 'transparent', // Override placeholder background
    height: 12, // Match color dot size
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default ProductGridSkeleton;
