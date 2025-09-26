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
    id: 'addr-1',
    firstName: 'John',
    lastName: 'Doe',
    street: 'Main Street',
    number: '123',
    apartment: 'Apt 4B',
    city: 'Montevideo',
    state: 'Montevideo',
    country: 'Uruguay',
    zipCode: '11000',
    phone: '+598 99 123 456',
    isDefault: false,
    addressType: 'home',
  };

  describe('fetchUserAddresses', () => {
    it('should fetch all user addresses', async () => {
      const mockAddresses = [validAddress, { ...validAddress, id: 'addr-2' }];
      mockHttpClient.get.mockResolvedValue({ addresses: mockAddresses });

      const result = await addressService.fetchUserAddresses();

      expect(result).toEqual(mockAddresses);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/users/me/addresses',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should handle different response formats', async () => {
      // Test response.data.addresses format
      mockHttpClient.get.mockResolvedValue({ data: { addresses: [validAddress] } });
      let result = await addressService.fetchUserAddresses();
      expect(result).toEqual([validAddress]);

      // Test response.data format
      mockHttpClient.get.mockResolvedValue({ data: [validAddress] });
      result = await addressService.fetchUserAddresses();
      expect(result).toEqual([validAddress]);

      // Test empty response
      mockHttpClient.get.mockResolvedValue({});
      result = await addressService.fetchUserAddresses();
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
    const newAddress = {
      firstName: 'Jane',
      lastName: 'Smith',
      street: 'Oak Street',
      number: '456',
      city: 'Montevideo',
      country: 'Uruguay',
    };

    it('should create a new address with valid data', async () => {
      const createdAddress = { ...newAddress, id: 'addr-new' };
      mockHttpClient.post.mockResolvedValue({ address: createdAddress });

      const result = await addressService.createAddress(newAddress);

      expect(result.success).toBe(true);
      expect(result.address).toEqual(createdAddress);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/users/me/addresses',
        newAddress,
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidAddress = { ...newAddress, firstName: '' };

      const result = await addressService.createAddress(invalidAddress);

      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate all required fields at once', async () => {
      const invalidAddress = {
        firstName: '',
        lastName: '',
        street: '',
        number: '',
        city: '',
        country: '',
      };

      const result = await addressService.createAddress(invalidAddress);

      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
      expect(result.error).toContain('Last name is required');
      expect(result.error).toContain('Street address is required');
      expect(result.error).toContain('Street number is required');
      expect(result.error).toContain('City is required');
      expect(result.error).toContain('Country is required');
    });

    it('should handle API errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('API Error'));

      const result = await addressService.createAddress(newAddress);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      const updates = { street: 'New Street', number: '789' };
      const updatedAddress = { ...validAddress, ...updates };
      mockHttpClient.put.mockResolvedValue({ address: updatedAddress });

      const result = await addressService.updateAddress('addr-1', updates);

      expect(result.success).toBe(true);
      expect(result.address).toEqual(updatedAddress);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/users/me/addresses/addr-1',
        updates,
        expect.any(Object)
      );
    });

    it('should validate if complete address is provided', async () => {
      const completeInvalidAddress = {
        firstName: '',
        lastName: 'Doe',
        street: 'Main',
        number: '123',
        city: 'Montevideo',
        country: 'Uruguay',
      };

      const result = await addressService.updateAddress('addr-1', completeInvalidAddress);

      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
    });

    it('should allow partial updates without validation', async () => {
      const partialUpdate = { apartment: 'Suite 5' };
      mockHttpClient.put.mockResolvedValue({ address: { ...validAddress, ...partialUpdate } });

      const result = await addressService.updateAddress('addr-1', partialUpdate);

      expect(result.success).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await addressService.deleteAddress('addr-1');

      expect(result.success).toBe(true);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/users/me/addresses/addr-1',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should handle deletion errors', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('Not found'));

      const result = await addressService.deleteAddress('addr-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('setDefaultAddress', () => {
    it('should set an address as default', async () => {
      const addresses = [
        { ...validAddress, isDefault: false },
        { ...validAddress, id: 'addr-2', isDefault: true },
      ];
      mockHttpClient.put.mockResolvedValue({ addresses });

      const result = await addressService.setDefaultAddress('addr-2');

      expect(result.success).toBe(true);
      expect(result.addresses).toEqual(addresses);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/users/me/addresses/addr-2/set-default',
        {},
        expect.any(Object)
      );
    });
  });

  describe('getDefaultAddress', () => {
    it('should return the default address', async () => {
      const addresses = [
        { ...validAddress, isDefault: false },
        { ...validAddress, id: 'addr-2', isDefault: true },
        { ...validAddress, id: 'addr-3', isDefault: false },
      ];
      mockHttpClient.get.mockResolvedValue({ addresses });

      const result = await addressService.getDefaultAddress();

      expect(result).toEqual(addresses[1]);
    });

    it('should return null if no default address', async () => {
      const addresses = [
        { ...validAddress, isDefault: false },
        { ...validAddress, id: 'addr-2', isDefault: false },
      ];
      mockHttpClient.get.mockResolvedValue({ addresses });

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
        street: '',
        number: '',
        city: '',
        country: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('First name is required');
      expect(result.errors).toContain('Last name is required');
      expect(result.errors).toContain('Street address is required');
      expect(result.errors).toContain('Street number is required');
      expect(result.errors).toContain('City is required');
      expect(result.errors).toContain('Country is required');
    });

    it('should validate field lengths', () => {
      const result = addressService.validateAddress({
        firstName: 'A'.repeat(51),
        lastName: 'B'.repeat(51),
        street: 'C'.repeat(101),
        number: 'D'.repeat(11),
        apartment: 'E'.repeat(21),
        city: 'F'.repeat(51),
        country: 'Uruguay',
        zipCode: 'G'.repeat(21),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('First name must be 50 characters or less');
      expect(result.errors).toContain('Last name must be 50 characters or less');
      expect(result.errors).toContain('Street address must be 100 characters or less');
      expect(result.errors).toContain('Street number must be 10 characters or less');
      expect(result.errors).toContain('Apartment/Unit must be 20 characters or less');
      expect(result.errors).toContain('City must be 50 characters or less');
      expect(result.errors).toContain('ZIP/Postal code must be 20 characters or less');
    });

    it('should validate phone format', () => {
      const validPhones = ['+598 99 123 456', '099123456', '(099) 123-456', '+598991234567'];

      validPhones.forEach((phone) => {
        const result = addressService.validateAddress({ ...validAddress, phone });
        expect(result.errors).not.toContain('Phone number contains invalid characters');
      });

      const invalidPhones = ['phone@email', 'abc-def-ghij'];
      invalidPhones.forEach((phone) => {
        const result = addressService.validateAddress({ ...validAddress, phone });
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

      expect(formatted).toBe('Main Street, 123, Apt 4B, Montevideo, Montevideo, Uruguay, 11000');
    });

    it('should omit undefined fields', () => {
      const minimalAddress: Address = {
        firstName: 'John',
        lastName: 'Doe',
        street: 'Main Street',
        number: '123',
        city: 'Montevideo',
        country: 'Uruguay',
      };

      const formatted = addressService.formatAddressDisplay(minimalAddress);

      expect(formatted).toBe('Main Street, 123, Montevideo, Uruguay');
    });
  });

  describe('formatAddressShipping', () => {
    it('should format address for shipping label', () => {
      const formatted = addressService.formatAddressShipping(validAddress);

      const expected = [
        'John Doe',
        'Main Street 123, Apt 4B',
        'Montevideo, Montevideo 11000',
        'Uruguay',
      ].join('\n');

      expect(formatted).toBe(expected);
    });

    it('should include company if provided', () => {
      const addressWithCompany = { ...validAddress, company: 'ACME Corp' };
      const formatted = addressService.formatAddressShipping(addressWithCompany);

      expect(formatted).toContain('ACME Corp');
    });

    it('should handle minimal address', () => {
      const minimalAddress: Address = {
        firstName: 'John',
        lastName: 'Doe',
        street: 'Main Street',
        number: '123',
        city: 'Montevideo',
        country: 'Uruguay',
      };

      const formatted = addressService.formatAddressShipping(minimalAddress);

      const expected = [
        'John Doe',
        'Main Street 123',
        'Montevideo ', // Note: trailing space when no state/zipCode
        'Uruguay',
      ].join('\n');

      expect(formatted).toBe(expected);
    });
  });

  describe('searchAddresses', () => {
    const addresses: Address[] = [
      { ...validAddress, firstName: 'John', lastName: 'Doe', street: 'Main St' },
      { ...validAddress, id: 'addr-2', firstName: 'Jane', lastName: 'Smith', street: 'Oak Ave' },
      {
        ...validAddress,
        id: 'addr-3',
        firstName: 'Bob',
        lastName: 'Johnson',
        city: 'Punta del Este',
      },
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

    it('should search by street', () => {
      const results = addressService.searchAddresses(addresses, 'oak');

      expect(results).toHaveLength(1);
      expect(results[0].street).toBe('Oak Ave');
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

    it('should search in company and notes fields', () => {
      const addressWithCompany = {
        ...addresses[0],
        company: 'Tech Solutions',
        notes: 'Near the park',
      };
      const testAddresses = [addressWithCompany, addresses[1]];

      let results = addressService.searchAddresses(testAddresses, 'tech');
      expect(results).toHaveLength(1);

      results = addressService.searchAddresses(testAddresses, 'park');
      expect(results).toHaveLength(1);
    });

    it('should be case insensitive', () => {
      const results = addressService.searchAddresses(addresses, 'JOHN');

      // Finds both "John" and "Johnson" because it's a partial match
      expect(results).toHaveLength(2);
      expect(results.some((addr) => addr.firstName === 'John')).toBe(true);
      expect(results.some((addr) => addr.lastName === 'Johnson')).toBe(true);
    });
  });

  describe('getAddressById', () => {
    it('should fetch address by ID', async () => {
      mockHttpClient.get.mockResolvedValue({ address: validAddress });

      const result = await addressService.getAddressById('addr-1');

      expect(result).toEqual(validAddress);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/users/me/addresses/addr-1',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should throw on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not found'));

      await expect(addressService.getAddressById('addr-1')).rejects.toThrow();
    });
  });

  describe('duplicateAddress', () => {
    it('should duplicate address without ID and default flag', () => {
      const original = { ...validAddress, isDefault: true };
      const duplicate = addressService.duplicateAddress(original);

      expect('id' in duplicate).toBe(false);
      expect(duplicate.isDefault).toBe(false);
      expect(duplicate.firstName).toBe('John (Copy)');
      expect(duplicate.lastName).toBe(original.lastName);
      expect(duplicate.street).toBe(original.street);
    });
  });
});
