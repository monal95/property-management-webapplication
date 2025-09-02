const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');

const router = express.Router();

// Initialize Razorpay only if keys are available
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.log('⚠️  Razorpay keys not found. Payment processing will be disabled.');
  }
} catch (error) {
  console.log('⚠️  Razorpay package not installed. Payment processing will be disabled.');
}

// Get all payments for owner (dashboard view)
router.get('/owner', auth, authorize('owner'), async (req, res) => {
  try {
    const payments = await Payment.find({ owner: req.user._id })
      .populate('tenant', 'name email phone')
      .populate('property', 'title address')
      .sort({ leaseMonth: -1 });

    // Calculate summary statistics
    const summary = {
      totalPayments: payments.length,
      paidPayments: payments.filter(p => p.status === 'paid').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      overduePayments: payments.filter(p => p.status === 'overdue').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCollected: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalPending: payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalLateFees: payments.reduce((sum, p) => sum + (p.lateFees || 0), 0)
    };

    // Group payments by tenant for better overview
    const tenantPayments = {};
    payments.forEach(payment => {
      const tenantId = payment.tenant._id.toString();
      if (!tenantPayments[tenantId]) {
        tenantPayments[tenantId] = {
          tenant: payment.tenant,
          property: payment.property,
          payments: [],
          totalRent: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          lateFees: 0
        };
      }

      tenantPayments[tenantId].payments.push(payment);
      tenantPayments[tenantId].totalRent += payment.amount;

      if (payment.status === 'paid') {
        tenantPayments[tenantId].totalPaid += payment.amount;
      } else {
        tenantPayments[tenantId].totalPending += payment.amount;
        if (payment.status === 'overdue') {
          tenantPayments[tenantId].totalOverdue += payment.amount;
        }
      }

      tenantPayments[tenantId].lateFees += payment.lateFees || 0;
    });

    res.json({
      summary,
      tenantPayments: Object.values(tenantPayments),
      allPayments: payments
    });
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// Get payments for specific tenant
router.get('/tenant', auth, async (req, res) => {
  try {
    // Find tenant by user email or phone
    const tenant = await Tenant.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant record not found' });
    }

    const payments = await Payment.find({ tenant: tenant._id })
      .populate('property', 'title address')
      .sort({ leaseMonth: -1 });

    // Calculate summary for tenant
    const summary = {
      totalPayments: payments.length,
      paidPayments: payments.filter(p => p.status === 'paid').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      overduePayments: payments.filter(p => p.status === 'overdue').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalPending: payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalLateFees: payments.reduce((sum, p) => sum + (p.lateFees || 0), 0)
    };

    // Calculate overdue amounts for 2+ months
    const overdueMonths = payments.filter(p => p.status !== 'paid' && p.daysOverdue > 60);
    const overdueAmount = overdueMonths.reduce((sum, p) => sum + p.amount + (p.lateFees || 0), 0);

    res.json({
      summary,
      payments,
      overdueAmount,
      overdueMonths: overdueMonths.length
    });
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// Create Razorpay order for payment
router.post('/create-order', auth, [
  body('paymentIds').isArray().withMessage('Payment IDs must be an array'),
  body('paymentIds.*').isMongoId().withMessage('Invalid payment ID')
], async (req, res) => {
  try {
    // Check if Razorpay is available
    if (!razorpay) {
      return res.status(503).json({
        message: 'Payment processing is currently unavailable. Please contact support or try again later.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find tenant by user email or phone
    const tenant = await Tenant.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant record not found' });
    }

    // Get the payments to be paid
    const payments = await Payment.find({
      _id: { $in: req.body.paymentIds },
      tenant: tenant._id,
      status: { $ne: 'paid' }
    }).populate('property', 'title');

    if (payments.length === 0) {
      return res.status(400).json({ message: 'No valid payments found' });
    }

    // Calculate total amount including late fees
    let totalAmount = 0;
    payments.forEach(payment => {
      payment.calculateLateFees();
      totalAmount += payment.totalAmount;
    });

    // Create Razorpay order
    const orderOptions = {
      amount: totalAmount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `rent_${Date.now()}`,
      notes: {
        tenantId: tenant._id.toString(),
        propertyId: payments[0].property._id.toString(),
        paymentCount: payments.length.toString()
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Update payments with order ID
    await Payment.updateMany(
      { _id: { $in: req.body.paymentIds } },
      { razorpayOrderId: order.id }
    );

    res.json({
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      payments: payments.map(p => ({
        id: p._id,
        month: p.formattedLeaseMonth,
        amount: p.amount,
        lateFees: p.lateFees,
        totalAmount: p.totalAmount
      }))
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Server error while creating payment order' });
  }
});

// Verify Razorpay payment and mark payments as paid
router.post('/verify-payment', auth, [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find payments with this order ID
    const payments = await Payment.find({ razorpayOrderId: razorpay_order_id });

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found for this order' });
    }

    // Mark all payments as paid
    for (const payment of payments) {
      await payment.markAsPaid(razorpay_payment_id, razorpay_signature);
    }

    res.json({
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      paymentsCount: payments.length
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error while verifying payment' });
  }
});

// Generate monthly payments for a new tenant lease
router.post('/generate-lease-payments', auth, authorize('owner'), [
  body('tenantId').isMongoId().withMessage('Valid tenant ID is required'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('leaseStartDate').isISO8601().withMessage('Valid lease start date is required'),
  body('leaseEndDate').isISO8601().withMessage('Valid lease end date is required'),
  body('monthlyRent').isNumeric().withMessage('Valid monthly rent is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tenantId, propertyId, leaseStartDate, leaseEndDate, monthlyRent } = req.body;

    // Verify property ownership
    const property = await Property.findById(propertyId);
    if (!property || property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Property not found or not owned by you.' });
    }

    // Check if payments already exist for this tenant-property combination
    const existingPayments = await Payment.findOne({ tenant: tenantId, property: propertyId });
    if (existingPayments) {
      return res.status(400).json({ message: 'Payments already exist for this tenant-property combination' });
    }

    // Generate monthly payments
    const payments = await Payment.generateMonthlyPayments(
      tenantId,
      propertyId,
      req.user._id,
      leaseStartDate,
      leaseEndDate,
      monthlyRent
    );

    res.json({
      message: 'Monthly payments generated successfully',
      paymentsCount: payments.length,
      payments: payments
    });
  } catch (error) {
    console.error('Error generating lease payments:', error);
    res.status(500).json({ message: 'Server error while generating lease payments' });
  }
});

// Mark payment as paid manually (for cash/bank transfers)
router.patch('/:id/mark-paid', auth, authorize('owner'), [
  body('paymentMethod').isIn(['cash', 'bank_transfer']).withMessage('Valid payment method is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify ownership
    if (payment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Not your payment.' });
    }

    payment.status = 'paid';
    payment.paymentDate = new Date();
    payment.paymentMethod = req.body.paymentMethod;
    payment.notes = req.body.notes || '';
    payment.lateFees = 0;
    payment.totalAmount = payment.amount;

    await payment.save();

    res.json({
      message: 'Payment marked as paid successfully',
      payment
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ message: 'Server error while updating payment' });
  }
});

// Get payment details by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenant', 'name email phone')
      .populate('property', 'title address')
      .populate('owner', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check access permissions
    const tenant = await Tenant.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });

    const hasAccess = (req.user.role === 'owner' && payment.owner.toString() === req.user._id.toString()) ||
      (tenant && payment.tenant.toString() === tenant._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this payment' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error while fetching payment details' });
  }
});

module.exports = router;