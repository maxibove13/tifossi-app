import { StyleSheet, View, Text, Pressable, Image, Share } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '../../../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { useFavoriteStatus } from '../../../../hooks/useFavoriteStatus';

// Import SVG icon
import SearchIcon from '../../../../assets/icons/search_glass.svg';
// Import Logo
import TiffosiLogo from '../../../../assets/images/logo/tiffosi.png';

// Import the search overlay component
import OverlayProductSearch from '../product/overlay/OverlayProductSearch';
// Import the filter overlay component
import OverlayProductFilters, { ProductFilters } from '../product/overlay/OverlayProductFilters';

// Import heart icons
import HeartActive from '../../../../assets/icons/heart_active.svg';
import HeartInactiveHeader from '../../../../assets/icons/heart_inactive_header.svg';

// Import SliderIcon
import SliderIcon from '../../../../assets/icons/slider.svg';

// Import ChevronLeft icon
import ChevronLeft from '../../../../assets/icons/chevron_left.svg';

// Import Share icon
import ShareIcon from '../../../../assets/icons/share.svg';

// Types needed for filter props
import { ProductColor, ProductSize, Product } from '../../../_types/product';

// Import API manager (respects USE_STRAPI flag)
import api from '../../../_services/api';

type HeaderVariant = 'store' | 'product' | 'catalog' | 'auth';

interface HeaderProps {
  title: string;
  variant?: HeaderVariant;
  productId?: string;
  // Filter-related props (optional, primarily for catalog)
  availableSizes?: ProductSize[];
  availableColors?: ProductColor[];
  minPrice?: number;
  maxPrice?: number;
  initialFilters?: ProductFilters;
  onApplyFilters?: (filters: ProductFilters) => void;
  invisible?: boolean;
}

function Header({
  title,
  variant = 'store',
  productId,
  // Destructure filter props with defaults
  availableSizes = [],
  availableColors = [],
  minPrice = 0,
  maxPrice = 5000,
  initialFilters = {},
  onApplyFilters = () => {},
  invisible = false,
}: HeaderProps) {
  const router = useRouter();
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false);
  const [isFilterOverlayVisible, setIsFilterOverlayVisible] = useState(false);
  const [productForShare, setProductForShare] = useState<Product | null>(null);

  // --- Fetch Product Data for Sharing ---
  useEffect(() => {
    if (variant === 'product' && productId) {
      const fetchProduct = async () => {
        try {
          const fetchedProduct = await api.fetchProductById(productId);
          setProductForShare(fetchedProduct || null);
        } catch {
          setProductForShare(null);
        }
      };
      fetchProduct();
    }
  }, [variant, productId]);
  // --- End Fetch Product Data ---

  // Get favorite status only if productId is provided and variant is 'product'
  const { isFavorite, toggle: toggleFavorite } = useFavoriteStatus(
    variant === 'product' ? productId : undefined
  );

  const handleSearchPress = () => {
    setIsSearchOverlayVisible(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOverlayVisible(false);
  };

  // New handlers for filter overlay
  const handleFilterPress = () => {
    setIsFilterOverlayVisible(true);
  };

  const handleCloseFilter = () => {
    setIsFilterOverlayVisible(false);
  };

  // --- Share Function ---
  const onShare = async () => {
    if (!productForShare) {
      // Product data not available for sharing
      return;
    }
    try {
      const result = await Share.share({
        message: `${productForShare.title} - ${productForShare.shortDescription?.line1 || ''}`,
        // Removed URL as it's not in the Product type
        // Optional: title: productForShare.title (for Android)
      });
      if (result.action === Share.sharedAction) {
        // Product shared successfully
      } else if (result.action === Share.dismissedAction) {
        // Share action dismissed
      }
    } catch {
      // Optionally show an alert to the user
    }
  };
  // --- End Share Function ---

  // Use the passed onApplyFilters prop
  const handleApplyFiltersInternal = (filters: ProductFilters) => {
    onApplyFilters(filters); // Call the function passed from parent
    handleCloseFilter(); // Close the overlay
  };

  const showBackButton = variant === 'product' || variant === 'catalog' || variant === 'auth';

  // If invisible, render a placeholder view that only provides safe area top padding
  if (invisible) {
    return <View style={styles.invisibleHeader} />;
  }

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {/* Left Side: Back Button, Logo, or Placeholder */}
        {showBackButton ? (
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ChevronLeft width={24} height={24} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        ) : variant === 'store' ? (
          // Render Logo for 'store' variant when no back button
          <View style={styles.logoContainer}>
            <Image source={TiffosiLogo} style={styles.logo} resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.placeholder} /> // Placeholder for other variants without back button
        )}

        {/* Title in row (for non-store variants) */}
        {variant !== 'store' && (
          <View style={styles.titleContainer}>
            <Text style={[styles.title, variant === 'auth' && styles.authTitle]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}

        {/* Action Icons (Conditional) */}
        <View style={styles.actions}>
          {variant === 'store' && (
            <Pressable
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              onPress={handleSearchPress}
            >
              <SearchIcon width={24} height={24} stroke={colors.primary} strokeWidth={1.2} />
            </Pressable>
          )}
          {variant === 'product' && (
            <>
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} onPress={onShare}>
                <ShareIcon width={24} height={24} />
              </Pressable>
              <Pressable
                testID="favorite-button"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={toggleFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? (
                  <HeartActive width={24} height={24} />
                ) : (
                  <HeartInactiveHeader width={24} height={24} />
                )}
              </Pressable>
            </>
          )}
          {variant === 'catalog' && (
            <>
              <Pressable
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={handleFilterPress}
              >
                <SliderIcon width={24} height={24} stroke={colors.primary} strokeWidth={1.2} />
              </Pressable>
              <Pressable
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={handleSearchPress}
              >
                <SearchIcon width={24} height={24} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Title below row (for store variant) */}
      {variant === 'store' && <Text style={styles.storeTitle}>{title}</Text>}

      {/* Render the search overlay */}
      <OverlayProductSearch isVisible={isSearchOverlayVisible} onClose={handleCloseSearch} />

      {/* Render the filter overlay */}
      <OverlayProductFilters
        isVisible={isFilterOverlayVisible}
        onClose={handleCloseFilter}
        onApplyFilters={handleApplyFiltersInternal}
        availableSizes={availableSizes}
        availableColors={availableColors}
        minPrice={minPrice}
        maxPrice={maxPrice}
        initialFilters={initialFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingTop: 59,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 24,
    backgroundColor: colors.background.offWhite,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  invisibleHeader: {
    width: '100%',
    paddingTop: 96, // Safe area top padding (spacing.xxxxl)
    backgroundColor: colors.background.offWhite,
  },
  row: {
    width: '100%',
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 60,
  },
  backText: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
    fontFamily: fonts.secondary,
  },
  logoContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    height: '100%',
    aspectRatio: 424 / 408, // Match actual image ratio for proper sizing
  },
  placeholder: {
    width: 60,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    // Title is centered due to flex: 1 and alignItems: center on row
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    lineHeight: lineHeights.lg,
    color: colors.primary,
    fontFamily: fonts.primary,
  },
  authTitle: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
    fontFamily: fonts.primary,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeTitle: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
    color: colors.primary,
    fontFamily: fonts.primary,
    alignSelf: 'stretch',
  },
});

// Ensure this component is not treated as a route
export default Header;
