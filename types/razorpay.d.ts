// Type definitions for react-native-razorpay
declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: string;
    name: string;
    order_id?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
      [key: string]: any;
    };
    modal?: {
      ondismiss?: () => void;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayError extends Error {
    code?: number;
    description?: string;
    error?: {
      code?: number;
      description?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export interface RazorpayCheckoutType {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>;
    onExternalWalletSelection(onSuccess: (data: any) => void): void;
    onPaymentError(error: RazorpayError): void;
  }

  const RazorpayCheckout: RazorpayCheckoutType;
  export default RazorpayCheckout;
}
