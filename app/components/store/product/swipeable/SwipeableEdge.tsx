import React, { useState, useCallback, useRef, forwardRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from './styles';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
  Extrapolate
} from 'react-native-reanimated';

// Import our custom components
import ProductInfoHeader from './ProductInfoHeader';
import ProductDetails from './ProductDetails';
import SectionHeader from './SectionHeader';
import SupportOption from './SupportOption';

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

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface ScrollViewProps extends React.ComponentProps<typeof ScrollView> {
  scrollEventThrottle?: number;
  onScroll?: any;
}

interface SwipeableEdgeProps {
  /**
   * Product data
   */
  product?: {
    name: string;
    isCustomizable?: boolean;
    isDiscounted?: boolean;
    currentPrice: string;
    originalPrice?: string;
    description?: string;
    sku?: string;
  };
  /**
   * Minimum visible height when collapsed
   * @default 250
   */
  minHeight?: number;
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
   * Optional callback for support options
   */
  onSupportAction?: (action: 'chat' | 'faq' | 'call') => void;
}

/**
 * SwipeableEdge component for product details screen
 * Provides a swipeable panel that can be expanded/collapsed with gestures
 */
const SwipeableEdge = ({ 
  product = {
    name: 'Neceser Globo',
    isCustomizable: true,
    isDiscounted: true,
    currentPrice: '$390.00',
    originalPrice: '$590.00',
    description: 'Tiffosi le ofrece un producto altamente confeccionado. Un diseño a medida para el deportista. Productos personalizados.',
    sku: '2001202104'
  },
  minHeight = 250,
  headerHeight = 120,
  onExpandedChange,
  onAddToCart = () => {},
  onViewMore = () => {},
  onSupportAction = () => {}
}: SwipeableEdgeProps) => {
  // Calculate panel dimensions
  const MIN_PANEL_HEIGHT = minHeight;
  const MAX_PANEL_HEIGHT = height - headerHeight;
  const PANEL_RANGE = MAX_PANEL_HEIGHT - MIN_PANEL_HEIGHT;
  
  // Component state
  const [expanded, setExpanded] = useState(false);
  
  // React refs for DOM access
  const scrollViewRef = useRef(null);
  
  // Shared animated values
  const translateY = useSharedValue(PANEL_RANGE); // Distance from fully expanded (0 = fully expanded)
  const scrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  
  // Handle state change
  const updateExpandedState = useCallback((isExpanded: boolean) => {
    if (expanded !== isExpanded) {
      setExpanded(isExpanded);
      onExpandedChange?.(isExpanded);
      triggerHaptic();
    }
  }, [expanded, onExpandedChange]);
  
  // Reset scroll position
  const resetScroll = useCallback(() => {
    if (scrollViewRef.current) {
      // Cast to any to avoid TypeScript errors
      (scrollViewRef.current as any).scrollTo?.({ x: 0, y: 0, animated: false });
      scrollY.value = 0;
    }
  }, [scrollY]);
  
  // Toggle expanded state with animation
  const toggleExpanded = useCallback(() => {
    const toValue = expanded ? PANEL_RANGE : 0;
    translateY.value = withSpring(toValue, {
      damping: 20,
      stiffness: 200,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01
    }, () => {
      runOnJS(updateExpandedState)(!expanded);
      
      // Reset scroll when collapsing
      if (expanded) {
        runOnJS(resetScroll)();
      }
    });
  }, [expanded, PANEL_RANGE, translateY, updateExpandedState, resetScroll]);
  
  // Gesture handler for the panel
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
      isDragging.value = true;
    },
    onActive: (event, ctx) => {
      // Calculate new position
      let newY = ctx.startY + event.translationY;
      
      // Apply boundaries with subtle resistance
      if (newY < 0) {
        newY = -Math.log(1 - newY / -200) * 40; // Subtle resistance when pulling beyond bounds
      } else if (newY > PANEL_RANGE) {
        newY = PANEL_RANGE + Math.log(1 + (newY - PANEL_RANGE) / 200) * 40;
      }
      
      translateY.value = newY;
    },
    onEnd: (event) => {
      isDragging.value = false;
      
      // Determine whether to snap to expanded or collapsed
      const shouldExpand = translateY.value < PANEL_RANGE * 0.4 || event.velocityY < -300;
      
      // Apply spring animation
      translateY.value = withSpring(
        shouldExpand ? 0 : PANEL_RANGE,
        {
          damping: 20,
          stiffness: 200,
          mass: 1,
          velocity: event.velocityY,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01
        }, 
        () => {
          runOnJS(updateExpandedState)(shouldExpand);
          
          // Reset scroll when collapsing
          if (!shouldExpand && scrollY.value > 0) {
            runOnJS(resetScroll)();
          }
        }
      );
    }
  });
  
  // Handle scroll events
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onBeginDrag: () => {
      isDragging.value = true;
    },
    onEndDrag: () => {
      isDragging.value = false;
    }
  });
  
  // Panel height animation
  const panelStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        translateY.value,
        [0, PANEL_RANGE],
        [MAX_PANEL_HEIGHT, MIN_PANEL_HEIGHT],
        Extrapolate.CLAMP
      )
    };
  });
  
  // Chevron rotation animation - directly tied to panel position
  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ 
        rotate: `${interpolate(
          translateY.value,
          [0, PANEL_RANGE],
          [180, 0],
          Extrapolate.CLAMP
        )}deg` 
      }]
    };
  });
  
  // Header opacity animation
  const headerOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateY.value,
        [0, PANEL_RANGE],
        [1, 1],
        Extrapolate.CLAMP
      )
    };
  });
  
  // Details opacity animation
  const detailsOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateY.value,
        [0, PANEL_RANGE * 0.3],
        [1, 0],
        Extrapolate.CLAMP
      )
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        panelStyle
      ]}
      testID="swipeable-edge-container"
    >
      {/* Header with gradient background */}
      <LinearGradient
        colors={['rgba(12, 12, 12, 0.9)', 'rgba(12, 12, 12, 1)']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Make the entire top edge draggable */}
      <PanGestureHandler
        onGestureEvent={panGestureHandler}
        enabled={true}
        shouldCancelWhenOutside={false}
      >
        <Animated.View style={styles.dragHandleContainer}>
          {/* Clickable area for direct toggle */}
          <TouchableOpacity
            onPress={toggleExpanded}
            style={styles.toggleArea}
            activeOpacity={0.7}
            testID="swipeable-edge-handle"
          >
            <View style={styles.invisibleTouchTarget} />
          </TouchableOpacity>
          
          {/* Chevron indicator */}
          <Animated.View style={[styles.dragHandle, chevronStyle]}>
            <Ionicons 
              name="chevron-up" 
              size={24} 
              color={colors.border} 
            />
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Scrollable content */}
      <AnimatedScrollView
        ref={scrollViewRef}
        scrollEnabled={expanded}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.contentContainer}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* Product Info Header Section */}
        <Animated.View style={headerOpacity}>
          <ProductInfoHeader
            productName={product.name}
            isCustomizable={product.isCustomizable}
            isDiscounted={product.isDiscounted}
            currentPrice={product.currentPrice}
            originalPrice={product.originalPrice}
            onAddToCart={onAddToCart}
          />
        </Animated.View>
        
        {/* Product Details Section - only visible when expanded */}
        <Animated.View style={detailsOpacity}>
          <ProductDetails
            isCustomizable={product.isCustomizable}
            description={product.description}
            sku={product.sku}
          />
          
          {/* Related Products Section */}
          <View style={styles.productsSection}>
            <SectionHeader 
              title="Productos relacionados" 
              actionText="Ver Más"
              onActionPress={() => onViewMore('related')}
            />
            <View style={styles.placeholderProducts}>
              <Text style={styles.placeholderText}>Productos relacionados aquí</Text>
            </View>
          </View>
          
          {/* Recommended Products Section */}
          <View style={styles.productsSection}>
            <SectionHeader 
              title="Recomendados para ti" 
              actionText="Ver Más"
              onActionPress={() => onViewMore('recommended')}
            />
            <View style={styles.placeholderProducts}>
              <Text style={styles.placeholderText}>Productos recomendados aquí</Text>
            </View>
          </View>
          
          {/* Trends Section */}
          <View style={styles.productsSection}>
            <SectionHeader 
              title="Tendencias" 
              actionText="Ver Todo"
              onActionPress={() => onViewMore('trends')}
            />
            <View style={styles.placeholderProducts}>
              <Text style={styles.placeholderText}>Productos tendencia aquí</Text>
            </View>
          </View>
          
          {/* Support Section */}
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
                iconName="chatbubble-outline"
                onPress={() => onSupportAction('chat')}
              />
              <SupportOption
                title="Soporte | FAQ"
                description="Ve a la sección de ayuda."
                iconName="help-circle-outline"
                onPress={() => onSupportAction('faq')}
              />
            </View>
          </View>
        </Animated.View>
      </AnimatedScrollView>
    </Animated.View>
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
  productsSection: ViewStyle;
  placeholderProducts: ViewStyle;
  placeholderText: TextStyle;
  supportSection: ViewStyle;
  supportHeader: ViewStyle;
  supportTitle: TextStyle;
  callButton: ViewStyle;
  callButtonText: TextStyle;
  supportOptions: ViewStyle;
};

const styles = StyleSheet.create<StylesType>({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  productsSection: {
    paddingHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.lg,
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
  },
  supportOptions: {
    gap: spacing.md,
  },
});

export default SwipeableEdge;