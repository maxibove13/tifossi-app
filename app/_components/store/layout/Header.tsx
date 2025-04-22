import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { useFavoriteStatus } from '../../../../hooks/useFavoriteStatus';

// Import SVG icon
import SearchIcon from '../../../../assets/icons/search_glass.svg';
// Import Logo
import TiffosiLogo from '../../../../assets/images/logo/tiffosi.png';

// Import the search overlay component
import OverlayProductSearch from '../product/overlay/OverlayProductSearch';

// Import heart icons
import HeartActive from '../../../../assets/icons/heart_active.svg';
import HeartInactiveHeader from '../../../../assets/icons/heart_inactive_header.svg';

type HeaderVariant = 'store' | 'product' | 'catalog';

interface HeaderProps {
  title: string;
  variant?: HeaderVariant;
  productId?: string;
}

function Header({ title, variant = 'store', productId }: HeaderProps) {
  const router = useRouter();
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false);

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

  const showBackButton = variant === 'product' || variant === 'catalog';

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
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
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

        {/* Title (Conditional) */}
        <View style={styles.titleContainer}>
          {variant !== 'store' && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

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
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="share-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable
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
              <Pressable hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="filter-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={handleSearchPress}
              >
                {/* Use Ionicons search for consistency here, or keep SVG if preferred */}
                <Ionicons name="search-outline" size={24} color={colors.primary} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Render the search overlay */}
      <OverlayProductSearch isVisible={isSearchOverlayVisible} onClose={handleCloseSearch} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 104, // Standard height from ProductHeader
    paddingTop: 64, // Adjusted padding for safe area
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FBFBFB', // Match existing header background
    alignItems: 'center', // Center items vertically within the header height
  },
  row: {
    flex: 1,
    width: '100%', // Ensure row takes full width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Adjust justification for logo variant
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80, // Fixed width for alignment
    justifyContent: 'flex-start',
  },
  backText: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.primary,
    fontFamily: fonts.secondary,
  },
  logoContainer: {
    width: 80, // Match backButton width for alignment
    height: 24, // Fixed height for the logo
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    height: '100%', // Fill the container height
    width: '100%', // Adjust width automatically based on resizeMode
  },
  placeholder: {
    width: 80, // Match backButton width
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    // Title is centered due to flex: 1 and alignItems: center on row
  },
  title: {
    fontSize: fontSizes.md, // Using ProductHeader title size
    fontWeight: '600',
    lineHeight: lineHeights.md,
    color: colors.primary,
    fontFamily: fonts.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: 80, // Fixed width for alignment
    justifyContent: 'flex-end',
  },
  // Removed unused styles like toggleParent, toggle, etc.
});

// Ensure this component is not treated as a route
export default Header;
