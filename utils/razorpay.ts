// utils/razorpay.ts
import { Alert } from 'react-native';

const RazorpayCheckout = require('react-native-razorpay').default;

export interface RazorpayOptions {
  description: string;
  image?: string;
  currency: string;
  key: string;
  amount: number;
  name: string;
  order_id?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color: string;
  };
  [key: string]: any;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  success: boolean;
  data?: RazorpayResponse;
  error?: string;
}

export const initializeRazorpay = (): boolean => {
  try {
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

export const openRazorpayCheckout = async (options: RazorpayOptions): Promise<PaymentResult> => {
  try {
    if (!RazorpayCheckout) {
      throw new Error('Payment service is not available. Please try again later.');
    }
    
    // Ensure amount is a number and convert to string as required by Razorpay
    const processedOptions = {
      ...options,
      amount: String(Math.round(Number(options.amount))),
    };
    
    const data: RazorpayResponse = await RazorpayCheckout.open(processedOptions);
    
    if (!data?.razorpay_payment_id) {
      throw new Error('Payment failed: No payment ID received');
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Razorpay error:', error);
    
    // Handle user cancellation
    if (error?.code === 'E_PAYMENT_CANCELLED') {
      return { 
        success: false, 
        error: 'Payment was cancelled by user' 
      };
    }
    
    // Extract error message
    let errorMessage = 'Payment failed. Please try again.';
    
    if (error && typeof error === 'object') {
      const razorpayError = error as {
        description?: string;
        error?: { 
          description?: string;
          message?: string;
          code?: string | number;
        };
        message?: string;
      };
      
      errorMessage = razorpayError.description || 
                   razorpayError.error?.description || 
                   razorpayError.error?.message || 
                   razorpayError.message || 
                   errorMessage;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};
