import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  Platform,
  ScrollView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from './styles';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Import our custom components
import ProductInfoHeader from './ProductInfoHeader';
import ProductDetails from './ProductDetails';
import SupportOption from './SupportOption';
import { Product } from '../../../../types/product';
import ProductSections from '../sections/ProductSections';
import OverlayCheckoutShipping from '../overlay/OverlayCheckoutShipping';
import { getProductById } from '../../../../data/products';

// Helper function for cross-platform haptic feedback
const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Silently fail if haptics aren't available
    });
  }
};

// Get screen dimensions
const { height } = Dimensions.get('window');

const _AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const DEFAULT_MIN_SNAP_HEIGHT = 250; // Fallback if measurement fails
const COLLAPSED_BOTTOM_PADDING = 56; // Extra space below the header in collapsed state

// Helper function to convert string shortDescription to object format if needed
const formatShortDescription = (desc: string | { line1: string; line2: string } | undefined) => {
  if (!desc) return undefined;
  if (typeof desc === 'string') {
    return { line1: desc, line2: '' };
  }
  return desc;
};

// Helper function to convert SwipeableEdge product to standard Product
const adaptProductForOverlay = (product: SwipeableEdgeProps['product']): Partial<Product> => {
  return {
    id: product.id,
    title: product.name,
    price: parseFloat(product.currentPrice.replace(/[^0-9.-]+/g, '')),
    isCustomizable: product.isCustomizable,
    shortDescription: formatShortDescription(product.shortDescription),
    longDescription: product.longDescription,
    warranty: product.warranty,
    returnPolicy: product.returnPolicy,
    dimensions: product.dimensions,
    // Find the full product from product catalog if possible
    ...(getProductById(product.id) || {}),
  };
};

interface SwipeableEdgeProps {
  /**
   * Product data
   */
  product: {
    id: string;
    name: string;
    isCustomizable?: boolean;
    isDiscounted?: boolean;
    currentPrice: string;
    originalPrice?: string;
    shortDescription?:
      | string
      | {
          line1: string;
          line2: string;
        };
    longDescription?: string | string[];
    sku?: string;
    warranty?: string;
    returnPolicy?: string;
    dimensions?: {
      height?: string;
      depth?: string;
      width?: string;
    };
  };
  /**
   * Related products data
   */
  relatedProducts?: Product[];
  /**
   * Recommended products data
   */
  recommendedProducts?: Product[];
  /**
   * Trending products data
   */
  trendingProducts?: Product[];
  /**
   * Header height to respect when fully expanded
   * @default 120
   */
  headerHeight?: number;
  /**
   * Optional callback when expanded state changes
   */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Optional callback for add to cart action
   */
  onAddToCart?: () => void;
  /**
   * Optional callback for "view more" actions
   */
  onViewMore?: (section: string) => void;
  /**
   * Optional callback for product press action
   */
  onProductPress?: (productId: string) => void;
  /**
   * Optional callback for support options
   */
  onSupportAction?: (action: 'chat' | 'faq' | 'call') => void;
}

/**
 * SwipeableEdge component for product details screen
 * Provides a swipeable panel that can be expanded/collapsed with gestures
 */
