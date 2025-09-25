/**
 * Address Management Service
 * Handles user addresses with Strapi backend CRUD operations
 */

import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import { endpoints } from '../../_config/endpoints';

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  phone?: string;
  isDefault?: boolean;
  addressType?: 'home' | 'work' | 'other';
  notes?: string;
}

export interface AddressResponse {
  success: boolean;
  address?: Address;
  addresses?: Address[];
  error?: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
}

class AddressService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = endpoints.baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Fetch all user addresses
   */
  async fetchUserAddresses(): Promise<Address[]> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const response = await httpClient.get('/users/me/addresses', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      // Handle different response formats
      const addresses = response.addresses || response.data?.addresses || response.data || [];

      return addresses;
    } catch (error) {
      const apiError = handleApiError(error, 'fetchUserAddresses');
      throw new Error(apiError.message);
    }
  }

  /**
   * Create a new address
   */
  async createAddress(addressData: Omit<Address, 'id'>): Promise<AddressResponse> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      // Validate address data
      const validation = this.validateAddress(addressData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      const response = await httpClient.post('/users/me/addresses', addressData, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      const address = response.address || response.data?.address || response.data;

      return {
        success: true,
        address,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'createAddress');

      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<AddressResponse> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      // Validate address data if it's a complete update
      if (this.isCompleteAddress(addressData)) {
        const validation = this.validateAddress(addressData as Address);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.errors.join(', '),
          };
        }
      }

      const response = await httpClient.put(`/users/me/addresses/${addressId}`, addressData, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      const address = response.address || response.data?.address || response.data;

      return {
        success: true,
        address,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'updateAddress');

      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<AddressResponse> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      await httpClient.delete(`/users/me/addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      return { success: true };
    } catch (error) {
      const apiError = handleApiError(error, 'deleteAddress');

      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string): Promise<AddressResponse> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const response = await httpClient.put(
        `/users/me/addresses/${addressId}/set-default`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        }
      );

      const addresses = response.addresses || response.data?.addresses || [];

      return {
        success: true,
        addresses,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'setDefaultAddress');
      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Get user's default address
   */
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const addresses = await this.fetchUserAddresses();
      return addresses.find((address) => address.isDefault) || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate address data
   */
  validateAddress(address: Partial<Address>): AddressValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!address.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!address.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!address.street?.trim()) {
      errors.push('Street address is required');
    }

    if (!address.number?.trim()) {
      errors.push('Street number is required');
    }

    if (!address.city?.trim()) {
      errors.push('City is required');
    }

    if (!address.country?.trim()) {
      errors.push('Country is required');
    }

    // Length validations
    if (address.firstName && address.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    }

    if (address.lastName && address.lastName.length > 50) {
      errors.push('Last name must be 50 characters or less');
    }

    if (address.street && address.street.length > 100) {
      errors.push('Street address must be 100 characters or less');
    }

    if (address.number && address.number.length > 10) {
      errors.push('Street number must be 10 characters or less');
    }

    if (address.apartment && address.apartment.length > 20) {
      errors.push('Apartment/Unit must be 20 characters or less');
    }

    if (address.city && address.city.length > 50) {
      errors.push('City must be 50 characters or less');
    }

    if (address.zipCode && address.zipCode.length > 20) {
      errors.push('ZIP/Postal code must be 20 characters or less');
    }

    // Phone validation (basic)
    if (address.phone && address.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }

    // Phone format validation (optional - adjust based on your requirements)
    if (address.phone && !/^[\d\s\-\+\(\)]+$/.test(address.phone)) {
      errors.push('Phone number contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format address for display
   */
  formatAddressDisplay(address: Address): string {
    const parts = [
      address.street,
      address.number,
      address.apartment,
      address.city,
      address.state,
      address.country,
      address.zipCode,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Format address for shipping label
   */
  formatAddressShipping(address: Address): string {
    return [
      `${address.firstName} ${address.lastName}`,
      address.company,
      `${address.street} ${address.number}${address.apartment ? ', ' + address.apartment : ''}`,
      `${address.city}${address.state ? ', ' + address.state : ''} ${address.zipCode || ''}`,
      address.country,
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Check if address data contains all required fields
   * Note: This checks if fields are present, not if they're valid
   */
  private isCompleteAddress(address: Partial<Address>): boolean {
    const requiredFields = ['firstName', 'lastName', 'street', 'number', 'city', 'country'];
    return requiredFields.every((field) => field in address);
  }

  /**
   * Search addresses by text
   */
  searchAddresses(addresses: Address[], searchText: string): Address[] {
    if (!searchText.trim()) {
      return addresses;
    }

    const search = searchText.toLowerCase();
    return addresses.filter(
      (address) =>
        address.firstName.toLowerCase().includes(search) ||
        address.lastName.toLowerCase().includes(search) ||
        address.street.toLowerCase().includes(search) ||
        address.city.toLowerCase().includes(search) ||
        address.country.toLowerCase().includes(search) ||
        (address.company && address.company.toLowerCase().includes(search)) ||
        (address.notes && address.notes.toLowerCase().includes(search))
    );
  }

  /**
   * Get address by ID
   */
  async getAddressById(addressId: string): Promise<Address | null> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const response = await httpClient.get(`/users/me/addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      const address = response.address || response.data?.address || response.data;
      return address || null;
    } catch (error) {
      const apiError = handleApiError(error, 'getAddressById');
      throw new Error(apiError.message);
    }
  }

  /**
   * Duplicate an existing address
   */
  duplicateAddress(address: Address): Omit<Address, 'id'> {
    const { id: _id, isDefault: _isDefault, ...addressData } = address;
    return {
      ...addressData,
      firstName: address.firstName + ' (Copy)',
      isDefault: false, // New duplicate should not be default
    };
  }
}

// Export singleton instance
export const addressService = new AddressService();
export default addressService;
