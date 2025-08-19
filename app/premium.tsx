import React, { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Using your computer's local IP address for physical device testing
const API_BASE_URL = 'http://172.21.154.158:3001'; // Your laptop's IP address

// Define Plan type for our subscription plans
type Plan = {
  readonly id: 'topup' | 'monthly' | 'yearly';
  readonly name: string;
  readonly amount: number;
  readonly description: string;
  readonly isTopUp: boolean;
  readonly features: string[];
};

const PremiumScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const premiumStatus = await AsyncStorage.getItem('isPremium');
      setIsPremium(premiumStatus === 'true');
    };
    checkPremiumStatus();
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    console.log('Starting payment flow for plan:', plan);
    setLoading(true);
    
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      if (!userSession) {
        Alert.alert('Error', 'Please login to continue');
        setLoading(false);
        return;
      }
      
      const userData = JSON.parse(userSession);
      
      // Call your backend to create order
      console.log('Creating order with amount:', plan.amount);
      const response = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.amount * 100, // Amount in paise
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            type: plan.isTopUp ? 'wallet_topup' : 'premium_subscription',
            planId: plan.id,
            userId: userData.id
          }
        }),
      });

      const order = await response.json();
      if (!order || !order.id) {
        console.error('Invalid order response:', order);
        throw new Error('Failed to create order: Invalid response from server');
      }
      console.log('Order created successfully:', order.id);
      
      // Create a simple HTML page that will open Razorpay in a new window
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #f5f5f5;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .container {
                text-align: center;
                padding: 20px;
              }
              .loading {
                font-size: 16px;
                color: #666;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Processing Payment</h2>
              <p>Please wait while we prepare your payment...</p>
              <p class="loading">If the payment window doesn't open, please tap below</p>
              <button id="openPayment" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 20px;
              ">Open Payment</button>
            </div>

            <script>
              // Function to open Razorpay
              function openRazorpay() {
                var options = {
                  key: 'rzp_test_ZjwOOezkHZ5DsV',
                  amount: ${plan.amount * 100},
                  currency: 'INR',
                  name: 'Krishiva Premium',
                  description: '${plan.isTopUp ? 'Add Balance to Wallet' : `Upgrade to ${plan.name}`}',
                  order_id: '${order.id}',
                  handler: function(response) {
                    console.log('Payment successful:', response);
                    try {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        status: 'success',
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id,
                        signature: response.razorpay_signature,
                        type: '${plan.isTopUp ? 'wallet_topup' : 'premium_subscription'}',
                        timestamp: new Date().toISOString()
                      }));
                    } catch (e) {
                      console.error('Error sending success message to WebView:', e);
                    }
                  },
                  modal: {
                    ondismiss: function() {
                      try {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          status: 'modal_closed',
                          timestamp: new Date().toISOString()
                        }));
                      } catch (e) {
                        console.error('Error sending modal_closed message:', e);
                      }
                    },
                    escape: false,
                    backdropclose: false
                  },
                  prefill: {
                    name: '${(userData.name || '').replace(/'/g, "\\'")}',
                    email: '${(userData.email || '').replace(/'/g, "\\'")}',
                    contact: '${(userData.phone || '').replace(/'/g, "\\'")}'
                  },
                  theme: {
                    color: '#2196F3'
                  },
                  modal: {
                    ondismiss: function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        status: 'modal_closed'
                      }));
                    }
                  },
                  // Force direct payment without demo pages
                  "notes": {
                    "custom": "direct_payment"
                  }
                };
                
                var rzp = new Razorpay(options);
                rzp.open();
                
                rzp.on('payment.failed', function(response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'error',
                    error: response.error.description || 'Payment failed'
                  }));
                });
              }

              // Try to open Razorpay automatically when page loads
              document.addEventListener('DOMContentLoaded', function() {
                try {
                  openRazorpay();
                } catch (e) {
                  console.error('Error opening Razorpay:', e);
                  document.querySelector('.loading').textContent = 'Error initializing payment. Please tap the button below to try again.';
                }
              });

              // Add click handler for manual open button
              document.getElementById('openPayment').addEventListener('click', openRazorpay);
            </script>
          </body>
        </html>
      `;
      
      // Set the HTML and show the WebView
      setPaymentHtml(html);
      setShowPaymentWebView(true);
      
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans: Plan[] = [
    { 
      id: 'topup', 
      name: 'Top Up', 
      amount: 50, 
      description: 'Add balance to your wallet',
      isTopUp: true,
      features: [
        'Add ₹50 to your wallet',
        'Use for premium features',
        'No expiration'
      ]
    },
    { 
      id: 'monthly', 
      name: 'Monthly', 
      amount: 299, 
      description: 'Billed monthly',
      isTopUp: false,
      features: [
        'Unlimited access to all features',
        'Ad-free experience',
        'Priority support',
        'Cancel anytime'
      ]
    },
    { 
      id: 'yearly', 
      name: 'Yearly', 
      amount: 2499, 
      description: 'Billed annually (2 months free!)',
      isTopUp: false,
      features: [
        'All monthly features',
        'Save 30% compared to monthly',
        'Priority support',
        'Cancel anytime'
      ]
    }
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    contentContainer: {
      padding: 20,
    },
    closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 20,
      color: '#333',
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: '#666',
      marginBottom: 30,
    },
    plansContainer: {
      paddingBottom: 30,
    },
    planCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    topUpCard: {
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    planName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    planPrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#2196F3',
    },
    planDescription: {
      color: '#666',
      marginBottom: 15,
      fontSize: 14,
    },
    featureList: {
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureText: {
      marginLeft: 8,
      color: '#444',
      fontSize: 14,
    },
    button: {
      backgroundColor: '#2196F3',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    buttonDisabled: {
      backgroundColor: '#BBDEFB',
    },
    successModal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 20,
    },
    successCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 30,
      alignItems: 'center',
      width: '90%',
      maxWidth: 400,
    },
    successIcon: {
      backgroundColor: '#4CAF50',
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
      textAlign: 'center',
    },
    successText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 20,
    },
    successButton: {
      backgroundColor: '#2196F3',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
    },
    successButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModal}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="white" />
            </View>
            <Text style={styles.successTitle}>Congratulations!</Text>
            <Text style={styles.successText}>
              You are now a premium member. Enjoy all the premium features!
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                if (isPremium) {
                  router.replace('/profile');
                }
              }}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!showPaymentWebView ? (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>Get access to all premium features</Text>
          
          <View style={styles.plansContainer}>
            {plans.map((planItem: Plan) => (
              <View 
                key={planItem.id} 
                style={[
                  styles.planCard,
                  planItem.isTopUp && styles.topUpCard
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{planItem.name}</Text>
                  <Text style={styles.planPrice}>₹{planItem.amount}</Text>
                </View>
                
                <Text style={styles.planDescription}>{planItem.description}</Text>
                
                <View style={styles.featureList}>
                  {planItem.features.map((feature: string, featureIndex: number) => (
                    <View key={featureIndex} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled
                  ]}
                  onPress={() => handleUpgrade(planItem)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {planItem.isTopUp ? 'Add Balance' : 'Upgrade Now'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, position: 'relative' }}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowPaymentWebView(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <WebView
            ref={webViewRef}
            source={{ html: paymentHtml }}
            style={{ flex: 1, marginTop: 80 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            onLoadStart={() => console.log('WebView loading started')}
            onLoadEnd={() => console.log('WebView loading finished')}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Alert.alert('Error', 'Failed to load payment page. Please check your internet connection and try again.');
            }}
            onMessage={async (event) => {
              console.log('Received message from WebView:', event.nativeEvent.data);
              try {
                const data = JSON.parse(event.nativeEvent.data);
                console.log('Parsed message:', data);
                
                if (data.status === 'success') {
                  // Close the WebView first
                  setShowPaymentWebView(false);
                  
                  if (data.type === 'premium_subscription') {
                    try {
                      // Save premium status to AsyncStorage
                      await AsyncStorage.setItem('isPremium', 'true');
                      
                      // Also update user session with premium status
                      const userSession = await AsyncStorage.getItem('userSession');
                      if (userSession) {
                        const user = JSON.parse(userSession);
                        user.isPremium = true;
                        await AsyncStorage.setItem('userSession', JSON.stringify(user));
                      }
                      
                      setIsPremium(true);
                      
                      // Show success modal briefly
                      setShowSuccessModal(true);
                      
                      // Force refresh the profile page to show the premium badge
                      setTimeout(() => {
                        setShowSuccessModal(false);
                        // Force reload the profile page to show the premium badge
                        router.replace('/profile');
                      }, 2000);
                    } catch (error) {
                      console.error('Error updating premium status:', error);
                      // Still proceed even if there's an error updating the session
                      setShowSuccessModal(true);
                      setTimeout(() => {
                        setShowSuccessModal(false);
                        router.replace('/profile');
                      }, 2000);
                    }
                  } else {
                    // For wallet top-up
                    setShowSuccessModal(true);
                  }
                } else if (data.status === 'error') {
                  Alert.alert('Error', data.error || 'Payment failed');
                  setShowPaymentWebView(false);
                } else if (data.status === 'modal_closed') {
                  console.log('Payment modal was closed by user');
                  setShowPaymentWebView(false);
                }
              } catch (e) {
                console.error('Error processing payment response:', e);
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

export default PremiumScreen;