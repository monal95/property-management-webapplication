const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

const router = express.Router();

const ensureRazorpayConfigured = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env');
  }
};

const getRazorpayInstance = () => {
  ensureRazorpayConfigured();
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/razorpay/create-order
// Create an order for rent payment (no auth for easier integration; secure in production)
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: req.body.amount * 100, // paise
      currency:"INR",
      receipt: receipt || `rent_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    return res.status(500).json({ message: 'Failed to create Razorpay order' });
  }
});

// POST /api/razorpay/webhook
// Razorpay webhook to verify payment events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(400).json({ message: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const body = req.body; // raw body buffer due to express.raw

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // At this point, the event is verified. In a real app, persist the event and update payment status.
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;


