// This file is a simple test to verify that the MMKV module works
import { MMKV } from 'react-native-mmkv';

// Create an MMKV instance
const mmkvInstance = new MMKV();

// Function to verify MMKV works
export function testMMKV() {
  try {
    // Test writing and reading a string
    mmkvInstance.set('test-key', 'MMKV is working!');
    const value = mmkvInstance.getString('test-key');

    console.log('MMKV Test Result:', value);
    return value === 'MMKV is working!';
  } catch (error) {
    console.error('MMKV Test Failed:', error);
    return false;
  }
}

export default mmkvInstance;
