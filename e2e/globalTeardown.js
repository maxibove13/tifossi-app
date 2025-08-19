module.exports = async () => {
  console.log('🧹 Running global E2E teardown...');
  
  try {
    // Call the teardown function set up in global setup
    if (global.__DETOX_TEARDOWN__) {
      await global.__DETOX_TEARDOWN__();
    }
    
    // Additional cleanup if needed
    console.log('✅ Global E2E teardown completed successfully');
  } catch (error) {
    console.error('❌ Failed to run global E2E teardown:', error);
    throw error;
  }
};