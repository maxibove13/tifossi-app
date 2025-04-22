import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { spacing, radius } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../_styles/typography';
import { router } from 'expo-router';
import EmptyCart from '../_components/store/cart/EmptyCart';
import { Product } from '../_types/product';
import Subheader from '../_components/common/Subheader';
import PromotionCard from '../_components/store/product/promotion/PromotionCard';
import CartProductCard from '../_components/store/product/cart/CartProductCard';
import Button from '../_components/ui/buttons/Button';
import Dropdown from '../_components/ui/form/Dropdown';
import { getProductById, products } from '../_data/products';
import { useCartStore } from '../_stores/cartStore';
import { useProducts } from '../../hooks/useProducts';
import ScreenHeader from '../_components/common/ScreenHeader';
import OverlayProductEdit from '../_components/store/product/overlay/OverlayProductEdit';

// Dummy data for recently viewed products - use actual products from data file
const recentlyViewedProducts: Product[] = [
  getProductById('neceser-ball') || products[0],
  getProductById('mochila-classic') || products[1],
  getProductById('mochila-sq') || products[2],
  getProductById('buzo-oversize') || products[3],
  getProductById('cap-v3') || products[4],
].filter((p): p is Product => p !== undefined);

// Cart item interface - simply extends Product with quantity
interface CartDisplayItem extends Product {
  quantity: number;
  selectedSize?: string;
  color?: string; // Override color display in cart
}

