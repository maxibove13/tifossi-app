export interface User {
  id: string;
  name: string | null;
  email: string | null;
  profilePicture: string | null;
  isEmailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  metadata?: {
    provider?: 'email' | 'google' | 'apple';
    isPrivateEmail?: boolean;
    appleUserId?: string;
    hasReceivedUserData?: boolean;
    [key: string]: unknown;
  };
  // Add other user-specific fields as needed
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isChangingPassword?: boolean;
  isUploadingProfilePicture?: boolean;
  isVerifyingEmail?: boolean;

  // Authentication methods
  initializeAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;

  // New methods for additional functionality
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;

  // Apple Sign-In utility methods
  isAppleSignInAvailable: () => Promise<boolean>;
  getAppleCredentialState: (userId: string) => Promise<number>;

  // Test utility methods
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export interface PasswordChangeCredentials {
  currentPassword: string;
  newPassword: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
}

// Apple Sign-In specific types
export interface AppleAuthenticationCredential {
  user: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
  identityToken: string;
  authorizationCode: string;
  realUserStatus?: number;
}

export interface AppleAuthResult extends AuthResult {
  provider: 'apple';
  appleUserId?: string;
  isPrivateEmail?: boolean;
}

export interface AppleUserData {
  id: string;
  email?: string;
  name?: string;
  isPrivateEmail: boolean;
  firstTimeUser: boolean;
}

// Base auth result interface for multi-provider support
export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Authentication provider types
export type LoginProvider = 'email' | 'google' | 'apple';

// Apple Sign-In error codes and messages
export const APPLE_AUTH_ERRORS_ES = {
  // User interaction errors
  ERROR_CANCELED: 'Inicio de sesión cancelado',
  ERROR_USER_CANCELED: 'Inicio de sesión cancelado por el usuario',

  // Availability errors
  ERROR_NOT_AVAILABLE: 'Apple Sign-In no está disponible en este dispositivo',
  ERROR_NOT_SUPPORTED: 'Apple Sign-In no es compatible con esta versión del sistema',
  ERROR_SIMULATOR_NOT_SUPPORTED:
    'Apple Sign-In no funciona en el simulador. Prueba en un dispositivo real',

  // Response and credential errors
  ERROR_INVALID_RESPONSE: 'Respuesta inválida de Apple. Intenta nuevamente',
  ERROR_INVALID_CREDENTIALS: 'Credenciales de Apple inválidas',
  ERROR_INVALID_TOKEN: 'Token de Apple inválido o expirado',
  ERROR_MALFORMED_TOKEN: 'El token de Apple tiene un formato incorrecto',

  // Network and connectivity errors
  ERROR_NETWORK: 'Error de conexión. Verifica tu conexión a internet',
  ERROR_NETWORK_TIMEOUT: 'La conexión se agotó. Verifica tu conexión e intenta nuevamente',
  ERROR_SERVICE_UNAVAILABLE: 'Los servidores de Apple no están disponibles. Intenta más tarde',

  // Account and authentication errors
  ERROR_USER_NOT_FOUND: 'Usuario no encontrado en Apple',
  ERROR_ACCOUNT_DISABLED: 'Tu cuenta de Apple está deshabilitada',
  ERROR_ACCOUNT_SUSPENDED: 'Tu cuenta de Apple ha sido suspendida',
  ERROR_AUTHORIZATION_FAILED: 'La autorización con Apple falló',
  ERROR_AUTHENTICATION_FAILED: 'Error de autenticación con Apple',

  // Rate limiting and security
  ERROR_TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e intenta nuevamente',
  ERROR_RATE_LIMITED: 'Demasiados intentos recientes. Intenta en unos minutos',
  ERROR_SECURITY_ERROR: 'Error de seguridad. Intenta nuevamente más tarde',

  // Account linking and conflicts
  ERROR_EMAIL_ALREADY_IN_USE: 'Ya existe una cuenta con este email. ¿Deseas iniciar sesión?',
  ERROR_ACCOUNT_EXISTS: 'Ya tienes una cuenta con otro método. Intenta iniciar sesión',
  ERROR_CREDENTIAL_ALREADY_IN_USE: 'Esta cuenta de Apple ya está vinculada a otro usuario',

  // Configuration errors (development)
  ERROR_CONFIGURATION: 'Apple Sign-In no está configurado correctamente',
  ERROR_MISSING_ENTITLEMENTS: 'Configuración de Apple Sign-In incompleta',

  // Generic errors
  ERROR_UNKNOWN: 'Error desconocido. Por favor, intenta otro método de inicio de sesión',
  ERROR_SYSTEM_ERROR: 'Error del sistema. Intenta reiniciar la aplicación',
  ERROR_UNEXPECTED: 'Error inesperado. Si el problema persiste, contacta soporte',

  // Success/informational messages
  SUCCESS_SIGNIN: 'Inicio de sesión exitoso con Apple',
  SUCCESS_ACCOUNT_CREATED: 'Cuenta creada exitosamente con Apple',
  INFO_FIRST_TIME: 'Primera vez usando Apple Sign-In',
  INFO_RETURNING_USER: 'Bienvenido de vuelta',
} as const;

export type AppleAuthErrorCode = keyof typeof APPLE_AUTH_ERRORS_ES;
