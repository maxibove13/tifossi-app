/**
 * Address Management Service
 * Handles user addresses with Strapi backend CRUD operations
 *
 * Address schema matches Strapi repeatable component:
 * - id: number (array index, assigned by backend)
 * - firstName, lastName: string
 * - addressLine1: street + number combined
 * - addressLine2: additional info
 * - city, state, country (2-char code)
 * - phoneNumber, postalCode: optional
 * - isDefault: boolean
 * - type: 'shipping' | 'billing' | 'both'
 */

import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';

export interface Address {
  id?: number; // Array index, set by backend
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string; // street + number combined
  addressLine2?: string; // additional info
  city: string;
  state: string; // department
  postalCode?: string;
  country: string; // 2-char code (UY, AR, etc)
  phoneNumber?: string;
  isDefault: boolean;
  type: 'shipping' | 'billing' | 'both';
}

export type CreateAddressData = Omit<Address, 'id'>;

class AddressService {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getHeaders() {
    if (!this.authToken) {
      throw new Error('Authentication token required');
    }
    return { Authorization: `Bearer ${this.authToken}` };
  }

  async fetchUserAddresses(): Promise<Address[]> {
    try {
      const response = await httpClient.get('/user-profile/me/addresses', {
        headers: this.getHeaders(),
      });
      // Handle various response formats
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.addresses && Array.isArray(data.addresses)) return data.addresses;
      return [];
    } catch (error) {
      const apiError = handleApiError(error, 'fetchUserAddresses');
      throw new Error(apiError.message);
    }
  }

  async createAddress(addressData: CreateAddressData): Promise<Address> {
    // Validate before sending to API
    const validation = this.validateAddress(addressData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    try {
      const response = await httpClient.post('/user-profile/me/addresses', addressData, {
        headers: this.getHeaders(),
      });
      return response.data?.address || response.data || response;
    } catch (error) {
      const apiError = handleApiError(error, 'createAddress');
      throw new Error(apiError.message);
    }
  }

  async updateAddress(index: number, addressData: Partial<Address>): Promise<Address> {
    try {
      const response = await httpClient.put(`/user-profile/me/addresses/${index}`, addressData, {
        headers: this.getHeaders(),
      });
      return response.data?.address || response.data || response;
    } catch (error) {
      const apiError = handleApiError(error, 'updateAddress');
      throw new Error(apiError.message);
    }
  }

  async deleteAddress(index: number): Promise<void> {
    try {
      await httpClient.delete(`/user-profile/me/addresses/${index}`, {
        headers: this.getHeaders(),
      });
    } catch (error) {
      const apiError = handleApiError(error, 'deleteAddress');
      throw new Error(apiError.message);
    }
  }

  async setDefaultAddress(index: number): Promise<Address[]> {
    try {
      const response = await httpClient.put(
        `/user-profile/me/addresses/${index}/default`,
        {},
        { headers: this.getHeaders() }
      );
      return response.data || response || [];
    } catch (error) {
      const apiError = handleApiError(error, 'setDefaultAddress');
      throw new Error(apiError.message);
    }
  }

  async getDefaultAddress(): Promise<Address | null> {
    try {
      const addresses = await this.fetchUserAddresses();
      return addresses.find((address) => address.isDefault) || null;
    } catch {
      return null;
    }
  }

  /**
   * Format address for single-line display
   */
  formatAddressDisplay(address: Address): string {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.country,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Format address for shipping label (multi-line)
   */
  formatAddressShipping(address: Address): string {
    return [
      `${address.firstName} ${address.lastName}`,
      address.company,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode || ''}`.trim(),
      address.country,
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Validate address data before submission
   */
  validateAddress(address: Partial<Address>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!address.firstName?.trim()) errors.push('First name is required');
    if (!address.lastName?.trim()) errors.push('Last name is required');
    if (!address.addressLine1?.trim()) errors.push('Address line 1 is required');
    if (!address.city?.trim()) errors.push('City is required');
    if (!address.state?.trim()) errors.push('State is required');
    if (!address.country?.trim()) errors.push('Country is required');

    // Length validations
    if (address.firstName && address.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    }
    if (address.lastName && address.lastName.length > 50) {
      errors.push('Last name must be 50 characters or less');
    }
    if (address.addressLine1 && address.addressLine1.length > 100) {
      errors.push('Address line 1 must be 100 characters or less');
    }
    if (address.addressLine2 && address.addressLine2.length > 100) {
      errors.push('Address line 2 must be 100 characters or less');
    }
    if (address.city && address.city.length > 50) {
      errors.push('City must be 50 characters or less');
    }
    if (address.state && address.state.length > 50) {
      errors.push('State must be 50 characters or less');
    }
    if (address.postalCode && address.postalCode.length > 20) {
      errors.push('Postal code must be 20 characters or less');
    }

    // Phone validation (if provided)
    if (address.phoneNumber) {
      const phoneRegex = /^[+\d\s()-]+$/;
      if (!phoneRegex.test(address.phoneNumber)) {
        errors.push('Phone number contains invalid characters');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Search addresses by query string
   */
  searchAddresses(addresses: Address[], query: string): Address[] {
    if (!query.trim()) return addresses;

    const lowerQuery = query.toLowerCase();
    return addresses.filter((address) => {
      const searchableFields = [
        address.firstName,
        address.lastName,
        address.company,
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.country,
      ].filter(Boolean);

      return searchableFields.some((field) => field?.toLowerCase().includes(lowerQuery));
    });
  }
}

export const addressService = new AddressService();
export default addressService;
