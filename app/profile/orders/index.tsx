import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../_styles/colors';
import { spacing, radius, components } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../_styles/typography';
import { useAuthStore } from '../../_stores/authStore';
import orderService, { Order } from '../../_services/order/orderService';
import EmptyOrders from '../../_components/store/orders/EmptyOrders';
import ReusableAuthPrompt from '../../_components/auth/AuthPrompt';
import { getStatusColor, formatDate, formatCurrency } from '../../_utils/orderUtils';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

function OrderCard({ order, onPress }: OrderCardProps) {
  const statusText = orderService.getOrderStatusText(order.status);
  const statusColor = getStatusColor(order.status);
  const itemCount = order.items?.length || 0;

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha</Text>
          <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.detailValue}>
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.detailValueBold}>{formatCurrency(order.total)}</Text>
        </View>
      </View>

      <View style={styles.chevronContainer}>
        <Feather name="chevron-right" size={20} color={colors.secondary} />
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersListScreen() {
  const { isLoggedIn, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      const currentRequestId = ++requestIdRef.current;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        orderService.setAuthToken(token);
        const response = await orderService.getUserOrders(1, 50);

        // Ignore stale response
        if (currentRequestId !== requestIdRef.current) return;

        if (response.success && response.orders) {
          const sortedOrders = [...response.orders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sortedOrders);
        } else {
          setError(response.error || 'Error al cargar los pedidos');
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setError('Error al cargar los pedidos. Intenta nuevamente.');
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && token) {
        fetchOrders(false);
      } else if (isLoggedIn && !token) {
        setIsLoading(false);
      }
    }, [isLoggedIn, token, fetchOrders])
  );

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/profile/orders/${orderId}`);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Pedidos</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Feather name="x" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>
        <ReusableAuthPrompt message="Inicia sesión para ver tus pedidos." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <Feather name="x" size={24} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <EmptyOrders onGoToStore={handleGoToStore} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => handleOrderPress(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  closeButton: {
    width: components.closeButton.width,
    height: components.closeButton.height,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xxl,
  },
  retryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.background.light,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.background.light,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderNumber: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  orderDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  detailValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  detailValueBold: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  chevronContainer: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
  },
});
