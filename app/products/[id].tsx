import { StyleSheet, View, Text, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../_components/store/layout/Header';
import EnhancedProductGallery from '../_components/store/product/gallery/EnhancedProductGallery';
import SwipeableEdge from '../_components/store/product/swipeable/SwipeableEdge';
import { colors } from '../_styles/colors';
import { isProduct, Product } from '../_types/product';
import { hasStatus, ProductStatus } from '../_types/product-status';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '../_stores/cartStore';
import { useFavoritesStore } from '../_stores/favoritesStore';
import { useProduct, useProducts, useAppSettings } from '../_services/api/queryHooks';
import { SkeletonLoader } from '../_components/common/SkeletonLoader';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const productId = id as string;

  // Use TanStack Query to fetch product data
  const { data: product, isLoading: isLoadingProduct, error: productError } = useProduct(productId);
  // Also fetch all products for related/recommended products
  const { data: allProducts } = useProducts();
  // Fetch app settings for support phone number
  const { data: appSettings } = useAppSettings();

  // Helper functions to filter products by status
  const getProductsByStatus = (products: Product[], status: ProductStatus) => {
    return products?.filter((p) => hasStatus(p.statuses, status) && p.id !== productId) || [];
  };

  const getRelatedProductsByCategory = (
    products: Product[],
    categoryId: string,
    excludeId: string
  ) => {
    return (
      products?.filter((p) => p.categoryId === categoryId && p.id !== excludeId).slice(0, 6) || []
    );
  };

  // State for selected color and quantity
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors && product.colors.length > 0 ? product.colors[0].colorName : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.sizes && product.sizes.length > 0
      ? (product.sizes.find((size) => size.available)?.value ?? product.sizes[0].value)
      : undefined
  );
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Cart and favorites global state
  const addItemToCart = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => (product ? state.isFavorite(product.id) : false));

  // Get recommended, related, and trending products from API data
  const recommendedProducts = allProducts
    ? getProductsByStatus(allProducts, ProductStatus.RECOMMENDED)
    : [];
  const relatedProducts =
    allProducts && product
      ? getRelatedProductsByCategory(allProducts, product.categoryId, productId)
      : [];
  const trendingProducts = allProducts
    ? getProductsByStatus(allProducts, ProductStatus.POPULAR)
    : [];

  const handleAddToCart = async (
    product: Product,
    selection?: { quantity?: number; color?: string; size?: string }
  ) => {
    if (!product) return Promise.resolve();

    const quantityToUse = selection?.quantity ?? selectedQuantity;
    const colorToUse = selection?.color ?? selectedColor;
    const sizeToUse = selection?.size ?? selectedSize;

    try {
      await addItemToCart({
        productId: product.id,
        quantity: quantityToUse,
        color: colorToUse,
        size: sizeToUse,
        price: product.price,
        discountedPrice: product.discountedPrice,
      });

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    try {
      await toggleFavorite(product.id);
    } catch {}
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/${productId}` as any);
  };

  const handleViewCart = () => {
    router.push('/cart');
  };

  useEffect(() => {
    if (product?.colors?.length) {
      setSelectedColor((current) => current ?? product.colors[0].colorName);
    }
  }, [product?.id, product?.colors]);

  useEffect(() => {
    if (product?.sizes?.length) {
      const defaultSize =
        product.sizes.find((size) => size.available)?.value ?? product.sizes[0].value;
      setSelectedSize((current) => current ?? defaultSize);
    }
  }, [product?.id, product?.sizes]);

  useEffect(() => {
    setSelectedQuantity(1);
  }, [product?.id]);

  const handleSupportAction = (action: 'chat' | 'faq' | 'call') => {
    if (action === 'call' && appSettings?.supportPhoneNumber) {
      Linking.openURL(`tel:${appSettings.supportPhoneNumber}`);
    }
  };

  const handleViewMore = (_section: string) => {
    // Navigate to section view
  };

  // Loading state
  if (isLoadingProduct) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Header title="Cargando..." variant="product" />
        <View style={styles.loadingContainer}>
          <SkeletonLoader type="productGrid" rows={3} />
        </View>
      </View>
    );
  }

  // Error state
  if (productError) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Header title="Error" variant="product" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error al cargar el producto</Text>
          <Text style={styles.errorDetailText}>{productError}</Text>
        </View>
      </View>
    );
  }

  // Product not found state
  if (!product || !isProduct(product)) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Header title="Producto no encontrado" variant="product" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>El producto solicitado no existe</Text>
        </View>
      </View>
    );
  }

  // Use shortDescription directly, no fallback to description
  const shortDescription = product.shortDescription;

  // Use longDescription directly, no fallback to description
  const longDescription = product.longDescription;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title={product.title} variant="product" productId={product.id} />

      <View style={styles.mainContent}>
        <EnhancedProductGallery
          product={product}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />

        <SwipeableEdge
          key={`product-edge-${product.id}`}
          product={{
            id: product.id,
            name: product.title,
            isCustomizable: product.isCustomizable,
            isDiscounted: !!product.discountedPrice,
            currentPrice: `$${product.discountedPrice || product.price}`,
            originalPrice: product.discountedPrice ? `$${product.price}` : undefined,
            shortDescription: shortDescription,
            longDescription: longDescription,
            sku: product.id,
            warranty: product.warranty,
            returnPolicy: product.returnPolicy,
            dimensions: product.dimensions,
            isFavorite: isFavorite,
            colors: product.colors,
            sizes: product.sizes,
            inStock: product.inStock,
            stockCount: product.stockCount,
          }}
          relatedProducts={relatedProducts}
          recommendedProducts={recommendedProducts}
          trendingProducts={trendingProducts}
          onAddToCart={(selection) => handleAddToCart(product, selection)}
          onViewMore={handleViewMore}
          onSupportAction={handleSupportAction}
          onProductPress={handleProductPress}
          onToggleFavorite={handleToggleFavorite} // Pass favorite toggle handler
          onExpandedChange={(_expanded) => {}}
          quantity={selectedQuantity}
          onQuantityChange={setSelectedQuantity}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          selectedColor={selectedColor}
          onViewCart={handleViewCart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background.light,
    position: 'relative', // For positioning SwipeableEdge
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error || colors.text?.primary || '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetailText: {
    fontSize: 14,
    color: colors.text?.secondary || '#666',
    textAlign: 'center',
  },
});

// Metadata for the router (export to satisfy the linter)
export const screenExport = {
  name: 'ProductDetailScreen',
  version: '1.0.0',
};

// Add metadata to help router identification
