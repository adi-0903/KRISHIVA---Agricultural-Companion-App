const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
require('dotenv').config();

// Configure CORS - allow all origins in development
const corsOptions = {
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('Razorpay Backend Server is running!');
});

// Create Order Endpoint
app.post('/create-order', async (req, res) => {
  console.log('Received create-order request:', req.body);
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    if (!amount) {
      throw new Error('Amount is required');
    }
    
    const orderOptions = {
      amount: amount, // amount in smallest currency unit (paise for INR)
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: notes || {}
    };
    
    console.log('Creating Razorpay order with options:', orderOptions);
    
    const order = await razorpay.orders.create(orderOptions);
    console.log('Order created successfully:', order.id);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Verify Payment Endpoint
app.post('/verify-payment', async (req, res) => {
  try {
    const { orderId } = req.body;
    const payments = await razorpay.orders.fetchPayments(orderId);
    
    if (payments.items.length > 0) {
      const payment = payments.items[0];
      return res.json({ 
        success: payment.status === 'captured',
        orderId,
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: payment.status
      });
    }
    
    res.json({ success: false, error: 'No payments found for this order' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`- POST http://localhost:${PORT}/create-order`);
  console.log(`- POST http://localhost:${PORT}/verify-payment`);
});