export default function CartScreen() {
  // Get all products
  const { data: allProducts = [] } = useProducts();

  // Get cart state
  const cartStoreItems = useCartStore((state) => state.items);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);

  // State for edit overlay
  const [isEditOverlayVisible, setIsEditOverlayVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CartDisplayItem | null>(null);

  // Convert cart items to CartDisplayItem format with full product details
  const cartItems = useMemo(() => {
    const result: CartDisplayItem[] = [];

    for (const item of cartStoreItems) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) {
        result.push({
          ...product,
          quantity: item.quantity,
          selectedSize: item.size,
          color: item.color,
        });
      }
    }

    return result;
  }, [cartStoreItems, allProducts]);

  const isEmpty = cartItems.length === 0;

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMoreRecentlyViewed = () => {
    console.log('View all recently viewed products');
  };

  const handleQuantityChange = (id: string, newQuantity: number, color?: string, size?: string) => {
    updateItemQuantity(id, color, size, newQuantity);
  };

  const handleRemoveItem = (id: string, color?: string, size?: string) => {
    removeItem(id, color, size);
  };

  const handleEditItem = (item: CartDisplayItem) => {
    setEditingItem(item);
    setIsEditOverlayVisible(true);
  };

  const handleSaveEdit = (newSize: string, newQuantity: number) => {
    if (editingItem) {
      removeItem(editingItem.id, editingItem.color, editingItem.selectedSize);
      addItem({
        productId: editingItem.id,
        quantity: newQuantity,
        size: newSize,
        color: editingItem.color,
      });
    }
    setIsEditOverlayVisible(false);
    setEditingItem(null);
  };

  const handleRemoveFromEdit = () => {
    if (editingItem) {
      removeItem(editingItem.id, editingItem.color, editingItem.selectedSize);
    }
    setIsEditOverlayVisible(false);
    setEditingItem(null);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateDiscountTotal = () => {
    return cartItems.reduce((sum, item) => {
      const regularPrice = item.price * item.quantity;
      const discountedPrice = (item.discountedPrice || item.price) * item.quantity;
      return sum + (regularPrice - discountedPrice);
    }, 0);
  };

  const hasDiscountedItems = () => {
    return cartItems.some((item) => item.discountedPrice);
  };

  const handleBuyNow = () => {
    console.log('Proceed to checkout');
  };

  const handleCouponPress = () => {
    console.log('Coupon dropdown pressed');
    // Logic to show coupon options
  };

  const handleGiftCardPress = () => {
    console.log('Gift card dropdown pressed');
    // Logic to show gift card options
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Carrito" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isEmpty && styles.scrollContentEmpty, // Apply light background when empty
        ]}
      >
        {isEmpty ? (
          <EmptyCart onGoToStore={handleGoToStore} />
        ) : (
          <>
            {/* Cart Items Section */}
            <View style={styles.cartItemsContainer}>
              {cartItems.map((item) => (
                <CartProductCard
                  key={`${item.id}-${item.color}-${item.selectedSize}`}
                  product={item}
                  quantity={item.quantity}
                  onQuantityChange={(quantity) =>
                    handleQuantityChange(item.id, quantity, item.color, item.selectedSize)
                  }
                  onRemove={() => handleRemoveItem(item.id, item.color, item.selectedSize)}
                  onEdit={() => handleEditItem(item)}
                />
              ))}
            </View>

            {/* Spacer */}
            <View style={styles.sectionSpacer} />

            {/* Payment Summary Section */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${calculateTotal().toFixed(2)}</Text>
              </View>
              {/* Only show discount row if there are discounted items */}
              {hasDiscountedItems() && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountLabel]}>Descuento</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -${calculateDiscountTotal().toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Envío</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalValue}>
                  ${(calculateTotal() - calculateDiscountTotal()).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Spacer */}
            <View style={styles.sectionSpacer} />

            {/* Coupon Dropdown */}
            <View style={styles.dropdownSection}>
              <Dropdown label="¿Tienes algún cupón disponible?" onPress={handleCouponPress} />
            </View>

            {/* Spacer */}
            <View style={styles.sectionSpacer} />

            {/* Gift Card Dropdown */}
            <View style={styles.dropdownSection}>
              <Dropdown label="¿Tienes alguna tarjeta de regalo?" onPress={handleGiftCardPress} />
            </View>

            {/* Final Spacer */}
            <View style={styles.sectionSpacer} />

            {/* Empty space at bottom */}
            <View style={styles.finalLightSpacer} />
          </>
        )}

        {/* Recently viewed products section - Show only when cart IS empty */}
        {isEmpty && recentlyViewedProducts.length > 0 && (
          <View style={styles.section}>
            <Subheader
              title="Vistos recientemente"
              buttonText="Ver Todo"
              onButtonPress={handleViewMoreRecentlyViewed}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {recentlyViewedProducts.map((product) => (
                <PromotionCard
                  key={product.id}
                  product={product}
                  size="s"
                  onPress={() => handleProductPress(product.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {!isEmpty && (
        <View style={styles.checkoutContainer}>
          {/* Total row */}
          <View style={styles.checkoutTotalRow}>
            <Text style={styles.checkoutTotalLabel}>Total</Text>
            <Text style={styles.checkoutTotalValue}>
              ${(calculateTotal() - calculateDiscountTotal()).toFixed(2)}
            </Text>
          </View>
          <Button
            text="Comprar ahora"
            variant="primary"
            onPress={handleBuyNow}
            style={styles.buyButton}
          />
        </View>
      )}

      {/* Edit Overlay - Render conditionally */}
      {editingItem && (
        <OverlayProductEdit
          isVisible={isEditOverlayVisible}
          onClose={() => {
            setIsEditOverlayVisible(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEdit}
          onRemove={handleRemoveFromEdit}
          initialQuantity={editingItem.quantity}
          initialSize={editingItem.selectedSize || ''}
          product={editingItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.medium, // Adjusted background for Cart
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Adjusted padding for checkout button
    backgroundColor: colors.background.medium, // Default background for non-empty cart
  },
  scrollContentEmpty: {
    backgroundColor: colors.background.light, // White background when cart is empty
  },
  section: {
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.light,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cartItemsContainer: {
    backgroundColor: colors.background.light,
    paddingVertical: spacing.md,
  },
  sectionSpacer: {
    height: spacing.md, // Create a 16px gap between sections
    backgroundColor: colors.background.medium, // Light gray background for spacers
  },
  summarySection: {
    backgroundColor: colors.background.light,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs, // Gap between summary rows
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  summaryValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.secondary,
  },
  discountLabel: {
    color: colors.error,
  },
  discountValue: {
    color: colors.error,
  },
  totalRow: {
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: '500',
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  totalValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: '500',
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  dropdownSection: {
    backgroundColor: colors.background.light,
    paddingVertical: spacing.md,
  },
  finalLightSpacer: {
    height: 128, // Match the empty frame height from Figma
    backgroundColor: colors.background.light, // White background
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.sm, // Slightly increased gap
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    // Shadow from Figma
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  checkoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg, // Increased to 24px as in Figma
    marginBottom: spacing.xs, // Add some space before the button
  },
  checkoutTotalLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  checkoutTotalValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: '500',
    lineHeight: lineHeights.md,
    color: colors.primary,
  },
  buyButton: {
    width: '100%',
    borderRadius: radius.xxl,
  },
});
