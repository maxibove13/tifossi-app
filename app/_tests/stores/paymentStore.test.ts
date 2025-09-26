/**
 * PaymentStore Tests
 * Tests the minimal payment UI state management store
 * Following testing principles: Use real stores, no mocking
 */

import { act, renderHook } from '@testing-library/react-native';
import { usePaymentStore, clearCurrentPayment } from '../../_stores/paymentStore';

describe('PaymentStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      usePaymentStore.setState({
        currentOrderNumber: null,
        currentOrderId: null,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('setCurrentOrder', () => {
    it('should set order number and ID correctly', () => {
      const { result } = renderHook(() => usePaymentStore());

      act(() => {
        result.current.setCurrentOrder('ORDER-123', 'order-id-456');
      });

      expect(result.current.currentOrderNumber).toBe('ORDER-123');
      expect(result.current.currentOrderId).toBe('order-id-456');
      expect(result.current.error).toBeNull();
    });

    it('should clear error when setting new order', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Set an error first
      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      // Set new order should clear error
      act(() => {
        result.current.setCurrentOrder('ORDER-789', 'order-id-999');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentOrderNumber).toBe('ORDER-789');
    });

    it('should handle null values for order info', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Set some values first
      act(() => {
        result.current.setCurrentOrder('ORDER-123', 'order-id-456');
      });

      // Then set to null
      act(() => {
        result.current.setCurrentOrder(null, null);
      });

      expect(result.current.currentOrderNumber).toBeNull();
      expect(result.current.currentOrderId).toBeNull();
    });
  });

  describe('clearPaymentState', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Set various state values
      act(() => {
        result.current.setCurrentOrder('ORDER-123', 'order-id-456');
        result.current.setLoading(true);
        // Note: setError would set loading to false, so we set error directly via setState
        usePaymentStore.setState({ error: 'Test error' });
      });

      // Verify state was set
      expect(result.current.currentOrderNumber).toBe('ORDER-123');
      expect(result.current.currentOrderId).toBe('order-id-456');
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe('Test error');

      // Clear all state
      act(() => {
        result.current.clearPaymentState();
      });

      // Verify all state is reset
      expect(result.current.currentOrderNumber).toBeNull();
      expect(result.current.currentOrderId).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message and stop loading', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Start with loading state
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Set error
      act(() => {
        result.current.setError('Payment failed');
      });

      expect(result.current.error).toBe('Payment failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Set an error
      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      const { result } = renderHook(() => usePaymentStore());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Start with loading
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Stop loading
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('backward compatibility', () => {
    it('should support clearCurrentPayment alias', () => {
      const { result } = renderHook(() => usePaymentStore());

      // Set some state
      act(() => {
        result.current.setCurrentOrder('ORDER-123', 'order-id-456');
        result.current.setError('Test error');
      });

      expect(result.current.currentOrderNumber).toBe('ORDER-123');
      expect(result.current.error).toBe('Test error');

      // Use the backward compatibility function
      act(() => {
        clearCurrentPayment();
      });

      // Verify state was cleared
      expect(result.current.currentOrderNumber).toBeNull();
      expect(result.current.currentOrderId).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('state persistence', () => {
    it('should maintain state across multiple hook instances', () => {
      const { result: hook1 } = renderHook(() => usePaymentStore());
      const { result: hook2 } = renderHook(() => usePaymentStore());

      // Set state in first hook
      act(() => {
        hook1.current.setCurrentOrder('ORDER-999', 'order-id-111');
      });

      // Verify both hooks have the same state
      expect(hook1.current.currentOrderNumber).toBe('ORDER-999');
      expect(hook2.current.currentOrderNumber).toBe('ORDER-999');
      expect(hook1.current.currentOrderId).toBe('order-id-111');
      expect(hook2.current.currentOrderId).toBe('order-id-111');
    });
  });
});
