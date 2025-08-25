//payment-screen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

const { width, height } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customAmountError, setCustomAmountError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [userData, setUserData] = useState({
    email: (params.email as string) || 'customer@example.com',
    contact: (params.contact as string) || '9999999999',
    name: (params.name as string) || 'Customer Name'
  });

  // Load user data if not provided
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userSession = await AsyncStorage.getItem('userSession');
        if (userSession) {
          const user = JSON.parse(userSession);
          setUserData(prev => ({
            email: user.email || prev.email,
            contact: user.phone || prev.contact,
            name: user.name || prev.name
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (!params.email || !params.contact || !params.name) {
      loadUserData();
    }
  }, [params.email, params.contact, params.name]);

  // Define available plans
  const PLANS = {
    basic: {
      id: 'basic',
      name: 'Basic Plan',
      price: 299,
      description: '1 Month Access'
    },
    premium: {
      id: 'premium',
      name: 'Premium Plan',
      price: 999,
      description: '6 Months Access'
    },
    'premium pro': {
      id: 'premium pro',
      name: 'Premium Pro Plan',
      price: 3499,
      description: '12 Months Access'
    },
    custom: {
      id: 'custom',
      name: 'Custom Top-up',
      description: 'Add balance to your account',
      price: 0
    }
  };

  // Get selected plan details
  const selectedPlanDetails = selectedPlan ? PLANS[selectedPlan as keyof typeof PLANS] : null;
  const amount = selectedPlan === 'custom' 
    ? (parseInt(customAmount) || 0)
    : (selectedPlanDetails?.price || 0);
    
  const description = selectedPlan === 'custom' 
    ? `Top-up of ₹${amount}`
    : `${selectedPlanDetails?.name} - ${selectedPlanDetails?.description}`;

  // Generate HTML for Razorpay checkout
  const generatePaymentHtml = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
            }
            .payment-container {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .amount {
                font-size: 24px;
                font-weight: bold;
                color: #53a20e;
                margin: 20px 0;
            }
            .description {
                color: #666;
                margin-bottom: 30px;
            }
            .pay-button {
                background-color: #53a20e;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
            }
            .pay-button:hover {
                background-color: #4a9109;
            }
            .loading {
                display: none;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <h2>Complete Your Payment</h2>
            <div class="amount">₹${amount}</div>
            <div class="description">${description}</div>
            <button id="payButton" class="pay-button" onclick="startPayment()">
                Pay Now
            </button>
            <div id="loading" class="loading">Processing payment...</div>
        </div>

        <script>
            function startPayment() {
                const button = document.getElementById('payButton');
                const loading = document.getElementById('loading');
                
                button.style.display = 'none';
                loading.style.display = 'block';
                
                const options = {
                    key: '${env.RAZORPAY_KEY_ID}',
                    amount: ${amount * 100},
                    currency: 'INR',
                    name: 'KRISHIVA',
                    description: '${description.replace(/'/g, "\\'")}',
                    prefill: {
                        name: '${userData.name.replace(/'/g, "\\'")}',
                        email: '${userData.email}',
                        contact: '${userData.contact}'
                    },
                    theme: {
                        color: '#53a20e'
                    },
                    modal: {
                        ondismiss: function() {
                            // Payment cancelled
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'PAYMENT_CANCELLED'
                            }));
                        }
                    },
                    handler: function(response) {
                        // Payment successful
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'PAYMENT_SUCCESS',
                            payment_id: response.razorpay_payment_id,
                            order_id: response.razorpay_order_id || '',
                            signature: response.razorpay_signature || ''
                        }));
                    }
                };
                
                const razorpay = new Razorpay(options);
                
                razorpay.on('payment.failed', function(response) {
                    // Payment failed
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'PAYMENT_FAILED',
                        error: response.error
                    }));
                });
                
                razorpay.open();
            }
            
            // Auto-start payment when page loads
            window.addEventListener('load', function() {
                setTimeout(startPayment, 1000);
            });
        </script>
    </body>
    </html>`;
  };

  // Handle payment with embedded WebView
  const handlePayment = async () => {
    // Validate all inputs first
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan or enter a custom amount');
      return;
    }
    
    if (selectedPlan === 'custom') {
      const amount = parseInt(customAmount);
      if (isNaN(amount) || amount < 50) {
        setCustomAmountError('Please enter a valid amount (minimum ₹50)');
        return;
      }
    }
    
    // Validate user data
    if (!userData.email || !userData.contact || !userData.name) {
      Alert.alert('Error', 'Please complete your profile information before making a payment.');
      router.push('/profile');
      return;
    }
    
    // Validate Razorpay key
    if (!env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID.trim() === '') {
      Alert.alert('Configuration Error', 'Payment gateway is not properly configured.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate payment HTML
      const html = generatePaymentHtml();
      setPaymentHtml(html);
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      Alert.alert('Payment Error', 'Unable to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle WebView messages
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      
      setShowPaymentModal(false);
      
      switch (data.type) {
        case 'PAYMENT_SUCCESS':
          handlePaymentSuccess(data);
          break;
        case 'PAYMENT_FAILED':
          Alert.alert('Payment Failed', data.error?.description || 'Payment failed. Please try again.');
          break;
        case 'PAYMENT_CANCELLED':
          Alert.alert('Payment Cancelled', 'Payment was cancelled by user.');
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentData) => {
    console.log('🎉 Payment successful', paymentData);
    
    try {
      if (selectedPlan === 'custom') {
        // Handle top-up
        const currentBalance = parseInt(await AsyncStorage.getItem('userBalance') || '0');
        const topUpAmount = parseInt(customAmount) || 0;
        const newBalance = currentBalance + topUpAmount;
        await AsyncStorage.setItem('userBalance', newBalance.toString());
        
        Alert.alert(
          'Top-up Successful', 
          `₹${topUpAmount} has been added to your account. New balance: ₹${newBalance}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (selectedPlan && selectedPlanDetails) {
        // Handle subscription
        const expiryDate = new Date();
        let daysToAdd = 30; // default for basic plan
        
        if (selectedPlan === 'premium') {
          daysToAdd = 180;
        } else if (selectedPlan === 'premium pro') {
          daysToAdd = 365;
        }
        
        expiryDate.setDate(expiryDate.getDate() + daysToAdd);
        
        await AsyncStorage.multiSet([
          ['isPremium', 'true'],
          ['premiumExpiry', expiryDate.toISOString()],
          ['subscriptionPlan', selectedPlan],
          ['lastPaymentId', paymentData.payment_id || '']
        ]);
        
        Alert.alert(
          'Subscription Successful', 
          `You have successfully subscribed to ${selectedPlanDetails.name}!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert(
        'Success', 
        'Payment was successful, but there was an error updating your account. Please contact support.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setCustomAmountError('');
  };
  
  const handleCustomAmountChange = (text: string) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setCustomAmountError('');
  };
  
  const isPayButtonDisabled = loading || 
    (selectedPlan === 'custom' && (!customAmount || parseInt(customAmount) < 50)) ||
    !selectedPlan;

  const renderPlanButton = (planId: string, title: string, price: number, description: string, popular?: boolean) => (
    <TouchableOpacity 
      key={planId}
      style={[
        styles.planCard, 
        selectedPlan === planId && styles.planCardSelected,
        popular && styles.popularPlan
      ]}
      onPress={() => handlePlanSelect(planId)}
    >
      {popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>POPULAR</Text>
        </View>
      )}
      <Text style={styles.planName}>{title}</Text>
      <Text style={styles.planPrice}>₹{price}</Text>
      <Text style={styles.planDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.paymentDetails}>
          <Text style={styles.screenTitle}>Choose a Plan</Text>
          
          {/* Subscription Plans */}
          <View style={styles.plansContainer}>
            {Object.keys(PLANS).map((planId) => (
              renderPlanButton(
                planId, 
                PLANS[planId as keyof typeof PLANS].name, 
                PLANS[planId as keyof typeof PLANS].price, 
                PLANS[planId as keyof typeof PLANS].description
              )
            ))}
          </View>
          
          {/* Custom Amount Input */}
          {selectedPlan === 'custom' && (
            <View style={styles.customAmountContainer}>
              <Text style={styles.customAmountLabel}>Enter Amount (₹)</Text>
              <TextInput
                style={[
                  styles.customAmountInput,
                  customAmountError && styles.inputError
                ]}
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                placeholder="Minimum ₹50"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              {customAmountError ? (
                <Text style={styles.errorText}>{customAmountError}</Text>
              ) : (
                <Text style={styles.minAmountText}>Minimum ₹50</Text>
              )}
            </View>
          )}
          
          {/* Summary */}
          {selectedPlan && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Plan:</Text>
                <Text style={styles.summaryValue}>
                  {selectedPlanDetails?.name || 'No plan selected'}
                </Text>
              </View>
              <View style={[styles.summaryRow, { marginBottom: 0 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: '600' }]}>Amount:</Text>
                <Text style={[styles.summaryAmount, { fontSize: 20 }]}>₹{amount || 0}</Text>
              </View>
            </View>
          )}
          
          {/* Pay Button */}
          <TouchableOpacity 
            style={[
              styles.payButton, 
              isPayButtonDisabled && styles.payButtonDisabled
            ]} 
            onPress={handlePayment}
            disabled={isPayButtonDisabled}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ₹{amount} {selectedPlan === 'basic' ? '/month' : selectedPlan === 'premium' ? '/6 months' : selectedPlan === 'premium pro' ? '/year' : ''}
              </Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.securePaymentText}>
            🔒 Secure Payment | 100% Safe & Secure
          </Text>
        </View>
      </ScrollView>
      
      {/* Payment Modal with WebView */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Your Payment</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {paymentHtml ? (
            <WebView
              source={{ html: paymentHtml }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={handleWebViewMessage}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                Alert.alert('Error', 'Unable to load payment page. Please try again.');
                setShowPaymentModal(false);
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#53a20e" />
                  <Text style={styles.loadingText}>Loading payment gateway...</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#53a20e" />
              <Text style={styles.loadingText}>Loading payment gateway...</Text>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 30,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentDetails: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#53a20e',
    backgroundColor: '#f0f8e9',
  },
  popularPlan: {
    borderColor: '#ffc107',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ffc107',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 8,
  },
  popularBadgeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#53a20e',
    marginVertical: 5,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  customAmountContainer: {
    marginBottom: 20,
  },
  customAmountLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  customAmountInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
  },
  minAmountText: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryAmount: {
    color: '#53a20e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#53a20e',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securePaymentText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});