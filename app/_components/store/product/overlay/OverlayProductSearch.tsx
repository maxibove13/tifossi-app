import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
  ImageStyle,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSearch } from '../../../../../hooks/useSearch';
import { Product } from '../../../../_types/product';
import CloseIcon from '../../../../../assets/icons/close_md.svg';

// Import style tokens
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fonts, fontSizes, lineHeights } from '../../../../_styles/typography';

// Get screen dimensions
const { height } = Dimensions.get('window');

interface OverlayProductSearchProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function OverlayProductSearch({ isVisible, onClose }: OverlayProductSearchProps) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const { searchTerm, setSearchTerm, searchResults, isLoading, hasSearched } = useSearch();

  useEffect(() => {
    if (isVisible) {
      // Start fade-in and slide-up animations when overlay becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Clear search term when closing, but animation handles visibility
      setSearchTerm('');
    }
  }, [isVisible, fadeAnim, slideAnim, setSearchTerm]);

  const handleClose = () => {
    // Start fade-out and slide-down animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height, // Slide down to the bottom
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(); // Call original onClose after animation completes
    });
  };

  const handleProductPress = (productId: string) => {
    handleClose(); // Use handleClose to trigger animation
    // Navigate to the product screen with the ID as a query parameter
    router.navigate({
      pathname: '/products/product', // Correct route path
      params: { id: productId }, // Pass ID as query param
    });
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Use frontImage which is required in Product type, or fallback to first image from images array */}
      {item.frontImage ? (
        <Image
          source={typeof item.frontImage === 'string' ? { uri: item.frontImage } : item.frontImage}
          style={styles.productImage}
        />
      ) : item.images && item.images.length > 0 ? (
        <Image
          source={typeof item.images[0] === 'string' ? { uri: item.images[0] } : item.images[0]}
          style={styles.productImage}
        />
      ) : (
        <View style={styles.productImagePlaceholder} />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.productDescription} numberOfLines={1}>
          {item.shortDescription?.line1 || ''}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
          {item.discountedPrice && (
            <Text style={styles.discountedPrice}>${item.discountedPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal transparent visible={isVisible} onRequestClose={handleClose} animationType="none">
      <View style={styles.modalContainer}>
        {/* Animated overlay background that can be tapped to close */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Animated container that slides up */}
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Buscar productos</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoFocus={true}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Results or Empty State */}
          <View style={styles.resultsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : hasSearched ? (
              searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.resultsList}
                />
              ) : (
                <View style={styles.emptyResultsContainer}>
                  <Text style={styles.emptyResultsText}>
                    No se encontraron productos para "{searchTerm}"
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.startSearchContainer}>
                <Text style={styles.startSearchText}>
                  Ingresa un término para comenzar a buscar
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

type Styles = {
  modalContainer: ViewStyle;
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  searchInputContainer: ViewStyle;
  searchInput: TextStyle;
  resultsContainer: ViewStyle;
  resultsList: ViewStyle;
  productItem: ViewStyle;
  productImage: ImageStyle;
  productImagePlaceholder: ViewStyle;
  productInfo: ViewStyle;
  productTitle: TextStyle;
  productDescription: TextStyle;
  priceContainer: ViewStyle;
  productPrice: TextStyle;
  discountedPrice: TextStyle;
  loadingContainer: ViewStyle;
  emptyResultsContainer: ViewStyle;
  emptyResultsText: TextStyle;
  startSearchContainer: ViewStyle;
  startSearchText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    width: '100%',
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: '400',
    lineHeight: lineHeights.xl,
    color: '#424242',
  },
  closeButton: {
    width: 40,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchInput: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: '#FBFBFB',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  resultsList: {
    paddingBottom: spacing.xxl,
  },
  productItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    marginRight: spacing.lg,
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    marginRight: spacing.lg,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  productDescription: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.primary,
  },
  discountedPrice: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    textDecorationLine: 'line-through',
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyResultsText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    color: colors.secondary,
  },
  startSearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  startSearchText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    color: colors.secondary,
  },
});
