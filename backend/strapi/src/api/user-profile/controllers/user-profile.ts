/**
 * User Profile Controller
 * Handles authenticated user profile operations including cart and favorites
 */

import { Context } from 'koa';

interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
  price?: number;
  discountedPrice?: number;
}

interface UpdateMeBody {
  cart?: CartItem[];
  favorites?: {
    // Plain array of IDs (numeric or documentId strings)
    set?: Array<string | number>;
  };
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  newsletterSubscribed?: boolean;
  marketingEmails?: boolean;
  preferredLanguage?: string;
  currency?: string;
}

interface CleanAddress {
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  phoneNumber: string | null;
  isDefault: boolean;
  type: 'shipping' | 'billing' | 'both';
}

/**
 * Strips internal Strapi metadata from address objects to ensure proper component updates.
 * Strapi 5's db.query().update() requires clean objects without internal fields like id, __component, etc.
 */
function cleanAddress(addr: any, overrides: Partial<CleanAddress> = {}): CleanAddress {
  return {
    firstName: addr.firstName,
    lastName: addr.lastName,
    company: addr.company || null,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2 || null,
    city: addr.city,
    state: addr.state || null,
    postalCode: addr.postalCode || null,
    country: addr.country,
    phoneNumber: addr.phoneNumber || null,
    isDefault: addr.isDefault ?? false,
    type: addr.type || 'both',
    ...overrides,
  };
}

