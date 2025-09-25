// This is a fallback storage adapter that uses AsyncStorage instead of MMKV
// for development purposes until the native module issues are resolved

import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a storage interface compatible with Zustand's persist middleware
export const createAsyncStorage = () => ({
  getItem: async (name: string) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {}
  },
});

// Storage object compatible with Zustand's persist middleware
export const asyncStorage = {
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name);
    return value;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

export default asyncStorage;
