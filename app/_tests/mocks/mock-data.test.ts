/**
 * Mock Data Validation Tests
 * Tests the structure and validity of mock data without MSW server setup
 */

// Import only the data, not the handlers to avoid React Native dependencies
import { productMockData } from './data/products';
import { userMockData } from './data/users';
import { orderMockData } from './data/orders';

describe('Mock Data Validation', () => {
  describe('Product Mock Data', () => {
    test('should have products with required structure', () => {
      expect(productMockData.length).toBeGreaterThan(0);

      const product = productMockData[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('attributes');

      const attrs = product.attributes;
      expect(attrs).toHaveProperty('name');
      expect(attrs).toHaveProperty('price');
      expect(attrs).toHaveProperty('shortDescription');
      expect(attrs.shortDescription).toHaveProperty('line1');
      expect(attrs.shortDescription).toHaveProperty('line2');
      expect(attrs).toHaveProperty('category');
      expect(attrs).toHaveProperty('team');
      expect(attrs).toHaveProperty('sport');
      expect(attrs).toHaveProperty('status');
      expect(attrs).toHaveProperty('stock');
      expect(attrs).toHaveProperty('sizes');
      expect(attrs).toHaveProperty('colors');
      expect(attrs).toHaveProperty('images');
    });

    test('should include Uruguayan football teams', () => {
      const uruguayanTeams = ['nacional', 'penarol', 'defensor', 'wanderers', 'danubio'];
      const teamProducts = productMockData.filter((product) =>
        uruguayanTeams.includes(product.attributes.team)
      );
      expect(teamProducts.length).toBeGreaterThan(0);
    });

    test('should have varied pricing with some discounts', () => {
      const prices = productMockData.map((product) => product.attributes.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      expect(minPrice).toBeGreaterThan(0);
      expect(maxPrice).toBeGreaterThan(minPrice);

      const discountedProducts = productMockData.filter(
        (product) => product.attributes.discountPrice
      );
      expect(discountedProducts.length).toBeGreaterThan(0);
    });

    test('should have realistic categories', () => {
      const validCategories = ['apparel', 'accessories', 'footwear', 'equipment'];
      productMockData.forEach((product) => {
        expect(validCategories).toContain(product.attributes.category);
      });
    });

    test('should have products with different statuses', () => {
      const statuses = [...new Set(productMockData.map((p) => p.attributes.status))];
      expect(statuses).toContain('active');

      const newProducts = productMockData.filter((p) => p.attributes.isNew);
      const featuredProducts = productMockData.filter((p) => p.attributes.featured);

      expect(newProducts.length).toBeGreaterThan(0);
      expect(featuredProducts.length).toBeGreaterThan(0);
    });

    test('should have valid image structures', () => {
      productMockData.forEach((product) => {
        expect(product.attributes.images).toHaveProperty('data');
        expect(Array.isArray(product.attributes.images.data)).toBe(true);

        if (product.attributes.images.data.length > 0) {
          const image = product.attributes.images.data[0];
          expect(image).toHaveProperty('id');
          expect(image).toHaveProperty('attributes');
          expect(image.attributes).toHaveProperty('url');
          expect(image.attributes).toHaveProperty('alternativeText');
        }
      });
    });
  });

  describe('User Mock Data', () => {
    test('should have users with Uruguayan characteristics', () => {
      expect(userMockData.length).toBeGreaterThan(0);

      const user = userMockData[0];
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('addresses');
      expect(user).toHaveProperty('preferences');
    });

    test('should have realistic Uruguayan addresses', () => {
      const user = userMockData[0];
      expect(user.addresses.length).toBeGreaterThan(0);

      const address = user.addresses[0];
      expect(address).toHaveProperty('firstName');
      expect(address).toHaveProperty('lastName');
      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('number');
      expect(address).toHaveProperty('city');
      expect(address).toHaveProperty('country', 'Uruguay');
    });

    test('should have valid Uruguayan phone numbers', () => {
      userMockData.forEach((user) => {
        expect(user.phone).toMatch(/^\+598\s/); // Should start with Uruguay country code
      });
    });

    test('should have test users for integration testing', () => {
      const testUser = userMockData.find((u) => u.email === 'test@tifossi.com');
      const adminUser = userMockData.find((u) => u.email === 'admin@tifossi.com');

      expect(testUser).toBeDefined();
      expect(adminUser).toBeDefined();
      expect(testUser?.firstName).toBe('Test');
      expect(adminUser?.firstName).toBe('Admin');
    });

    test('should have varied user preferences', () => {
      const allTeams = userMockData.flatMap((user) => user.preferences.favoriteTeams);
      const uniqueTeams = [...new Set(allTeams)];

      expect(uniqueTeams.length).toBeGreaterThan(1);
      expect(uniqueTeams).toContain('nacional');
      expect(uniqueTeams).toContain('penarol');
    });

    test('should have multiple addresses for some users', () => {
      const usersWithMultipleAddresses = userMockData.filter((user) => user.addresses.length > 1);
      expect(usersWithMultipleAddresses.length).toBeGreaterThan(0);
    });
  });

  describe('Order Mock Data', () => {
    test('should have orders with comprehensive structure', () => {
      expect(orderMockData.length).toBeGreaterThan(0);

      const order = orderMockData[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('user');
      expect(order).toHaveProperty('shippingAddress');
      expect(order).toHaveProperty('subtotal');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('paymentStatus');
      expect(order).toHaveProperty('createdAt');
      expect(order).toHaveProperty('updatedAt');
    });

    test('should have various order statuses', () => {
      const statuses = [...new Set(orderMockData.map((order) => order.status))];

      const expectedStatuses = ['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
      const hasExpectedStatuses = expectedStatuses.some((status) =>
        statuses.includes(status as any)
      );
      expect(hasExpectedStatuses).toBe(true);
      expect(statuses.length).toBeGreaterThan(3);
    });

    test('should have valid order numbers', () => {
      orderMockData.forEach((order) => {
        expect(order.orderNumber).toMatch(/^TIF-\d{8}-\d{6}$/);
      });
    });

    test('should have realistic order totals', () => {
      orderMockData.forEach((order) => {
        expect(order.subtotal).toBeGreaterThan(0);
        expect(order.total).toBeGreaterThan(0);
        expect(order.total).toBeGreaterThanOrEqual(order.subtotal - order.discount);

        // Check that items total matches subtotal
        const itemsTotal = order.items.reduce((sum, item) => {
          const itemPrice = item.discountedPrice || item.price;
          return sum + itemPrice * item.quantity;
        }, 0);

        expect(Math.abs(itemsTotal - order.subtotal)).toBeLessThan(0.01); // Allow for floating point precision
      });
    });

    test('should have valid shipping methods and costs', () => {
      const shippingMethods = [...new Set(orderMockData.map((order) => order.shippingMethod))];
      expect(shippingMethods).toContain('delivery');
      expect(shippingMethods).toContain('pickup');

      // Pickup orders should have 0 shipping cost
      const pickupOrders = orderMockData.filter((order) => order.shippingMethod === 'pickup');
      if (pickupOrders.length > 0) {
        pickupOrders.forEach((order) => {
          expect(order.shippingCost).toBe(0);
        });
      }
    });

    test('should have realistic payment methods for Uruguay', () => {
      const paymentMethods = orderMockData.map((order) => order.paymentMethod).filter(Boolean);

      const uruguayanPaymentMethods = paymentMethods.filter(
        (method) =>
          method?.includes('MercadoPago') ||
          method?.includes('Visa') ||
          method?.includes('Mastercard') ||
          method?.includes('OCA')
      );

      expect(uruguayanPaymentMethods.length).toBeGreaterThan(0);
    });

    test('should have orders with status history', () => {
      const ordersWithHistory = orderMockData.filter(
        (order) => order.statusHistory && order.statusHistory.length > 0
      );
      expect(ordersWithHistory.length).toBeGreaterThan(0);

      if (ordersWithHistory.length > 0) {
        const order = ordersWithHistory[0];
        expect(order.statusHistory![0].status).toBe('CREATED');
      }
    });

    test('should have test orders for integration testing', () => {
      const testOrder = orderMockData.find((order) => order.id === 'test_order_1');
      expect(testOrder).toBeDefined();
      expect(testOrder?.user.email).toBe('test@tifossi.com');
      expect(testOrder?.status).toBe('DELIVERED');
    });
  });

  describe('Data Relationships', () => {
    test('should have consistent user data between users and orders', () => {
      const orderUserEmails = orderMockData.map((order) => order.user.email);
      const userEmails = userMockData.map((user) => user.email);

      // At least some order users should exist in the user mock data
      const overlappingUsers = orderUserEmails.filter((email) => userEmails.includes(email));
      expect(overlappingUsers.length).toBeGreaterThan(0);
    });

    test('should have orders containing products from product mock data', () => {
      const orderProductIds = orderMockData.flatMap((order) =>
        order.items.map((item) => item.productId)
      );
      const productIds = productMockData.map((product) => product.id);

      const validProductIds = orderProductIds.filter((id) => productIds.includes(id));
      expect(validProductIds.length).toBeGreaterThan(0);
    });

    test('should have user addresses that match order shipping addresses', () => {
      // Find orders that use addresses from the user mock data
      const userAddresses = userMockData.flatMap((user) => user.addresses);
      const orderAddresses = orderMockData.map((order) => order.shippingAddress);

      const matchingCities = orderAddresses.filter((orderAddr) =>
        userAddresses.some((userAddr) => userAddr.city === orderAddr.city)
      );

      expect(matchingCities.length).toBeGreaterThan(0);
    });
  });

  describe('Data Quality', () => {
    test('should not have empty strings in required fields', () => {
      productMockData.forEach((product) => {
        expect(product.attributes.name.trim()).not.toBe('');
        expect(product.attributes.shortDescription.line1.trim()).not.toBe('');
      });

      userMockData.forEach((user) => {
        expect(user.firstName.trim()).not.toBe('');
        expect(user.lastName.trim()).not.toBe('');
        expect(user.email.trim()).not.toBe('');
      });

      orderMockData.forEach((order) => {
        expect(order.orderNumber.trim()).not.toBe('');
        expect(order.user.email.trim()).not.toBe('');
      });
    });

    test('should have valid email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      userMockData.forEach((user) => {
        expect(user.email).toMatch(emailRegex);
      });

      orderMockData.forEach((order) => {
        expect(order.user.email).toMatch(emailRegex);
      });
    });

    test('should have valid date formats', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

      productMockData.forEach((product) => {
        expect(product.attributes.createdAt).toMatch(dateRegex);
        expect(product.attributes.updatedAt).toMatch(dateRegex);
      });

      userMockData.forEach((user) => {
        expect(user.createdAt).toMatch(dateRegex);
        expect(user.updatedAt).toMatch(dateRegex);
      });

      orderMockData.forEach((order) => {
        expect(order.createdAt).toMatch(dateRegex);
        expect(order.updatedAt).toMatch(dateRegex);
      });
    });
  });
});

export default {
  name: 'MockDataTest',
  version: '1.0.0',
};
