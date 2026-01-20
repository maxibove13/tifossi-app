import type { Core } from '@strapi/strapi';

declare const strapi: Core.Strapi;

export interface OrderForEmail {
  orderNumber: string;
  guestEmail?: string;
  user?: { email: string };
  items: Array<{
    productSnapshot: { name: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: 'delivery' | 'pickup';
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
  };
  storeLocation?: { name: string; address: string };
}

export async function sendOrderConfirmationEmail(order: OrderForEmail): Promise<void> {
  // Skip if email plugin not configured (no SMTP_HOST)
  if (!strapi.plugins?.['email']?.services?.email) {
    strapi.log.debug(
      `Email plugin not configured, skipping confirmation for order ${order.orderNumber}`
    );
    return;
  }

  const recipientEmail = order.guestEmail || order.user?.email;
  if (!recipientEmail) {
    strapi.log.warn(`No email for order ${order.orderNumber}, skipping confirmation`);
    return;
  }

  try {
    await strapi.plugins['email'].services.email.send({
      to: recipientEmail,
      subject: `Tu pedido #${order.orderNumber} ha sido confirmado - Tifossi`,
      html: buildEmailHtml(order, recipientEmail),
    });
    strapi.log.info(`Confirmation email sent for order ${order.orderNumber}`);
  } catch (error) {
    strapi.log.error(`Failed to send email for order ${order.orderNumber}:`, error);
    // Don't throw - email failure shouldn't break webhook
  }
}

export function buildEmailHtml(order: OrderForEmail, email: string): string {
  const itemsHtml = order.items
    .map((item) => {
      const variant = [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ');
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.productSnapshot.name}${variant ? ` (${variant})` : ''}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${item.totalPrice.toLocaleString()}</td>
      </tr>`;
    })
    .join('');

  const deliveryInfo =
    order.shippingMethod === 'pickup' && order.storeLocation
      ? `<p><strong>Retiro en:</strong> ${order.storeLocation.name}<br>${order.storeLocation.address}</p>`
      : order.shippingAddress
        ? `<p><strong>Envio a:</strong><br>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>${order.shippingAddress.addressLine1}<br>${order.shippingAddress.city}</p>`
        : '';

  const statusUrl = `${process.env.FRONTEND_URL}/order-status/${order.orderNumber}?email=${encodeURIComponent(email)}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h1 style="color:#333">Pedido Confirmado</h1>
  <p>Tu pedido <strong>#${order.orderNumber}</strong> ha sido confirmado.</p>

  <h2 style="color:#333;font-size:16px;margin-top:24px">Productos</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:#f5f5f5">
      <th style="padding:8px;text-align:left">Producto</th>
      <th style="padding:8px;text-align:center">Cant.</th>
      <th style="padding:8px;text-align:right">Precio</th>
    </tr>
    ${itemsHtml}
  </table>

  <table style="width:100%;margin-top:16px">
    <tr><td>Subtotal:</td><td style="text-align:right">$${order.subtotal.toLocaleString()}</td></tr>
    <tr><td>Envio:</td><td style="text-align:right">$${order.shippingCost.toLocaleString()}</td></tr>
    <tr style="font-weight:bold"><td>Total:</td><td style="text-align:right">$${order.total.toLocaleString()}</td></tr>
  </table>

  ${deliveryInfo}

  <p style="margin-top:24px">
    <a href="${statusUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px">Ver estado del pedido</a>
  </p>

  <p style="color:#666;font-size:12px;margin-top:32px">
    Preguntas? Contactanos a support@tifossi.com
  </p>
</body>
</html>`;
}