const SwipeableEdge = ({
  product,
  relatedProducts = [],
  recommendedProducts = [],
  trendingProducts = [],
  headerHeight = 120,
  onExpandedChange,
  onAddToCart: _onAddToCart = () => {},
  onViewMore = () => {},
  onProductPress = () => {},
  onSupportAction = () => {},
}: SwipeableEdgeProps) => {
  // Component state
  const [expanded, setExpanded] = useState(false);
  const [isShippingOverlayVisible, setIsShippingOverlayVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [headerContentHeight, setHeaderContentHeight] = useState<number | null>(null);

  // References
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef(null);

  // Calculate panel dimensions
  const MAX_PANEL_HEIGHT = height - headerHeight;

  // Calculate snap points dynamically based on header content height
  const snapPoints = useMemo(() => {
    const minSnap = headerContentHeight
      ? headerContentHeight + COLLAPSED_BOTTOM_PADDING
      : DEFAULT_MIN_SNAP_HEIGHT;

    const effectiveMinSnap = Math.min(minSnap, MAX_PANEL_HEIGHT - 1);
    return [effectiveMinSnap, MAX_PANEL_HEIGHT];
  }, [headerContentHeight, MAX_PANEL_HEIGHT]);

  // Calculate initial index
  const initialIndex = 0; // Start collapsed

  // Store the current product ID for change detection
  const productIdRef = useRef(product?.id);

  // Shared animated values for scroll tracking
  const scrollY = useSharedValue(0);

  // Reset scroll position
  const resetScroll = useCallback(() => {
    if (scrollViewRef.current) {
      (scrollViewRef.current as any).scrollTo?.({ y: 0, animated: false });
      scrollY.value = 0;
    }
  }, [scrollY]);

  // Reset when product changes
  useEffect(() => {
    // Check if product ID has changed
    if (product?.id !== productIdRef.current) {
      // Update ref
      productIdRef.current = product?.id;

      // Reset header height measurement for new product
      setHeaderContentHeight(null);

      // Reset to collapsed state
      if (expanded) {
        setExpanded(false);
        bottomSheetRef.current?.snapToIndex(0);
        resetScroll();
      }
    }
  }, [product?.id, expanded, resetScroll]);

  // Measure header content height
  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height: measuredHeight } = event.nativeEvent.layout;
      if (measuredHeight > 0 && measuredHeight !== headerContentHeight) {
        setHeaderContentHeight(measuredHeight);
      }
    },
    [headerContentHeight]
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      const isExpanded = index === 1;
      if (expanded !== isExpanded) {
        setExpanded(isExpanded);
        onExpandedChange?.(isExpanded);
        triggerHaptic();
      }
    },
    [expanded, onExpandedChange]
  );

  // Handle scroll events with native listener
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      // Use requestAnimationFrame to throttle updates and prevent rapid value changes
      requestAnimationFrame(() => {
        scrollY.value = offsetY;
      });
    },
    [scrollY]
  );

  // Animation for chevron rotation based on expanded state
  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${expanded ? 180 : 0}deg`,
        },
      ],
    };
  });

  // Animation for details opacity
  const detailsOpacity = useAnimatedStyle(() => {
    return {
      opacity: expanded ? 1 : 0,
    };
  });

  // Handle add to cart action
  const handleAddToCart = useCallback(() => {
    setIsShippingOverlayVisible(true);
  }, []);

  // Handle selection actions
  const handleSelectSize = useCallback(() => {
    // Handle size selection action
    // Do not close the shipping overlay here, let the user complete all selections
  }, []);

  const handleSelectQuantity = useCallback((quantity: number) => {
    // Handle quantity selection action
    setSelectedQuantity(quantity);
    // We DON'T close the shipping overlay here, let the shipping overlay handle this
    // onAddToCart will be called when user completes all selections
  }, []);

  // Custom handle component to match original design
  const renderHandle = useCallback(
    () => (
      <View style={styles.dragHandleContainer}>
        <TouchableOpacity
          onPress={() => {
            bottomSheetRef.current?.snapToIndex(expanded ? 0 : 1);
          }}
          style={styles.toggleArea}
          activeOpacity={0.7}
          testID="swipeable-edge-handle"
        >
          <View style={styles.invisibleTouchTarget} />
        </TouchableOpacity>

        <Animated.View style={[styles.dragHandle, chevronStyle]}>
          <Ionicons name="chevron-up" size={24} color={colors.border} />
        </Animated.View>
      </View>
    ),
    [expanded, chevronStyle]
  );

  // Custom background component
  const renderBackgroundComponent = useCallback(
    () => (
      <LinearGradient
        colors={['rgba(12, 12, 12, 0.9)', 'rgba(12, 12, 12, 1)']}
        style={StyleSheet.absoluteFill}
      />
    ),
    []
  );

  // Only render sheet if we have valid minimum snap point height
  const canRenderSheet = headerContentHeight !== null || DEFAULT_MIN_SNAP_HEIGHT > 0;

  // Create adapted product for overlay
  const adaptedProduct = useMemo(() => adaptProductForOverlay(product), [product]);

  return (
    <>
      {canRenderSheet && (
        <BottomSheet
          ref={bottomSheetRef}
          index={initialIndex}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          handleComponent={renderHandle}
          backgroundComponent={renderBackgroundComponent}
          style={styles.container}
          enablePanDownToClose={false}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={true}
          enableOverDrag={true}
          animateOnMount={true}
        >
          <BottomSheetScrollView
            ref={scrollViewRef}
            scrollEnabled={expanded}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.contentContainer}
            onScroll={handleScroll}
            bounces={false}
          >
            {/* Collapsed State Content - Measured for minHeight */}
            <View onLayout={handleHeaderLayout} style={styles.innerContent}>
              <ProductInfoHeader
                productName={product.name}
                isCustomizable={product.isCustomizable}
                isDiscounted={product.isDiscounted}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                onAddToCart={handleAddToCart}
              />
            </View>

            {/* Expanded State Content - Only visible when expanded */}
            <Animated.View style={[detailsOpacity, styles.expandedContentContainer]}>
              {/* Product Details Section */}
              <View style={styles.innerContent}>
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

              {/* Product Sections */}
              <View style={styles.sectionsContainer}>
                <ProductSections
                  relatedProducts={relatedProducts}
                  recommendedProducts={recommendedProducts}
                  trendingProducts={trendingProducts}
                  onProductPress={onProductPress}
                  onViewMore={onViewMore}
                  invertTextColors={true}
                  useSwipeableStyle={true}
                />
              </View>

              {/* Support Section */}
              <View style={styles.innerContent}>
                <View style={styles.supportSection}>
                  <View style={styles.supportHeader}>
                    <Text style={styles.supportTitle}>¿Tienes alguna duda?</Text>
                    <TouchableOpacity
                      onPress={() => onSupportAction('call')}
                      style={styles.callButton}
                    >
                      <Text style={styles.callButtonText}>Llamar</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.supportOptions}>
                    <SupportOption
                      title="Iniciar chat"
                      description="Conversa con uno de nuestros agentes."
                      iconType="chat"
                      onPress={() => onSupportAction('chat')}
                    />
                    <SupportOption
                      title="Soporte | FAQ"
                      description="Ve a la sección de ayuda."
                      iconType="help"
                      onPress={() => onSupportAction('faq')}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          </BottomSheetScrollView>
        </BottomSheet>
      )}

      {/* Shipping Overlay */}
      <OverlayCheckoutShipping
        isVisible={isShippingOverlayVisible}
        onClose={() => setIsShippingOverlayVisible(false)}
        onSelectSize={handleSelectSize}
        onSelectQuantity={handleSelectQuantity}
        initialQuantity={selectedQuantity}
        product={adaptedProduct as Product}
      />
    </>
  );
};

// Type definitions for our styles
type StylesType = {
  container: ViewStyle;
  dragHandleContainer: ViewStyle;
  toggleArea: ViewStyle;
  invisibleTouchTarget: ViewStyle;
  dragHandle: ViewStyle;
  contentContainer: ViewStyle;
  innerContent: ViewStyle;
  expandedContentContainer: ViewStyle;
  sectionsContainer: ViewStyle;
  productsSection: ViewStyle;
  placeholderProducts: ViewStyle;
  placeholderText: TextStyle;
  supportSection: ViewStyle;
  supportHeader: ViewStyle;
  supportTitle: TextStyle;
  callButton: ViewStyle;
  callButtonText: TextStyle;
  supportOptions: ViewStyle;
  horizontalScrollContent: ViewStyle;
};

const styles = StyleSheet.create<StylesType>({
  container: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  dragHandleContainer: {
    height: 40,
    width: '100%',
    position: 'relative',
  },
  toggleArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 2,
  },
  invisibleTouchTarget: {
    width: '100%',
    height: '100%',
  },
  dragHandle: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingBottom: spacing.xxxl,
    paddingTop: 0,
  },
  innerContent: {
    paddingHorizontal: spacing.lg,
  },
  expandedContentContainer: {
    marginTop: spacing.md,
  },
  sectionsContainer: {
    paddingHorizontal: spacing.lg,
  },
  productsSection: {
    marginTop: spacing.xl,
  },
  placeholderProducts: {
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.primary.text,
  },
  supportSection: {
    marginTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  supportTitle: {
    fontFamily: typography.heading.fontFamily,
    fontWeight: typography.heading.fontWeight as any,
    fontSize: typography.heading.fontSize,
    color: colors.primary.text,
  },
  callButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  callButtonText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.body.fontWeight as any,
    fontSize: typography.body.fontSize,
    color: colors.secondary.textDisabled,
    textDecorationLine: 'underline',
  },
  supportOptions: {
    gap: spacing.md,
  },
  horizontalScrollContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
});

export default SwipeableEdge;
