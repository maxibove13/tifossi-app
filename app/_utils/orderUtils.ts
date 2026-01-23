import { colors } from '../_styles/colors';
import { OrderStatus } from '../_services/order/orderService';

export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'CREATED':
    case 'PAYMENT_PENDING':
      return colors.secondary;
    case 'PAID':
      return colors.success;
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

export const formatDate = (dateString: string, includeTime = false): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };
  return date.toLocaleDateString('es-ES', options);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
