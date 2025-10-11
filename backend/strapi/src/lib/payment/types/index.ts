/**
 * Shared Type Definitions for Payment System
 * Tifossi E-commerce Platform
 */

// Re-export all types for convenient importing
export * from './mercadopago';
export * from './orders';

// Common types used across the payment system
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface WebhookHeaders {
  'x-signature': string;
  'x-request-id': string;
  'content-type'?: string;
  'user-agent'?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export enum PaymentProvider {
  MERCADOPAGO = 'mercadopago',
  // Future providers can be added here
}

export enum Environment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

// Error types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class WebhookError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;
