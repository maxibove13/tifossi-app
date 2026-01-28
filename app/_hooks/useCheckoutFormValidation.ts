import { useState, useCallback } from 'react';

// Common validation error messages in Spanish
const MESSAGES = {
  required: (field: string) => `${field} es obligatorio`,
  invalidEmail: 'El email no es válido',
  emailMismatch: 'Los emails no coinciden',
};

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field name mappings for error messages
const FIELD_NAMES: Record<string, string> = {
  firstName: 'El nombre',
  lastName: 'El apellido',
  email: 'El email',
  confirmEmail: 'La confirmación de email',
  phone: 'El número de celular',
  street: 'La calle',
  number: 'El número',
  city: 'La ciudad',
  department: 'El departamento',
};

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;

interface UseCheckoutFormValidationReturn<T extends string> {
  errors: ValidationErrors<T>;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors<T>>>;
  validateRequired: (value: string, field: T) => string | undefined;
  validateEmail: (value: string) => string | undefined;
  validateEmailMatch: (email: string, confirmEmail: string) => string | undefined;
  clearFieldError: (field: T) => void;
  clearAllErrors: () => void;
}

/**
 * Hook for checkout form validation.
 * Provides reusable validators for common form fields.
 *
 * @example
 * const { errors, validateRequired, validateEmail, clearFieldError } = useCheckoutFormValidation<
 *   'firstName' | 'lastName' | 'email'
 * >();
 *
 * const validate = () => {
 *   const newErrors = {};
 *   newErrors.firstName = validateRequired(form.firstName, 'firstName');
 *   newErrors.email = validateEmail(form.email);
 *   return Object.values(newErrors).every(e => !e);
 * };
 */
export function useCheckoutFormValidation<T extends string>(): UseCheckoutFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  const validateRequired = useCallback((value: string, field: T): string | undefined => {
    if (!value.trim()) {
      const fieldName = FIELD_NAMES[field] || field;
      return MESSAGES.required(fieldName);
    }
    return undefined;
  }, []);

  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return MESSAGES.required('El email');
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      return MESSAGES.invalidEmail;
    }
    return undefined;
  }, []);

  const validateEmailMatch = useCallback(
    (email: string, confirmEmail: string): string | undefined => {
      if (!confirmEmail.trim()) {
        return MESSAGES.required(FIELD_NAMES.confirmEmail);
      }
      if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        return MESSAGES.emailMismatch;
      }
      return undefined;
    },
    []
  );

  const clearFieldError = useCallback((field: T) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setErrors,
    validateRequired,
    validateEmail,
    validateEmailMatch,
    clearFieldError,
    clearAllErrors,
  };
}

export default useCheckoutFormValidation;
