/**
 * Module Load Order Test
 *
 * This test verifies that no Firebase/native module methods are called
 * during module import time. This is critical because module-level code
 * runs before React Native's bridge is ready in production builds.
 *
 * NOTE: This test uses Jest mocks, so it can't catch all production crashes.
 * The real test is running a production build on device.
 */

// Track all Firebase method calls
const firebaseMethodCalls: string[] = [];

// Mock Firebase BEFORE any imports
jest.mock('@react-native-firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn()),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockAuth),
    getAuth: jest.fn(() => {
      firebaseMethodCalls.push('getAuth');
      return mockAuth;
    }),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(() => {
      firebaseMethodCalls.push('onAuthStateChanged');
      return jest.fn();
    }),
    getIdToken: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendEmailVerification: jest.fn(),
    updateProfile: jest.fn(),
    GoogleAuthProvider: { credential: jest.fn() },
    AppleAuthProvider: { credential: jest.fn() },
    EmailAuthProvider: { credential: jest.fn() },
    reauthenticateWithCredential: jest.fn(),
    updatePassword: jest.fn(),
    applyActionCode: jest.fn(),
    verifyPasswordResetCode: jest.fn(),
    confirmPasswordReset: jest.fn(),
    signInWithCredential: jest.fn(),
  };
});

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

describe('Module Load Order', () => {
  beforeEach(() => {
    // Clear the call tracking before each test
    firebaseMethodCalls.length = 0;
    jest.clearAllMocks();
  });

  it('should NOT call Firebase methods when importing firebaseAuth module', () => {
    // Clear any previous calls
    firebaseMethodCalls.length = 0;

    // Import the module (this simulates what happens during bundle evaluation)
    jest.isolateModules(() => {
      require('../../_services/auth/firebaseAuth');
    });

    // Verify no Firebase methods were called during import
    expect(firebaseMethodCalls).toEqual([]);
  });

  it('should NOT call Firebase methods when importing authService module', () => {
    firebaseMethodCalls.length = 0;

    jest.isolateModules(() => {
      require('../../_services/auth/authService');
    });

    expect(firebaseMethodCalls).toEqual([]);
  });

  it('should NOT call Firebase methods when importing authStore module', () => {
    firebaseMethodCalls.length = 0;

    jest.isolateModules(() => {
      require('../../_stores/authStore');
    });

    // The key assertion: no Firebase calls during store creation/rehydration
    expect(firebaseMethodCalls).toEqual([]);
  });

  it('should NOT call Firebase methods when importing storeSynchronizer module', () => {
    firebaseMethodCalls.length = 0;

    jest.isolateModules(() => {
      require('../../_stores/storeSynchronizer');
    });

    expect(firebaseMethodCalls).toEqual([]);
  });

  it('should NOT call Firebase methods when importing all modules in _layout.tsx order', () => {
    firebaseMethodCalls.length = 0;

    jest.isolateModules(() => {
      // Import in the same order as _layout.tsx
      require('../../_stores/authStore');
      require('../../_stores/cartStore');
      require('../../_config/initialization');
      require('../../_stores/storeSynchronizer');
    });

    // Critical: no Firebase calls should happen during module imports
    expect(firebaseMethodCalls).toEqual([]);
  });

  it('should be able to call initializeAuth without errors after module load', async () => {
    firebaseMethodCalls.length = 0;

    await jest.isolateModulesAsync(async () => {
      const { useAuthStore } = require('../../_stores/authStore');

      // Verify no calls during import
      expect(firebaseMethodCalls).toEqual([]);

      // Verify initializeAuth can be called without throwing
      // (In production, this runs after React mounts)
      const initializeAuth = useAuthStore.getState().initializeAuth;

      // Should complete without throwing
      let error: Error | null = null;
      try {
        await initializeAuth();
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeNull();
    });
  });
});
