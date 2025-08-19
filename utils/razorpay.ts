// utils/razorpay.ts
import { Alert } from 'react-native';

const RazorpayCheckout = require('react-native-razorpay').default;

export const initializeRazorpay = () => {
  try {
    // Just verify that Razorpay is available
    if (!RazorpayCheckout) {
      console.error('Razorpay SDK not found');
      return false;
    }
    console.log('Razorpay initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    return false;
  }
};

export const openRazorpayCheckout = async (options: any) => {
  try {
    if (!RazorpayCheckout) {
      throw new Error('Payment service is not available. Please try again later.');
    }
    
    const data = await RazorpayCheckout.open(options);
    
    if (!data || !data.razorpay_payment_id) {
      throw new Error('Payment failed: No payment ID received');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Razorpay error:', error);
    
    let errorMessage = 'Payment failed. Please try again.';
    
    if (error && typeof error === 'object') {
      const razorpayError = error as {
        description?: string;
        error?: { 
          description?: string;
          message?: string;
        };
        message?: string;
      };
      
      if (razorpayError.description) {
        errorMessage = razorpayError.description;
      } else if (razorpayError.error?.description) {
        errorMessage = razorpayError.error.description;
      } else if (typeof razorpayError.message === 'string') {
        errorMessage = razorpayError.message;
      } else if (razorpayError.error?.message) {
        errorMessage = razorpayError.error.message;
      }
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};
