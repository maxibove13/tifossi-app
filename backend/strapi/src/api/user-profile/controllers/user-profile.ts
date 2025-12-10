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

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'addressLine1', 'city', 'state', 'country'];
    for (const field of requiredFields) {
      if (!body[field]?.trim()) {
        ctx.badRequest(`${field} is required`);
        return;
      }
    }

    // Validate field lengths
    if (body.firstName?.length > 50) {
      ctx.badRequest('firstName must be 50 characters or less');
      return;
    }
    if (body.lastName?.length > 50) {
      ctx.badRequest('lastName must be 50 characters or less');
      return;
    }
    if (body.addressLine1?.length > 100) {
      ctx.badRequest('addressLine1 must be 100 characters or less');
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

      const addresses = currentUser?.addresses || [];

      // Build address object with only allowed fields
      const newAddress = {
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company || null,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || null,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode || null,
        country: body.country,
        phoneNumber: body.phoneNumber || null,
        isDefault: body.isDefault || false,
        type: body.type || 'shipping',
      };

      // If new address is default, unset others
      if (newAddress.isDefault) {
        for (const addr of addresses) {
          addr.isDefault = false;
        }
      }

      addresses.push(newAddress);

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses },
      });

      ctx.body = { ...newAddress, id: addresses.length - 1 };
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

    try {
      const currentUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['addresses'],
      });

      const addresses = currentUser?.addresses || [];

      if (index >= addresses.length) {
        ctx.notFound('Address not found');
        return;
      }

      // Update only allowed fields
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
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          addresses[index][field] = body[field];
        }
      }

      // If this address is being set as default, unset others
      if (body.isDefault === true) {
        for (let i = 0; i < addresses.length; i++) {
          if (i !== index) {
            addresses[i].isDefault = false;
          }
        }
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses },
      });

      ctx.body = { ...addresses[index], id: index };
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

      const addresses = currentUser?.addresses || [];

      if (index >= addresses.length) {
        ctx.notFound('Address not found');
        return;
      }

      addresses.splice(index, 1);

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses },
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

      const addresses = currentUser?.addresses || [];

      if (index >= addresses.length) {
        ctx.notFound('Address not found');
        return;
      }

      // Unset all defaults, then set the target
      for (let i = 0; i < addresses.length; i++) {
        addresses[i].isDefault = i === index;
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { addresses },
      });

      ctx.body = addresses.map((addr: any, i: number) => ({ ...addr, id: i }));
    } catch (error: any) {
      strapi.log.error('[user-profile] Set default address failed:', error);
      ctx.internalServerError('Failed to set default address');
    }
  },
};
