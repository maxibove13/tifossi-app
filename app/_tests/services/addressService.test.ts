/**
 * Address Service Unit Tests
 * Tests address validation, formatting, and management logic
 * Following testing principles: mock only at httpClient boundary
 */

import httpClient from '../../_services/api/httpClient';
import { addressService } from '../../_services/address/addressService';
import type { Address } from '../../_services/address/addressService';

// Mock httpClient at the boundary
jest.mock('../../_services/api/httpClient');
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('AddressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    addressService.setAuthToken('test-auth-token');
  });

  const validAddress: Address = {
    id: 0,
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: 'Main Street 123',
    addressLine2: 'Apt 4B',
    city: 'Montevideo',
    state: 'Montevideo',
    country: 'UY',
    postalCode: '11000',
    phoneNumber: '+598 99 123 456',
    isDefault: false,
    type: 'shipping',
  };

  describe('fetchUserAddresses', () => {
    it('should fetch all user addresses', async () => {
      const mockAddresses = [validAddress, { ...validAddress, id: 1 }];
      mockHttpClient.get.mockResolvedValue({ data: { addresses: mockAddresses } });

      const result = await addressService.fetchUserAddresses();

      expect(result).toEqual(mockAddresses);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/user-profile/me/addresses',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should handle direct array response', async () => {
      mockHttpClient.get.mockResolvedValue({ data: [validAddress] });
      const result = await addressService.fetchUserAddresses();
      expect(result).toEqual([validAddress]);
    });

    it('should handle empty response', async () => {
      mockHttpClient.get.mockResolvedValue({ data: { addresses: [] } });
      const result = await addressService.fetchUserAddresses();
      expect(result).toEqual([]);
    });

    it('should require authentication', async () => {
      addressService.setAuthToken(null);

      await expect(addressService.fetchUserAddresses()).rejects.toThrow(
        'Authentication token required'
      );
    });
  });

  describe('createAddress', () => {
    const newAddress: Omit<Address, 'id'> = {
      firstName: 'Jane',
      lastName: 'Smith',
      addressLine1: 'Oak Street 456',
      city: 'Montevideo',
      state: 'Montevideo',
      country: 'UY',
      isDefault: false,
      type: 'shipping',
    };

    it('should create a new address with valid data', async () => {
      const createdAddress = { ...newAddress, id: 2 };
      mockHttpClient.post.mockResolvedValue({ data: { address: createdAddress } });

      const result = await addressService.createAddress(newAddress);

      expect(result).toEqual(createdAddress);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/user-profile/me/addresses',
        newAddress,
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidAddress = { ...newAddress, firstName: '' };

      await expect(addressService.createAddress(invalidAddress)).rejects.toThrow(
        /First name is required/
      );
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate all required fields at once', async () => {
      const invalidAddress = {
        firstName: '',
        lastName: '',
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        isDefault: false,
        type: 'shipping' as const,
      };

      try {
        await addressService.createAddress(invalidAddress);
        fail('Should have thrown');
      } catch (e) {
        const error = e as Error;
        expect(error.message).toContain('First name is required');
        expect(error.message).toContain('Last name is required');
        expect(error.message).toContain('Address line 1 is required');
        expect(error.message).toContain('City is required');
        // Note: state is optional per schema
        expect(error.message).toContain('Country is required');
      }
    });

    it('should handle API errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('API Error'));

      await expect(addressService.createAddress(newAddress)).rejects.toThrow();
    });
  });

  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      const updates = { addressLine1: 'New Street 789' };
      const updatedAddress = { ...validAddress, ...updates };
      mockHttpClient.put.mockResolvedValue({ data: { address: updatedAddress } });

      const result = await addressService.updateAddress(0, updates);

      expect(result).toEqual(updatedAddress);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/user-profile/me/addresses/0',
        updates,
        expect.any(Object)
      );
    });

    it('should allow partial updates', async () => {
      const partialUpdate = { addressLine2: 'Suite 5' };
      mockHttpClient.put.mockResolvedValue({
        data: { address: { ...validAddress, ...partialUpdate } },
      });

      const result = await addressService.updateAddress(0, partialUpdate);

      expect(result.addressLine2).toBe('Suite 5');
      expect(mockHttpClient.put).toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address by index', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      await addressService.deleteAddress(0);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/user-profile/me/addresses/0',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should handle deletion errors', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('Not found'));

      await expect(addressService.deleteAddress(0)).rejects.toThrow();
    });
  });

  describe('setDefaultAddress', () => {
    it('should set an address as default', async () => {
      mockHttpClient.put.mockResolvedValue({});

      await addressService.setDefaultAddress(1);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/user-profile/me/addresses/1/default',
        {},
        expect.any(Object)
      );
    });
  });

  describe('getDefaultAddress', () => {
    it('should return the default address', async () => {
      const addresses = [
        { ...validAddress, id: 0, isDefault: false },
        { ...validAddress, id: 1, isDefault: true },
        { ...validAddress, id: 2, isDefault: false },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { addresses } });

      const result = await addressService.getDefaultAddress();

      expect(result).toEqual(addresses[1]);
    });

    it('should return null if no default address', async () => {
      const addresses = [
        { ...validAddress, id: 0, isDefault: false },
        { ...validAddress, id: 1, isDefault: false },
      ];
      mockHttpClient.get.mockResolvedValue({ data: { addresses } });

      const result = await addressService.getDefaultAddress();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));

      const result = await addressService.getDefaultAddress();

      expect(result).toBeNull();
    });
  });

  describe('validateAddress', () => {
    it('should validate required fields', () => {
      const result = addressService.validateAddress({
        firstName: '',
        lastName: '',
        addressLine1: '',
        city: '',
        country: '',
        isDefault: false,
        type: 'shipping',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('First name is required');
      expect(result.errors).toContain('Last name is required');
      expect(result.errors).toContain('Address line 1 is required');
      expect(result.errors).toContain('City is required');
      // Note: state is optional per schema
      expect(result.errors).toContain('Country is required');
    });

    it('should validate field lengths', () => {
      // Lengths match Strapi schema in backend/strapi/src/components/shared/address.json
      const result = addressService.validateAddress({
        firstName: 'A'.repeat(51),
        lastName: 'B'.repeat(51),
        addressLine1: 'C'.repeat(256),
        addressLine2: 'D'.repeat(256),
        city: 'E'.repeat(101),
        state: 'F'.repeat(101),
        country: 'UY',
        postalCode: 'G'.repeat(21),
        isDefault: false,
        type: 'shipping',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('First name must be 50 characters or less');
      expect(result.errors).toContain('Last name must be 50 characters or less');
      expect(result.errors).toContain('Address line 1 must be 255 characters or less');
      expect(result.errors).toContain('Address line 2 must be 255 characters or less');
      expect(result.errors).toContain('City must be 100 characters or less');
      expect(result.errors).toContain('State must be 100 characters or less');
      expect(result.errors).toContain('Postal code must be 20 characters or less');
    });

    it('should validate phone format', () => {
      const validPhones = ['+598 99 123 456', '099123456', '(099) 123-456', '+598991234567'];

      validPhones.forEach((phone) => {
        const result = addressService.validateAddress({ ...validAddress, phoneNumber: phone });
        expect(result.errors).not.toContain('Phone number contains invalid characters');
      });

      const invalidPhones = ['phone@email', 'abc-def-ghij'];
      invalidPhones.forEach((phone) => {
        const result = addressService.validateAddress({ ...validAddress, phoneNumber: phone });
        expect(result.errors).toContain('Phone number contains invalid characters');
      });
    });

    it('should pass validation for valid address', () => {
      const result = addressService.validateAddress(validAddress);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('formatAddressDisplay', () => {
    it('should format address for display', () => {
      const formatted = addressService.formatAddressDisplay(validAddress);

      expect(formatted).toContain('Main Street 123');
      expect(formatted).toContain('Montevideo');
      expect(formatted).toContain('UY');
    });

    it('should omit undefined fields', () => {
      const minimalAddress: Address = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: 'Main Street 123',
        city: 'Montevideo',
        state: 'Montevideo',
        country: 'UY',
        isDefault: false,
        type: 'shipping',
      };

      const formatted = addressService.formatAddressDisplay(minimalAddress);

      expect(formatted).toContain('Main Street 123');
      expect(formatted).toContain('Montevideo');
    });
  });

  describe('searchAddresses', () => {
    const addresses: Address[] = [
      { ...validAddress, id: 0, firstName: 'John', lastName: 'Doe', addressLine1: 'Main St 123' },
      { ...validAddress, id: 1, firstName: 'Jane', lastName: 'Smith', addressLine1: 'Oak Ave 456' },
      { ...validAddress, id: 2, firstName: 'Bob', lastName: 'Johnson', city: 'Punta del Este' },
    ];

    it('should search by first name', () => {
      const results = addressService.searchAddresses(addresses, 'jane');

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('Jane');
    });

    it('should search by last name', () => {
      const results = addressService.searchAddresses(addresses, 'johnson');

      expect(results).toHaveLength(1);
      expect(results[0].lastName).toBe('Johnson');
    });

    it('should search by address line', () => {
      const results = addressService.searchAddresses(addresses, 'oak');

      expect(results).toHaveLength(1);
      expect(results[0].addressLine1).toBe('Oak Ave 456');
    });

    it('should search by city', () => {
      const results = addressService.searchAddresses(addresses, 'punta');

      expect(results).toHaveLength(1);
      expect(results[0].city).toBe('Punta del Este');
    });

    it('should return all addresses for empty search', () => {
      const results = addressService.searchAddresses(addresses, '');

      expect(results).toEqual(addresses);
    });

    it('should be case insensitive', () => {
      const results = addressService.searchAddresses(addresses, 'JOHN');

      // Finds both "John" and "Johnson" because it's a partial match
      expect(results).toHaveLength(2);
      expect(results.some((addr) => addr.firstName === 'John')).toBe(true);
      expect(results.some((addr) => addr.lastName === 'Johnson')).toBe(true);
    });
  });
});
