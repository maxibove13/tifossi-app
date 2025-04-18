import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackgroundProps,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Product } from '../../../../types/product';
import { getProductById } from '../../../../data/products';

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
}
const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};
const MIN_COLLAPSED_SNAP_HEIGHT = 0;
const COLLAPSED_EXTRA_PADDING = spacing.xxxl;
const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
  <LinearGradient
    colors={['rgba(12,12,12,0.9)', 'rgba(12,12,12,1)']}
    style={[
      style,
      StyleSheet.absoluteFill,
      {
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

  const [expanded, setExpanded] = useState(false);
  const [shippingVisible, setShippingVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState<number | null>(null);

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
      console.log('[Measure] Layout Header Height:', height);
      if (height > 0 && measuredHeaderHeight === null) {
        console.log('[Measure] Setting measuredHeaderHeight:', height);
        setMeasuredHeaderHeight(height);
      }
    },
    [measuredHeaderHeight]
  );

  const handleAddToCartPress = useCallback(() => {
    setShippingVisible(true);
    onAddToCart?.();
  }, [onAddToCart]);

  const handleSupportPress = useCallback(
    (type: 'chat' | 'faq' | 'call') => onSupportAction?.(type),
    [onSupportAction]
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

  console.log('Render Check:', { measuredHeaderHeight, collapsedSnap, snapPoints });

  /* Render */
  return (
    <>
      {/* 1. Render hidden header view *only for measurement* if height not yet known */}
      {measuredHeaderHeight === null && (
        <View
          style={[styles.measureHeaderContainer, { paddingBottom: COLLAPSED_EXTRA_PADDING }]} // Apply padding here
          pointerEvents="none"
          onLayout={handleHeaderLayoutMeasure} // Apply onLayout here
        >
          <ProductInfoHeader
            productName={product.name}
            isCustomizable={product.isCustomizable}
            isDiscounted={product.isDiscounted}
            currentPrice={product.currentPrice}
            originalPrice={product.originalPrice}
            onAddToCart={() => {}}
            // Removed containerStyle and onLayout from here
          />
        </View>
      )}

      {/* 2. Conditionally render the actual BottomSheet once header is measured */}
      {measuredHeaderHeight !== null && collapsedSnap !== undefined && (
        <BottomSheet
          key={product.id}
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          topInset={0}
          enableDynamicSizing={false}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enablePanDownToClose={false}
          backgroundComponent={GradientBackground}
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
              {relatedProducts.length > 0 && (
                <ProductSections
                  products={relatedProducts}
                  sectionType="recommended"
                  onProductPress={onProductPress}
                  onViewMore={onViewMore}
                  invertTextColors
                  useSwipeableStyle
                />
              )}
              {recommendedProducts.length > 0 && (
                <ProductSections
                  products={recommendedProducts}
                  sectionType="recommended"
                  onProductPress={onProductPress}
                  onViewMore={onViewMore}
                  invertTextColors
                  useSwipeableStyle
                />
              )}
              {trendingProducts.length > 0 && (
                <ProductSections
                  products={trendingProducts}
                  sectionType="trending"
                  onProductPress={onProductPress}
                  onViewMore={onViewMore}
                  invertTextColors
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
        onSelectSize={() => {}}
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

export default memo(SwipeableEdge);
