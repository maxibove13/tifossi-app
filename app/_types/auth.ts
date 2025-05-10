export interface User {
  id: string;
  name: string | null;
  email: string | null;
  profilePicture: string | null;
  isEmailVerified?: boolean;
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
  logout: () => Promise<void>;

  // New methods for additional functionality
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
}

export interface PasswordChangeCredentials {
  currentPassword: string;
  newPassword: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
}
