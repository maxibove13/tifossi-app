import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackgroundProps,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// design‑tokens
import { colors, spacing, typography } from './styles';
// feature components
import ProductInfoHeader from './ProductInfoHeader';
import ProductDetails from './ProductDetails';
import ProductSections from '../sections/ProductSections';
import SupportOption from './SupportOption';
import OverlayCheckoutShipping from '../overlay/OverlayCheckoutShipping';

// utils + types
import { Product } from '../../../../_types/product';
import { getProductById } from '../../../../_data/products';

// Import card components
import PromotionCard from '../promotion/PromotionCard';
import MinicardLarge from '../minicard/large';

/************************************************************
 * Types & helpers                                          *
 ************************************************************/
interface DimensionsType {
  height?: string;
  depth?: string;
  width?: string;
}
interface BasicProduct {
  id: string;
  name: string;
  isCustomizable?: boolean;
  isDiscounted?: boolean;
  currentPrice: string;
  originalPrice?: string;
  shortDescription?: string | { line1: string; line2: string };
  longDescription?: string | string[];
  sku?: string;
  warranty?: string;
  returnPolicy?: string;
  dimensions?: DimensionsType;
  isFavorite?: boolean;
}
export interface SwipeableEdgeProps {
  product: BasicProduct;
  relatedProducts?: Product[];
  recommendedProducts?: Product[];
  trendingProducts?: Product[];
  onExpandedChange?: (expanded: boolean) => void;
  onAddToCart?: () => void;
  onViewMore?: (section: string) => void;
  onProductPress?: (productId: string) => void;
  onSupportAction?: (action: 'chat' | 'faq' | 'call') => void;
  onToggleFavorite?: () => void;
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
}
function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}
const MIN_COLLAPSED_SNAP_HEIGHT = 0;
const COLLAPSED_EXTRA_PADDING = spacing.xxl;

