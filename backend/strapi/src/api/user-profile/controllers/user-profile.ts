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
};
