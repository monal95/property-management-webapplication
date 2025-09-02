# Razorpay Payment Integration Setup

## Overview
The Rentify application now includes Razorpay payment integration for secure online rent payments. This allows tenants to pay their rent using credit cards, debit cards, UPI, net banking, and other digital payment methods.

## Features
- ✅ **Secure Online Payments**: Razorpay handles all payment processing securely
- ✅ **Multiple Payment Methods**: Credit cards, debit cards, UPI, net banking, wallets
- ✅ **Automatic Verification**: Payment verification with signature validation
- ✅ **Late Fee Calculation**: Automatic late fee calculation for overdue payments
- ✅ **Payment History**: Complete tracking of all payment transactions

## Setup Instructions

### 1. Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete KYC verification
4. Get your API keys from the dashboard

### 2. Get API Keys
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Generate a new key pair
4. Copy your **Key ID** and **Key Secret**

### 3. Environment Variables
Add these to your `server/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Test vs Live Keys
- **Test Mode**: Use test keys for development (start with `rzp_test_`)
- **Live Mode**: Use live keys for production (start with `rzp_live_`)

## How It Works

### 1. Tenant Payment Flow
1. **Select Payments**: Tenant selects which months to pay for
2. **Create Order**: Backend creates Razorpay order with payment details
3. **Payment Gateway**: Razorpay checkout opens for payment
4. **Payment Processing**: User completes payment via preferred method
5. **Verification**: Backend verifies payment signature and marks as paid
6. **Confirmation**: Tenant receives confirmation and payment history updates

### 2. Payment Verification
- All payments are verified using Razorpay's signature verification
- Prevents payment tampering and ensures security
- Automatic status updates in the database

### 3. Late Fee Calculation
- **5% per month** for overdue payments
- Automatically calculated based on days overdue
- Included in total payment amount

## API Endpoints

### For Tenants
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify-payment` - Verify payment completion
- `GET /api/payments/tenant` - Get tenant payment history

### For Owners
- `GET /api/payments/owner` - Get all tenant payments
- `PATCH /api/payments/:id/mark-paid` - Mark manual payments as received

## Frontend Integration

### Razorpay Script
Add this to your HTML head section:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Payment Button
```javascript
const startPayment = async () => {
  // Create order on backend
  const order = await createOrder(paymentIds);
  
  // Initialize Razorpay
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID,
    amount: order.amount * 100,
    currency: order.currency,
    name: 'Rentify',
    description: `Rent Payment - ${order.payments.length} month(s)`,
    order_id: order.orderId,
    handler: function(response) {
      // Verify payment on backend
      verifyPayment(order.orderId, response.razorpay_payment_id, response.razorpay_signature);
    }
  };
  
  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

## Testing

### Test Cards (Test Mode Only)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI
- Use any valid UPI ID format: `test@razorpay`

## Troubleshooting

### Common Issues

#### 1. "Payment processing unavailable"
- Check if Razorpay keys are set in environment variables
- Verify keys are correct and active
- Check server logs for initialization errors

#### 2. "Invalid payment signature"
- Ensure webhook secret is correctly configured
- Check if payment verification is working properly
- Verify Razorpay integration setup

#### 3. "Order creation failed"
- Check Razorpay account status and limits
- Verify API keys have proper permissions
- Check server logs for detailed error messages

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=razorpay:*
```

## Security Features

- ✅ **Signature Verification**: All payments verified using Razorpay signatures
- ✅ **HTTPS Required**: Secure communication for all payment data
- ✅ **Token Authentication**: All API endpoints require valid JWT tokens
- ✅ **Role-based Access**: Tenants can only access their own payments
- ✅ **Input Validation**: All payment data validated and sanitized

## Cost Structure

### Razorpay Fees
- **Standard**: 2% + ₹3 per successful transaction
- **International**: 3% + ₹3 per successful transaction
- **No charges** for failed or cancelled payments

### Late Fee Structure
- **5% per month** for overdue payments
- **Accumulates monthly** until payment is made
- **Resets to 0** when payment is completed

## Support

### Razorpay Support
- **Documentation**: [Razorpay Docs](https://razorpay.com/docs/)
- **Support**: [support@razorpay.com](mailto:support@razorpay.com)
- **Phone**: +91-80-4120-9000

### Application Support
- Check server logs for detailed error messages
- Verify environment variable configuration
- Test with Razorpay test keys first

## Next Steps

1. **Set up Razorpay account** and get API keys
2. **Configure environment variables** with your keys
3. **Test payment flow** using test keys
4. **Switch to live keys** when ready for production
5. **Monitor payments** through Razorpay dashboard

The payment system is now fully integrated and ready to process real rent payments securely!