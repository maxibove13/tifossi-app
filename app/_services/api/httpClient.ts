import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { endpoints } from '../../_config/endpoints';
import { isPublicPath, validateHttpClientPath } from './publicPaths';

// Configuration constants
const REQUEST_TIMEOUT = 10000; // 10 seconds
const AUTH_TOKEN_KEY = 'tifossi_auth_token';
let cachedAuthToken: string | null = null;

const logAuthTokenEvent = (event: string, source?: string) => {
  const suffix = source ? ` source=${source}` : '';
  const message = `[AuthToken] ${event}${suffix}`;

  console.info(message);
};

export const setHttpClientAuthToken = (token: string | null, source?: string) => {
  const normalizedToken = token ?? null;
  const previousToken = cachedAuthToken;
  cachedAuthToken = normalizedToken;

  if (previousToken !== normalizedToken) {
    const event = normalizedToken ? (previousToken ? 'cache-rotate' : 'cache-set') : 'cache-clear';
    logAuthTokenEvent(event, source);
  }
};

/**
 * Custom params serializer for Strapi API compatibility
 * Strapi requires array params as repeated keys: populate=a&populate=b
 * NOT as comma-separated: populate=a,b
 */
function strapiParamsSerializer(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Repeat the key for each array value (Strapi format)
      value.forEach((v) => searchParams.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${endpoints.baseUrl}/api`,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `TifossiApp/${Platform.OS}`,
      },
      paramsSerializer: strapiParamsSerializer,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for URL validation and auth token
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Fail fast on invalid URL formats (prevents /api/api/... and token leakage)
        validateHttpClientPath(config.url);

        // Add auth token if available (skip for public endpoints)
        if (!isPublicPath(config.url)) {
          try {
            const configHeaders = config.headers as any;
            const existingAuthHeader =
              (typeof configHeaders?.get === 'function' && configHeaders.get('Authorization')) ||
              configHeaders?.Authorization ||
              configHeaders?.authorization;
            let token = cachedAuthToken;

            if (!token) {
              token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
              if (token) {
                setHttpClientAuthToken(token, 'securestore-cache');
              }
            }

            if (!existingAuthHeader && token) {
              if (typeof configHeaders?.set === 'function') {
                configHeaders.set('Authorization', `Bearer ${token}`);
              } else {
                config.headers.Authorization = `Bearer ${token}`;
              }
            }
          } catch {}
        }

        // Log request in development
        if (__DEV__) {
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for basic error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (__DEV__) {
        }

        return response;
      },
      async (error: AxiosError) => {
        // Log error in development
        if (__DEV__) {
        }

        // Handle 401 Unauthorized - clear token only when it was sent
        if (error.response?.status === 401) {
          const configHeaders = error.config?.headers as any;
          const authHeader =
            (typeof configHeaders?.get === 'function' && configHeaders.get('Authorization')) ||
            configHeaders?.Authorization ||
            configHeaders?.authorization;

          if (authHeader) {
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            setHttpClientAuthToken(null, 'response-401');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Public methods for making requests
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  // Get axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create singleton instance
const httpClient = new HttpClient();

export default httpClient;

// Export types and utilities
export { httpClient };
export type { AxiosRequestConfig, AxiosResponse, AxiosError };
