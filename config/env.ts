interface AppEnv {
  RAZORPAY_KEY_ID: string;
}

// Development environment configuration
const developmentEnv: AppEnv = {
  RAZORPAY_KEY_ID: 'rzp_test_ZjwOOezkHZ5DsV', // Test key for development
};

// Production environment configuration
const productionEnv: AppEnv = {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_ZjwOOezkHZ5DsV', // Fallback to test key
};

// Select environment based on NODE_ENV
const env = process.env.NODE_ENV === 'production' ? productionEnv : developmentEnv;

// Validate environment variables
if (!env.RAZORPAY_KEY_ID) {
  console.warn('⚠️  RAZORPAY_KEY_ID is not set in the environment variables');
}

// Additional validation for test key format
if (env.RAZORPAY_KEY_ID && !env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
  console.warn('⚠️  RAZORPAY_KEY_ID format might be incorrect. Should start with rzp_');
}

// Export as default
export default env;