// Optimize: Replace LinearGradient with View for better performance
// The visual appearance is nearly identical - dark background with rounded corners
const SheetBackground = ({ style }: BottomSheetBackgroundProps) => (
  <View
    style={[
      style,
      StyleSheet.absoluteFill,
      {
        backgroundColor: 'rgba(12,12,12,0.98)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      },
    ]}
    pointerEvents="none"
  />
);

/************************************************************
 * Handle Component                                         *
 ************************************************************/
const SheetHandle = memo(({ onPress }: { onPress: () => void }) => {
  const { animatedIndex } = useBottomSheet();

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(animatedIndex.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  return (
    <View style={styles.handleRoot}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.7} onPress={onPress} />
      <Animated.View style={[styles.chevron, animatedStyle]}>
        <Ionicons name="chevron-up" size={24} color={colors.border} />
      </Animated.View>
    </View>
  );
});

SheetHandle.displayName = 'SheetHandle';

/************************************************************
 * Main Component                                           *
 ************************************************************/
// Cache for header heights based on device width
// This avoids remeasuring for same sized devices
const headerHeightCache: Record<number, number> = {};

// Helper function to simplify height calculation and caching
const getHeaderHeight = (deviceWidth: number): number | null => {
  return headerHeightCache[deviceWidth] || null;
};

// Helper function to save height calculation for future use
const saveHeaderHeight = (deviceWidth: number, height: number): void => {
  if (!headerHeightCache[deviceWidth] && height > 0) {
    headerHeightCache[deviceWidth] = height;
  }
};

const SwipeableEdge = ({
  product,
  relatedProducts = [],
  recommendedProducts = [],
  trendingProducts = [],
  onExpandedChange,
  onAddToCart,
  onViewMore = () => {},
  onProductPress = () => {},
  onSupportAction = () => {},
}: SwipeableEdgeProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { width: deviceWidth } = Dimensions.get('window');

  const [expanded, setExpanded] = useState(false);
  const [shippingVisible, setShippingVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Try to use cached header height for this device width if available
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState<number | null>(
    getHeaderHeight(deviceWidth)
  );

  // Cache header height after measurement for future use
  useEffect(() => {
    if (measuredHeaderHeight !== null) {
      saveHeaderHeight(deviceWidth, measuredHeaderHeight);
    }
  }, [measuredHeaderHeight, deviceWidth]);

  const collapsedSnap = useMemo(() => {
    if (measuredHeaderHeight === null) {
      return undefined;
    }
    return Math.max(measuredHeaderHeight + COLLAPSED_EXTRA_PADDING, MIN_COLLAPSED_SNAP_HEIGHT);
  }, [measuredHeaderHeight]);

  const snapPoints = useMemo(() => {
    return collapsedSnap ? [collapsedSnap, '100%'] : [];
  }, [collapsedSnap]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      const isNowExpanded = index === 1;
      if (isNowExpanded !== expanded) {
        setExpanded(isNowExpanded);
        onExpandedChange?.(isNowExpanded);
        triggerHaptic();
      }
    },
    [expanded, onExpandedChange]
  );

  const handleHeaderLayoutMeasure = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (height > 0 && measuredHeaderHeight === null) {
        // Only measure once, then cache for future use
        setMeasuredHeaderHeight(height);
      }
    },
    [measuredHeaderHeight]
  );

  const handleAddToCartPress = useCallback(() => {
    setShippingVisible(true);
  }, []);

  const handleSupportPress = useCallback(
    (type: 'chat' | 'faq' | 'call') => onSupportAction?.(type),
    [onSupportAction]
  );

  const handleViewMorePress = useCallback(
    (title: string) => {
      onViewMore(title);
    },
    [onViewMore]
  );

  const handleActualAddToCart = useCallback(
    (size: string, qty: number) => {
      onAddToCart?.();
    },
    [onAddToCart]
  );

  const adaptProduct = (): Product =>
    ({
      id: product.id,
      title: product.name,
      price: parseFloat(product.currentPrice.replace(/[^0-9.-]+/g, '')),
      isCustomizable: product.isCustomizable,
      shortDescription:
        typeof product.shortDescription === 'string'
          ? { line1: product.shortDescription, line2: '' }
          : product.shortDescription,
      longDescription: product.longDescription,
      warranty: product.warranty,
      returnPolicy: product.returnPolicy,
      dimensions: product.dimensions,
      ...(getProductById(product.id) || {}),
    }) as Product;

  /* Render */
  return (
    <>
      {/* 1. Render hidden header view for measurement if height not yet known */}
      {measuredHeaderHeight === null && (
        <View
          style={[styles.measureHeaderContainer, { paddingBottom: COLLAPSED_EXTRA_PADDING }]}
          pointerEvents="none"
          onLayout={handleHeaderLayoutMeasure}
        >
          <ProductInfoHeader
            productName={product.name}
            isCustomizable={product.isCustomizable}
            isDiscounted={product.isDiscounted}
            currentPrice={product.currentPrice}
            originalPrice={product.originalPrice}
            onAddToCart={() => {}}
          />
        </View>
      )}

      {/* 2. Conditionally render the actual BottomSheet once header is measured */}
      {measuredHeaderHeight !== null && collapsedSnap !== undefined && (
        <BottomSheet
          key={`sheet-${product.id}`}
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          topInset={0}
          enableDynamicSizing={false}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enablePanDownToClose={false}
          backgroundComponent={SheetBackground}
          handleComponent={() => (
            <SheetHandle onPress={() => bottomSheetRef.current?.snapToIndex(expanded ? 0 : 1)} />
          )}
          onChange={handleSheetChanges}
          android_keyboardInputMode={Platform.OS === 'android' ? 'adjustResize' : undefined}
        >
          {/* Wrapper View inside BottomSheet for header + padding */}
          <BottomSheetView
            style={[styles.paddedHorizontal, { paddingBottom: COLLAPSED_EXTRA_PADDING }]} // Apply padding here
          >
            <ProductInfoHeader
              productName={product.name}
              isCustomizable={product.isCustomizable}
              isDiscounted={product.isDiscounted}
              currentPrice={product.currentPrice}
              originalPrice={product.originalPrice}
              onAddToCart={handleAddToCartPress}
              // Removed containerStyle from here
            />
          </BottomSheetView>

          {/* Scrollable details */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
          >
            <BottomSheetView style={styles.paddedHorizontal}>
              <ProductDetails
                isCustomizable={product.isCustomizable}
                shortDescription={product.shortDescription}
                longDescription={product.longDescription}
                sku={product.sku}
                warranty={product.warranty}
                returnPolicy={product.returnPolicy}
                dimensions={product.dimensions}
              />
            </BottomSheetView>

            <BottomSheetView style={styles.paddedHorizontal}>
              {/* Use refactored ProductSections */}
              {relatedProducts.length > 0 && (
                <ProductSections
                  title="Productos Relacionados" // Pass title
                  products={relatedProducts}
                  CardComponent={PromotionCard} // Pass CardComponent
                  onProductPress={onProductPress}
                  onViewMore={handleViewMorePress} // Pass updated handler
                  invertTextColors
                  invertTitleColor
                  useSwipeableStyle
                />
              )}
              {recommendedProducts.length > 0 && (
                <ProductSections
                  title="Recomendados para ti" // Pass title
                  products={recommendedProducts}
                  CardComponent={PromotionCard} // Pass CardComponent
                  onProductPress={onProductPress}
                  onViewMore={handleViewMorePress}
                  invertTextColors
                  invertTitleColor
                  useSwipeableStyle
                />
              )}
              {trendingProducts.length > 0 && (
                <ProductSections
                  title="Tendencias" // Pass title
                  products={trendingProducts}
                  CardComponent={MinicardLarge} // Pass CardComponent
                  onProductPress={onProductPress}
                  onViewMore={handleViewMorePress}
                  invertTextColors
                  invertTitleColor
                  useSwipeableStyle
                />
              )}
            </BottomSheetView>

            <BottomSheetView style={[styles.paddedHorizontal, styles.supportBlock]}>
              <View style={styles.supportHeader}>
                <Text style={styles.supportTitle}>¿Tienes alguna duda?</Text>
                <TouchableOpacity onPress={() => handleSupportPress('call')}>
                  <Text style={styles.callText}>Llamar</Text>
                </TouchableOpacity>
              </View>
              <SupportOption
                title="Iniciar chat"
                description="Conversa con uno de nuestros agentes."
                iconType="chat"
                onPress={() => handleSupportPress('chat')}
              />
              <SupportOption
                title="Soporte | FAQ"
                description="Ve a la sección de ayuda."
                iconType="help"
                onPress={() => handleSupportPress('faq')}
              />
            </BottomSheetView>
          </BottomSheetScrollView>
        </BottomSheet>
      )}

      <OverlayCheckoutShipping
        isVisible={shippingVisible}
        onClose={() => setShippingVisible(false)}
        initialQuantity={quantity}
        onSelectQuantity={setQuantity}
        initialSize={selectedSize}
        onSelectSize={setSelectedSize}
        onAddToCart={handleActualAddToCart}
        product={adaptProduct()}
      />
    </>
  );
};

/************************************************************
 * styles                                                   *
 ************************************************************/
const styles = StyleSheet.create({
  handleRoot: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paddedHorizontal: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  supportBlock: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportTitle: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    color: colors.primary.text,
  },
  callText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.secondary.textDisabled,
    textDecorationLine: 'underline',
  },
  measureHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    zIndex: -1,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
});

const memoizedSwipeableEdge = memo(SwipeableEdge);

// Ensure this component is not treated as a route by exporting the component directly
export default memoizedSwipeableEdge;
