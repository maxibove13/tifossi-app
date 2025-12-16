/**
 * Order Tracker Component
 * Displays order tracking information and status
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import services and types
import orderService, { Order, OrderStatus } from '../../_services/order/orderService';
import { useAuthStore } from '../../_stores/authStore';

// Import style tokens
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { fonts, fontSizes, fontWeights } from '../../_styles/typography';

interface OrderTrackerProps {
  orderId: string;
  onClose?: () => void;
}

interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  location?: string;
}

export default function OrderTracker({ orderId, onClose }: OrderTrackerProps) {
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderTracking = async () => {
      if (!token || !orderId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        orderService.setAuthToken(token);

        const trackingData = await orderService.trackOrder(orderId);

        if (trackingData) {
          setOrder(trackingData.order);
          setTrackingEvents(trackingData.trackingEvents);
        } else {
          throw new Error('No tracking data found');
        }
      } catch {
        setError('Failed to load order tracking information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderTracking();
  }, [orderId, token]);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'CREATED':
        return 'document-text-outline';
      case 'PAYMENT_PENDING':
        return 'time-outline';
      case 'PAID':
        return 'checkmark-circle-outline';
      case 'PROCESSING':
        return 'build-outline';
      case 'SHIPPED':
        return 'car-outline';
      case 'DELIVERED':
        return 'home-outline';
      case 'CANCELLED':
        return 'close-circle-outline';
      case 'REFUNDED':
        return 'arrow-back-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'CREATED':
      case 'PAYMENT_PENDING':
        return colors.secondary;
      case 'PAID':
      case 'PROCESSING':
      case 'SHIPPED':
        return colors.primary;
      case 'DELIVERED':
        return colors.success;
      case 'CANCELLED':
      case 'REFUNDED':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTrackingEvent = (event: TrackingEvent, index: number) => {
    const isCurrentStatus = order?.status === event.status;
    const isCompleted = order
      ? getStatusOrder(order.status) >= getStatusOrder(event.status)
      : false;

    return (
      <View key={index} style={styles.trackingEventContainer}>
        <View style={styles.timelineContainer}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: isCompleted ? getStatusColor(event.status) : colors.secondary },
            ]}
          >
            <Ionicons
              name={getStatusIcon(event.status) as any}
              size={16}
              color={colors.background.light}
            />
          </View>
          {index < trackingEvents.length - 1 && (
            <View
              style={[
                styles.timelineLine,
                { backgroundColor: isCompleted ? getStatusColor(event.status) : colors.secondary },
              ]}
            />
          )}
        </View>

        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, isCurrentStatus && styles.currentEventTitle]}>
            {orderService.getOrderStatusText(event.status)}
          </Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
          <Text style={styles.eventTimestamp}>{formatDate(event.timestamp)}</Text>
          {event.location && <Text style={styles.eventLocation}>{event.location}</Text>}
        </View>
      </View>
    );
  };

  const getStatusOrder = (status: OrderStatus): number => {
    const statusOrder: Record<OrderStatus, number> = {
      CREATED: 1,
      PAYMENT_PENDING: 2,
      PAID: 3,
      PROCESSING: 4,
      SHIPPED: 5,
      DELIVERED: 6,
      CANCELLED: 0,
      REFUNDED: 0,
    };
    return statusOrder[status] || 0;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order tracking...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Could not load order tracking information'}</Text>
        {onClose && (
          <TouchableOpacity style={styles.retryButton} onPress={onClose}>
            <Text style={styles.retryButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderContent}>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          <Text style={styles.orderStatus}>{orderService.getOrderStatusText(order.status)}</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>{order.items.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryValue}>${order.total.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Status:</Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                  ? colors.success
                  : colors.secondary,
              },
            ]}
          >
            {orderService.getPaymentStatusFromOrder(order.status)}
          </Text>
        </View>
        {order.estimatedDelivery && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Delivery:</Text>
            <Text style={styles.summaryValue}>{formatDate(order.estimatedDelivery)}</Text>
          </View>
        )}
        {order.trackingNumber && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tracking Number:</Text>
            <Text style={styles.summaryValue}>{order.trackingNumber}</Text>
          </View>
        )}
      </View>

      {/* Tracking Timeline */}
      <View style={styles.trackingSection}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.timeline}>{trackingEvents.map(renderTrackingEvent)}</View>
      </View>

      {/* Order Actions */}
      <View style={styles.actionsSection}>
        {orderService.canCancelOrder(order) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              // Handle cancel order
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
        {orderService.canRefundOrder(order) && (
          <TouchableOpacity
            style={styles.refundButton}
            onPress={() => {
              // Handle refund request
            }}
          >
            <Text style={styles.refundButtonText}>Request Refund</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

type Styles = {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  orderHeader: ViewStyle;
  orderHeaderContent: ViewStyle;
  orderNumber: TextStyle;
  orderStatus: TextStyle;
  closeButton: ViewStyle;
  orderSummary: ViewStyle;
  sectionTitle: TextStyle;
  summaryRow: ViewStyle;
  summaryLabel: TextStyle;
  summaryValue: TextStyle;
  trackingSection: ViewStyle;
  timeline: ViewStyle;
  trackingEventContainer: ViewStyle;
  timelineContainer: ViewStyle;
  statusIcon: ViewStyle;
  timelineLine: ViewStyle;
  eventContent: ViewStyle;
  eventTitle: TextStyle;
  currentEventTitle: TextStyle;
  eventDescription: TextStyle;
  eventTimestamp: TextStyle;
  eventLocation: TextStyle;
  actionsSection: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  refundButton: ViewStyle;
  refundButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
  loadingText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.error,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  retryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.background.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.medium,
  },
  orderHeaderContent: {
    flex: 1,
  },
  orderNumber: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  orderStatus: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginTop: spacing.xs / 2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  orderSummary: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.medium,
  },
  sectionTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  summaryValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  trackingSection: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  timeline: {
    paddingLeft: spacing.sm,
  },
  trackingEventContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: spacing.xs,
  },
  eventContent: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  eventTitle: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  currentEventTitle: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  eventDescription: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  eventTimestamp: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    color: colors.secondary,
  },
  eventLocation: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs / 2,
  },
  actionsSection: {
    backgroundColor: colors.background.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.error,
  },
  refundButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  refundButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.secondary,
  },
});
