import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  LayoutChangeEvent,
  Dimensions,
  ScrollView,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackgroundProps,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// design‑tokens
import { colors, spacing, typography, radius } from './styles';
// feature components
import ProductInfoHeader from './ProductInfoHeader';
import ProductDetails from './ProductDetails';
import ProductSections from '../sections/ProductSections';
import OverlayCheckoutShipping from '../overlay/OverlayCheckoutShipping';
import OverlayAddingToCart from '../overlay/OverlayAddingToCart';
import OverlayProductAdding from '../overlay/OverlayProductAdding';
import OverlayShippingSelection from '../overlay/OverlayShippingSelection';
import { useAuthStore } from '../../../../_stores/authStore';
// TODO: Re-enable when support options are implemented
// import SupportOption from './SupportOption';

// utils + types
import { Product, ProductColor, ProductSize } from '../../../../_types/product';
import { usePaymentStore } from '../../../../_stores/paymentStore';

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
  colors?: ProductColor[];
  sizes?: ProductSize[];
  inStock?: boolean;
  stockCount?: number;
}
export interface SwipeableEdgeProps {
  product: BasicProduct;
  relatedProducts?: Product[];
  recommendedProducts?: Product[];
  trendingProducts?: Product[];
  onExpandedChange?: (expanded: boolean) => void;
  onAddToCart?: (selection: {
    quantity: number;
    size?: string;
    color?: string;
  }) => Promise<void> | void;
  onViewMore?: (section: string) => void;
  onProductPress?: (productId: string) => void;
  onSupportAction?: (action: 'chat' | 'faq' | 'call') => void;
  onToggleFavorite?: () => void;
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
  selectedSize?: string;
  onSizeChange?: (size: string) => void;
  selectedColor?: string;
}
function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}
const MIN_COLLAPSED_SNAP_HEIGHT = 0;
const COLLAPSED_EXTRA_PADDING = spacing.xxl + spacing.md;

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
      <Animated.View style={[styles.chevron, animatedStyle]} pointerEvents="none">
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
  quantity: quantityProp,
  onQuantityChange,
  selectedSize: selectedSizeProp,
  onSizeChange,
  selectedColor,
}: SwipeableEdgeProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { width: deviceWidth } = Dimensions.get('window');
  const { bottom: bottomSafeArea } = useSafeAreaInsets();

  const [expanded, setExpanded] = useState(false);
  const [quantity, setQuantity] = useState<number>(quantityProp ?? 1);
  const firstAvailableSize = useMemo(() => {
    return product.sizes?.find((size) => size.available)?.value || '';
  }, [product.sizes]);
  const [selectedSize, setSelectedSize] = useState<string>(selectedSizeProp || firstAvailableSize);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [showConfirmationOverlay, setShowConfirmationOverlay] = useState(false);
  const [showCheckoutOverlay, setShowCheckoutOverlay] = useState(false);
  // More reliable test environment detection for Jest
  const isTestEnv = typeof jest !== 'undefined';

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
    // measuredHeaderHeight already includes COLLAPSED_EXTRA_PADDING from the measurement view
    return Math.max(measuredHeaderHeight + bottomSafeArea, MIN_COLLAPSED_SNAP_HEIGHT);
  }, [measuredHeaderHeight, bottomSafeArea]);

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

  const totalColorStock = useMemo(() => {
    if (!product.colors?.length) return undefined;
    return product.colors.reduce((acc, color) => acc + (color.quantity ?? 0), 0);
  }, [product.colors]);

  const isOutOfStock = useMemo(() => {
    if (product.inStock === false) {
      return true;
    }

    if (typeof product.stockCount === 'number') {
      return product.stockCount <= 0;
    }

    if (typeof totalColorStock === 'number') {
      return totalColorStock <= 0;
    }

    return false;
  }, [product.inStock, product.stockCount, totalColorStock]);

  const handleSelectSize = useCallback(
    (sizeValue: string) => {
      setSelectedSize(sizeValue);
      onSizeChange?.(sizeValue);
    },
    [onSizeChange]
  );

  const renderStockStatus = () => {
    if (!isOutOfStock) return null;

    return (
      <View style={styles.stockBanner}>
        <Text style={styles.stockBannerText}>Sin stock</Text>
      </View>
    );
  };

  const renderProductSections = () => (
    <>
      {relatedProducts.length > 0 && (
        <ProductSections
          title="Productos Relacionados"
          products={relatedProducts}
          CardComponent={PromotionCard}
          onProductPress={onProductPress}
          onViewMore={handleViewMorePress}
          invertTextColors
          invertTitleColor
          useSwipeableStyle
        />
      )}
      {recommendedProducts.length > 0 && (
        <ProductSections
          title="Recomendados"
          products={recommendedProducts}
          CardComponent={PromotionCard}
          onProductPress={onProductPress}
          onViewMore={handleViewMorePress}
          invertTextColors
          invertTitleColor
          useSwipeableStyle
        />
      )}
      {trendingProducts.length > 0 && (
        <ProductSections
          title="Tendencias"
          products={trendingProducts}
          CardComponent={MinicardLarge}
          onProductPress={onProductPress}
          onViewMore={handleViewMorePress}
          invertTextColors
          invertTitleColor
          useSwipeableStyle
        />
      )}
    </>
  );

  const renderSupportContent = () => (
    <>
      <View style={styles.supportHeader}>
        <Text style={styles.supportTitle}>¿Tienes alguna duda?</Text>
        <TouchableOpacity onPress={() => handleSupportPress('call')}>
          <Text style={styles.callText}>Llamar</Text>
        </TouchableOpacity>
      </View>
      {/* TODO: Enable when chat support is implemented
      <SupportOption
        title="Iniciar chat"
        description="Conversa con uno de nuestros agentes."
        iconType="chat"
        onPress={() => handleSupportPress('chat')}
      />
      */}
      {/* TODO: Enable when FAQ section is implemented
      <SupportOption
        title="Soporte | FAQ"
        description="Ve a la sección de ayuda."
        iconType="help"
        onPress={() => handleSupportPress('faq')}
      />
      */}
    </>
  );

  // Sync quantity from prop only when prop changes externally
  useEffect(() => {
    if (typeof quantityProp === 'number') {
      setQuantity(quantityProp);
    }
  }, [quantityProp]);

  // Sync size from prop only when prop changes from parent
  useEffect(() => {
    if (selectedSizeProp) {
      setSelectedSize(selectedSizeProp);
    }
  }, [selectedSizeProp]);

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

  // Payment store for "buy now" flow
  const setPendingBuyNowItem = usePaymentStore((state) => state.setPendingBuyNowItem);
  const setSelectedStore = usePaymentStore((state) => state.setSelectedStore);
  const setGuestData = usePaymentStore((state) => state.setGuestData);
  const pendingBuyNowItemFromStore = usePaymentStore((state) => state.pendingBuyNowItem);
  const shouldShowShippingSelectionOnReturn = usePaymentStore(
    (state) => state.shouldShowShippingSelectionOnReturn
  );
  const setShouldShowShippingSelectionOnReturn = usePaymentStore(
    (state) => state.setShouldShowShippingSelectionOnReturn
  );

  // Auth store for shipping navigation
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // State for standalone shipping selection overlay (shown when returning from checkout)
  const [showReturnShippingOverlay, setShowReturnShippingOverlay] = useState(false);
  // Track whether we've shown the overlay for current pending item
  const [shownForPendingItem, setShownForPendingItem] = useState<string | null>(null);

  // Show shipping selection overlay when returning from checkout screens
  // Use useFocusEffect to ensure the overlay only shows when the product screen is focused
  // This prevents the modal from appearing on top of checkout screens during navigation
  useFocusEffect(
    useCallback(() => {
      // Check for "buy now" flow (pending item without adding to cart)
      if (
        pendingBuyNowItemFromStore &&
        pendingBuyNowItemFromStore.productId === product.id &&
        shownForPendingItem !== pendingBuyNowItemFromStore.productId
      ) {
        setShowReturnShippingOverlay(true);
        setShownForPendingItem(pendingBuyNowItemFromStore.productId);
        return;
      }

      // Check for "add to cart" flow (item already in cart, flag set)
      if (shouldShowShippingSelectionOnReturn) {
        setShowReturnShippingOverlay(true);
        setShouldShowShippingSelectionOnReturn(false);
      }
    }, [
      pendingBuyNowItemFromStore,
      product.id,
      shownForPendingItem,
      shouldShowShippingSelectionOnReturn,
      setShouldShowShippingSelectionOnReturn,
    ])
  );

  // Handle shipping selection from the return overlay
  const handleReturnShippingSelect = useCallback(
    (method: 'delivery' | 'pickup' | '') => {
      if (!method) return;

      setShowReturnShippingOverlay(false);
      // Reset tracking so overlay shows again if user navigates back
      setShownForPendingItem(null);
      // Set flag so overlay shows when user navigates back from checkout
      setShouldShowShippingSelectionOnReturn(true);

      if (method === 'delivery') {
        if (isLoggedIn) {
          router.navigate('/checkout/shipping-address');
        } else {
          router.navigate('/checkout/new-address?guest=true');
        }
      } else {
        if (isLoggedIn) {
          router.navigate('/checkout/shipping-pickup');
        } else {
          router.navigate('/checkout/guest-contact-info?returnTo=shipping-pickup');
        }
      }
    },
    [isLoggedIn, setShouldShowShippingSelectionOnReturn]
  );

  // Handle closing the return shipping overlay (user cancels "buy now" intent)
  const handleReturnShippingClose = useCallback(() => {
    setShowReturnShippingOverlay(false);
    // Clear pending buy now item since user is canceling the flow
    setPendingBuyNowItem(null);
  }, [setPendingBuyNowItem]);

  const handleAddToCartPress = useCallback(() => {
    if (isOutOfStock) return;
    setShowCheckoutOverlay(true);
  }, [isOutOfStock]);

  const handleOverlayAddToCart = useCallback(
    async (size: string, qty: number) => {
      const selection = {
        quantity: qty,
        size: size || undefined,
        color: selectedColor,
      };

      try {
        await onAddToCart?.(selection);
        setSelectedSize(size);
        setQuantity(qty);
        onSizeChange?.(size);
        onQuantityChange?.(qty);
        setShowLoadingOverlay(true);
      } catch (error) {
        console.error('Failed to add product to cart', error);
      }
    },
    [onAddToCart, selectedColor, onSizeChange, onQuantityChange]
  );

  // Handle "buy now" flow - sets pending item without adding to cart
  const handleOverlayBuyNow = useCallback(
    (size: string, qty: number) => {
      // Clear previous checkout state so each "buy now" starts fresh
      setSelectedStore(null);
      setGuestData(null);

      // Parse price from string (e.g., "$1,500" -> 1500)
      const parsePrice = (priceStr: string | undefined): number => {
        if (!priceStr) return 0;
        return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      };

      setPendingBuyNowItem({
        productId: product.id,
        title: product.name,
        size: size,
        quantity: qty,
        color: selectedColor,
        price: parsePrice(product.originalPrice || product.currentPrice),
        discountedPrice: product.isDiscounted ? parsePrice(product.currentPrice) : undefined,
      });
    },
    [
      product.id,
      product.name,
      product.currentPrice,
      product.originalPrice,
      product.isDiscounted,
      selectedColor,
      setPendingBuyNowItem,
      setSelectedStore,
      setGuestData,
    ]
  );

  const handleSupportPress = useCallback(
    (type: 'chat' | 'faq' | 'call') => onSupportAction?.(type),
    [onSupportAction]
  );

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingOverlay(false);
    setShowConfirmationOverlay(true);
  }, []);

  const handleCancelLoading = useCallback(() => {
    setShowLoadingOverlay(false);
  }, []);

  const handleViewMorePress = useCallback(
    (title: string) => {
      onViewMore(title);
    },
    [onViewMore]
  );

  /* Render */
  if (isTestEnv) {
    return (
      <View style={styles.testContainer}>
        <View style={styles.testHeaderBlock}>
          <ProductInfoHeader
            productName={product.name}
            isCustomizable={product.isCustomizable}
            isDiscounted={product.isDiscounted}
            currentPrice={product.currentPrice}
            originalPrice={product.originalPrice}
            onAddToCart={handleAddToCartPress}
            addToCartLabel={isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
            disabled={isOutOfStock}
          />
        </View>
        <ScrollView contentContainerStyle={styles.testScrollContent}>
          <View style={[styles.paddedHorizontal, styles.testSelectorsBlock]}>
            {renderStockStatus()}
            <ProductDetails
              isCustomizable={product.isCustomizable}
              shortDescription={product.shortDescription}
              longDescription={product.longDescription}
              sku={product.sku}
              warranty={product.warranty}
              returnPolicy={product.returnPolicy}
              dimensions={product.dimensions}
            />
          </View>
          <View style={[styles.paddedHorizontal, styles.testSectionsBlock]}>
            {renderProductSections()}
          </View>
          <View style={[styles.paddedHorizontal, styles.supportBlock]}>
            {renderSupportContent()}
          </View>
        </ScrollView>

        <OverlayCheckoutShipping
          isVisible={showCheckoutOverlay}
          onClose={() => setShowCheckoutOverlay(false)}
          onSelectSize={handleSelectSize}
          onSelectQuantity={(qty) => {
            setQuantity(qty);
            onQuantityChange?.(qty);
          }}
          onAddToCart={handleOverlayAddToCart}
          onBuyNow={handleOverlayBuyNow}
          initialQuantity={quantity}
          initialSize={selectedSize}
          product={
            {
              id: product.id,
              title: product.name,
              sizes: product.sizes,
            } as any
          }
        />

        <OverlayAddingToCart
          isVisible={showLoadingOverlay}
          onCancel={handleCancelLoading}
          onComplete={handleLoadingComplete}
        />

        <OverlayProductAdding
          isVisible={showConfirmationOverlay}
          onClose={() => setShowConfirmationOverlay(false)}
        />

        {/* Standalone shipping selection overlay - shown when returning from checkout */}
        <OverlayShippingSelection
          isVisible={showReturnShippingOverlay}
          onGoBack={handleReturnShippingClose}
          onClose={handleReturnShippingClose}
          onSelectShipping={handleReturnShippingSelect}
        />
      </View>
    );
  }

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
            addToCartLabel={isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
            disabled={isOutOfStock}
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
          <BottomSheetView style={{ paddingBottom: COLLAPSED_EXTRA_PADDING }}>
            <ProductInfoHeader
              productName={product.name}
              isCustomizable={product.isCustomizable}
              isDiscounted={product.isDiscounted}
              currentPrice={product.currentPrice}
              originalPrice={product.originalPrice}
              onAddToCart={handleAddToCartPress}
              addToCartLabel={isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
              disabled={isOutOfStock}
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
              {renderStockStatus()}
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
              {renderProductSections()}
            </BottomSheetView>

            <BottomSheetView style={[styles.paddedHorizontal, styles.supportBlock]}>
              {renderSupportContent()}
            </BottomSheetView>
          </BottomSheetScrollView>
        </BottomSheet>
      )}

      <OverlayCheckoutShipping
        isVisible={showCheckoutOverlay}
        onClose={() => setShowCheckoutOverlay(false)}
        onSelectSize={handleSelectSize}
        onSelectQuantity={(qty) => {
          setQuantity(qty);
          onQuantityChange?.(qty);
        }}
        onAddToCart={handleOverlayAddToCart}
        onBuyNow={handleOverlayBuyNow}
        initialQuantity={quantity}
        initialSize={selectedSize}
        product={
          {
            id: product.id,
            title: product.name,
            sizes: product.sizes,
          } as any
        }
      />

      <OverlayAddingToCart
        isVisible={showLoadingOverlay}
        onCancel={handleCancelLoading}
        onComplete={handleLoadingComplete}
      />

      <OverlayProductAdding
        isVisible={showConfirmationOverlay}
        onClose={() => setShowConfirmationOverlay(false)}
      />

      {/* Standalone shipping selection overlay - shown when returning from checkout */}
      <OverlayShippingSelection
        isVisible={showReturnShippingOverlay}
        onGoBack={handleReturnShippingClose}
        onClose={handleReturnShippingClose}
        onSelectShipping={handleReturnShippingSelect}
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
    gap: 80,
  },
  testContainer: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  testHeaderBlock: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  testScrollContent: {
    paddingBottom: spacing.xxxl,
    gap: 80,
  },
  testSelectorsBlock: {
    gap: spacing.md,
  },
  testSectionsBlock: {
    gap: spacing.xl,
  },
  stockBanner: {
    backgroundColor: colors.background.overlay,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockBannerText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
    color: colors.error,
  },
  supportBlock: {
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
    color: '#909090',
    paddingBottom: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#909090',
  },
  measureHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    zIndex: -1,
    width: '100%',
  },
});

const memoizedSwipeableEdge = memo(SwipeableEdge);

// Ensure this component is not treated as a route by exporting the component directly
export default memoizedSwipeableEdge;