export default {
  /**
   * Update authenticated user's own data
   * PUT /api/user-profile/me
   */
  async updateMe(ctx: Context): Promise<void> {
    const user = ctx.state.user;

    if (!user) {
      ctx.unauthorized('You must be logged in to update your profile');
      return;
    }

    const body = ctx.request.body as UpdateMeBody;
    const updateData: Record<string, any> = {};

    // Handle cart (JSON field)
    if (body.cart !== undefined) {
      // Validate cart items
      if (!Array.isArray(body.cart)) {
        ctx.badRequest('Cart must be an array');
        return;
      }

      // Basic validation of cart items
      for (const item of body.cart) {
        if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
          ctx.badRequest('Invalid cart item: productId and valid quantity required');
          return;
        }
        if (item.quantity > 99) {
          ctx.badRequest('Cart item quantity cannot exceed 99');
          return;
        }
      }

      updateData.cart = body.cart;
    }

    // Handle favorites (relation field)
    // All IDs are validated via batch DB lookup to ensure products exist
    if (body.favorites !== undefined) {
      if (body.favorites.set && Array.isArray(body.favorites.set)) {
        // Clear favorites
        if (body.favorites.set.length === 0) {
          updateData.favorites = { set: [] };
        } else {
          // Separate numeric IDs from documentIds
          const numericIds: number[] = [];
          const documentIds: string[] = [];

          for (const id of body.favorites.set) {
            if (typeof id === 'number' && !isNaN(id)) {
              numericIds.push(id);
            } else if (typeof id === 'string') {
              if (/^\d+$/.test(id)) {
                numericIds.push(parseInt(id, 10));
              } else {
                documentIds.push(id);
              }
            }
          }

          // Batch lookup: 2 queries max instead of N
          const [numericResults, docIdResults] = await Promise.all([
            numericIds.length > 0
              ? strapi.db.query('api::product.product').findMany({
                  where: { id: { $in: numericIds } },
                  select: ['id'],
                })
              : [],
            documentIds.length > 0
              ? strapi.db.query('api::product.product').findMany({
                  where: { documentId: { $in: documentIds } },
                  select: ['id', 'documentId'],
                })
              : [],
          ]);

          const resolvedIds = [
            ...numericResults.map((p: { id: number }) => p.id),
            ...docIdResults.map((p: { id: number }) => p.id),
          ];

          // Find unresolved IDs for logging
          const foundNumericIds = new Set(numericResults.map((p: { id: number }) => p.id));
          const foundDocIds = new Set(
            docIdResults.map((p: { documentId: string }) => p.documentId)
          );
          const unresolvedIds = [
            ...numericIds.filter((id) => !foundNumericIds.has(id)).map(String),
            ...documentIds.filter((id) => !foundDocIds.has(id)),
          ];

          if (unresolvedIds.length > 0) {
            strapi.log.warn(`[user-profile] Products not found: ${unresolvedIds.join(', ')}`);
          }

          if (resolvedIds.length === 0) {
            ctx.badRequest('None of the provided product IDs could be resolved');
            return;
          }

          // strapi.db.query expects plain ID array for relations
          updateData.favorites = { set: resolvedIds };
        }
      }
    }

    // Handle other profile fields
    const allowedFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'dateOfBirth',
      'gender',
      'newsletterSubscribed',
      'marketingEmails',
      'preferredLanguage',
      'currency',
    ];

    for (const field of allowedFields) {
      if (body[field as keyof UpdateMeBody] !== undefined) {
        updateData[field] = body[field as keyof UpdateMeBody];
      }
    }

    if (Object.keys(updateData).length === 0) {
      ctx.badRequest('No valid fields to update');
      return;
    }

    try {
      const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: updateData,
        populate: ['favorites'],
      });

      // Sanitize the response
      ctx.body = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        cart: updatedUser.cart,
        favorites: updatedUser.favorites,
      };
    } catch (error: any) {
      strapi.log.error('[user-profile] Update failed:', error);
      ctx.internalServerError('Failed to update profile');
    }
  },

  /**
   * Get all user addresses
   * GET /api/user-profile/me/addresses
   */
  async getAddresses(ctx: Context): Promise<void> {
    const user = ctx.state.user;

    if (!user) {
      ctx.unauthorized('You must be logged in to view addresses');
      return;
    }

    try {
      const currentUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['addresses'],
      });

      const addresses = currentUser?.addresses || [];
      // Add index as id for frontend reference
      ctx.body = addresses.map((addr: any, index: number) => ({ ...addr, id: index }));
    } catch (error: any) {
      strapi.log.error('[user-profile] Get addresses failed:', error);
      ctx.internalServerError('Failed to fetch addresses');
    }
  },

  /**
   * Create a new address
   * POST /api/user-profile/me/addresses
   */
  async createAddress(ctx: Context): Promise<void> {
    const user = ctx.state.user;

    if (!user) {
      ctx.unauthorized('You must be logged in to add an address');
      return;
    }

    const body = ctx.request.body as Record<string, any>;

    // Validate required fields (state is optional per schema)
    const requiredFields = ['firstName', 'lastName', 'addressLine1', 'city', 'country'];
    for (const field of requiredFields) {
      if (!body[field]?.trim()) {
        ctx.badRequest(`${field} is required`);
        return;
      }
    }

    // Validate field lengths (matching schema maxLength values)
    if (body.firstName?.length > 50) {
      ctx.badRequest('firstName must be 50 characters or less');
      return;
    }
    if (body.lastName?.length > 50) {
      ctx.badRequest('lastName must be 50 characters or less');
      return;
    }
    if (body.addressLine1?.length > 255) {
      ctx.badRequest('addressLine1 must be 255 characters or less');
      return;
    }
    if (body.city?.length > 100) {
      ctx.badRequest('city must be 100 characters or less');
      return;
    }
    if (body.state?.length > 100) {
      ctx.badRequest('state must be 100 characters or less');
      return;
    }
    if (body.country?.length > 2) {
      ctx.badRequest('country must be 2 characters (country code)');
      return;
    }

    try {
      const currentUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['addresses'],
      });

      const existingAddresses = currentUser?.addresses || [];
      const isNewDefault = body.isDefault || false;

      // Build new address and clean existing addresses
      const newAddress = cleanAddress(body, { isDefault: isNewDefault });
      const cleanAddresses = existingAddresses.map((addr: any) =>
        cleanAddress(addr, { isDefault: isNewDefault ? false : addr.isDefault })
      );
      cleanAddresses.push(newAddress);

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses: cleanAddresses },
      });

      ctx.body = { ...newAddress, id: cleanAddresses.length - 1 };
    } catch (error: any) {
      strapi.log.error('[user-profile] Create address failed:', error);
      ctx.internalServerError('Failed to create address');
    }
  },

  /**
   * Update an address by index
   * PUT /api/user-profile/me/addresses/:index
   */
  async updateAddress(ctx: Context): Promise<void> {
    const user = ctx.state.user;

    if (!user) {
      ctx.unauthorized('You must be logged in to update an address');
      return;
    }

    const index = parseInt(ctx.params.index, 10);
    if (isNaN(index) || index < 0) {
      ctx.badRequest('Invalid address index');
      return;
    }

    const body = ctx.request.body as Record<string, any>;

    // Validate required fields cannot be set to empty string
    const requiredIfProvided = ['firstName', 'lastName', 'addressLine1', 'city', 'country'];
    for (const field of requiredIfProvided) {
      if (body[field] !== undefined && !body[field]?.trim()) {
        ctx.badRequest(`${field} cannot be empty`);
        return;
      }
    }

    // Validate field lengths if provided (matching schema maxLength values)
    if (body.firstName !== undefined && body.firstName?.length > 50) {
      ctx.badRequest('firstName must be 50 characters or less');
      return;
    }
    if (body.lastName !== undefined && body.lastName?.length > 50) {
      ctx.badRequest('lastName must be 50 characters or less');
      return;
    }
    if (body.addressLine1 !== undefined && body.addressLine1?.length > 255) {
      ctx.badRequest('addressLine1 must be 255 characters or less');
      return;
    }
    if (body.city !== undefined && body.city?.length > 100) {
      ctx.badRequest('city must be 100 characters or less');
      return;
    }
    if (body.state !== undefined && body.state?.length > 100) {
      ctx.badRequest('state must be 100 characters or less');
      return;
    }
    if (body.country !== undefined && body.country?.length > 2) {
      ctx.badRequest('country must be 2 characters (country code)');
      return;
    }

    try {
      const currentUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['addresses'],
      });

      const existingAddresses = currentUser?.addresses || [];

      if (index >= existingAddresses.length) {
        ctx.notFound('Address not found');
        return;
      }

      const allowedFields = [
        'firstName',
        'lastName',
        'company',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'postalCode',
        'country',
        'phoneNumber',
        'isDefault',
        'type',
      ] as const;

      // Clean existing addresses and apply updates to target
      const cleanAddresses = existingAddresses.map((addr: any, i: number) => {
        if (i === index) {
          // Build overrides from body for the target address
          const overrides: Partial<CleanAddress> = {};
          for (const field of allowedFields) {
            if (body[field] !== undefined) {
              (overrides as any)[field] = body[field];
            }
          }
          return cleanAddress(addr, overrides);
        }
        // If target is being set as default, unset others
        return cleanAddress(addr, { isDefault: body.isDefault === true ? false : addr.isDefault });
      });

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses: cleanAddresses },
      });

      ctx.body = { ...cleanAddresses[index], id: index };
    } catch (error: any) {
      strapi.log.error('[user-profile] Update address failed:', error);
      ctx.internalServerError('Failed to update address');
    }
  },

  /**
   * Delete an address by index
   * DELETE /api/user-profile/me/addresses/:index
   */
  async deleteAddress(ctx: Context): Promise<void> {
    const user = ctx.state.user;

    if (!user) {
      ctx.unauthorized('You must be logged in to delete an address');
      return;
    }

    const index = parseInt(ctx.params.index, 10);
    if (isNaN(index) || index < 0) {
      ctx.badRequest('Invalid address index');
      return;
    }

    try {
      const currentUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['addresses'],
      });

      const existingAddresses = currentUser?.addresses || [];

      if (index >= existingAddresses.length) {
        ctx.notFound('Address not found');
        return;
      }

      const deletedWasDefault = existingAddresses[index]?.isDefault === true;

      // Clean addresses and remove the target one
      const cleanAddresses = existingAddresses
        .filter((_: any, i: number) => i !== index)
        .map((addr: any) => cleanAddress(addr));

      // If we deleted the default and there are remaining addresses, promote the first one
      if (deletedWasDefault && cleanAddresses.length > 0) {
        cleanAddresses[0].isDefault = true;
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses: cleanAddresses },
      });

      ctx.body = { success: true };
    } catch (error: any) {
      strapi.log.error('[user-profile] Delete address failed:', error);
      ctx.internalServerError('Failed to delete address');
    }
  },

  /**
   * Set an address as default
   * PUT /api/user-profile/me/addresses/:index/default
   */
  async setDefaultAddress(ctx: Context): Promise<void> {
    const user = ctx.state.user;

    if (!user) {
      ctx.unauthorized('You must be logged in to set default address');
      return;
    }

    const index = parseInt(ctx.params.index, 10);
    if (isNaN(index) || index < 0) {
      ctx.badRequest('Invalid address index');
      return;
    }

    try {
      const currentUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['addresses'],
      });

      const existingAddresses = currentUser?.addresses || [];

      if (index >= existingAddresses.length) {
        ctx.notFound('Address not found');
        return;
      }

      // Clean addresses and set default
      const cleanAddresses = existingAddresses.map((addr: any, i: number) =>
        cleanAddress(addr, { isDefault: i === index })
      );

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses: cleanAddresses },
      });

      ctx.body = cleanAddresses.map((addr: any, i: number) => ({ ...addr, id: i }));
    } catch (error: any) {
      strapi.log.error('[user-profile] Set default address failed:', error);
      ctx.internalServerError('Failed to set default address');
    }
  },
};
