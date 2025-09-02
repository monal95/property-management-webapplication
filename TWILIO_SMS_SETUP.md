# 🚀 Twilio SMS Setup Guide

## Overview
This guide will help you set up real SMS delivery for OTP verification using Twilio's SMS service.

## 📋 Prerequisites
- Node.js and npm installed
- Twilio account (free trial available)
- Valid phone number for testing

## 🔑 Step 1: Create Twilio Account

### 1.1 Sign Up
1. Go to [twilio.com](https://twilio.com)
2. Click "Sign up for free"
3. Fill in your details and verify your email

### 1.2 Get Your Credentials
1. **Login to Twilio Console**
2. **Copy Account SID** from the dashboard
3. **Copy Auth Token** (click "show" to reveal)
4. **Get a Phone Number**:
   - Go to "Phone Numbers" → "Manage" → "Active numbers"
   - Click "Get a trial number"
   - Choose a number (this will be your sender number)

## 📦 Step 2: Install Dependencies

```bash
cd server
npm install twilio
```

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Update `server/.env` file:
```env
# Existing variables
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# Add these new variables
TWILIO_ACCOUNT_SID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3.2 Example `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rentify
JWT_SECRET=your-super-secret-jwt-key
TWILIO_ACCOUNT_SID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=abc123def456ghi789
TWILIO_PHONE_NUMBER=+15551234567
```

## 🧪 Step 4: Test the Setup

### 4.1 Start Your Backend Server
```bash
cd server
npm run dev
```

### 4.2 Expected Console Output
```
✅ Twilio SMS service initialized successfully
Server running on port 5000
Connected to MongoDB
```

### 4.3 Test Signup
1. **Go to your frontend** and try to sign up
2. **Use a real phone number** (your own for testing)
3. **Check backend console** for success message
4. **Check your phone** for the actual SMS

## 📱 Step 5: SMS Format

### 5.1 OTP Message Format
```
Your Rentify verification code is: 123456. Valid for 10 minutes.
```

### 5.2 What You'll Receive
- **From**: Your Twilio phone number
- **To**: The phone number you entered during signup
- **Message**: 6-digit OTP with expiration time

## 🔍 Troubleshooting

### Issue 1: "Twilio credentials not found"
**Solution**: Check your `.env` file and ensure all three variables are set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### Issue 2: "SMS sending failed"
**Possible Causes**:
- Invalid phone number format
- Twilio account suspended
- Insufficient credits
- Phone number not verified (trial accounts)

**Solutions**:
1. **Verify phone number format**: Use international format (+1234567890)
2. **Check Twilio Console** for account status
3. **Verify your phone number** in Twilio Console
4. **Check Twilio logs** for detailed error messages

### Issue 3: "Phone number not verified"
**Solution**: 
1. Go to Twilio Console → "Phone Numbers" → "Manage"
2. Click on your trial number
3. Add the recipient phone number to "Verified Caller IDs"

## 💰 Cost Information

### Free Trial
- **Free credits**: $15-20 worth of SMS
- **SMS cost**: ~$0.0075 per SMS (US numbers)
- **Trial limitations**: Can only send to verified numbers

### Paid Account
- **SMS cost**: Varies by country
- **US numbers**: ~$0.0075 per SMS
- **International**: $0.01 - $0.10 per SMS

## 🚨 Important Notes

### Trial Account Limitations
1. **Verified numbers only**: Can only send to numbers you verify
2. **Limited credits**: $15-20 free credits
3. **Phone number restrictions**: Some countries may not be supported

### Production Considerations
1. **Verify your business**: Required for production use
2. **Compliance**: Ensure you follow SMS regulations
3. **Rate limiting**: Implement to prevent abuse
4. **Error handling**: Plan for SMS delivery failures

## 🔄 Alternative SMS Services

### Option 1: AWS SNS
- **Pros**: Reliable, scalable, good pricing
- **Cons**: More complex setup, requires AWS account

### Option 2: MessageBird
- **Pros**: Good international coverage, simple API
- **Cons**: Slightly higher pricing

### Option 3: Vonage (formerly Nexmo)
- **Pros**: Excellent international coverage
- **Cons**: Higher pricing, complex setup

## 📞 Support

### Twilio Support
- **Documentation**: [twilio.com/docs](https://twilio.com/docs)
- **Support**: Available in Twilio Console
- **Community**: [Stack Overflow](https://stackoverflow.com/questions/tagged/twilio)

### Testing Tips
1. **Start with your own phone number**
2. **Use international format** (+1234567890)
3. **Check Twilio Console logs** for detailed information
4. **Monitor your Twilio balance** to avoid running out of credits

## ✅ Success Indicators

When everything is working correctly, you should see:
1. ✅ "Twilio SMS service initialized successfully" in console
2. ✅ "SMS sent successfully via Twilio. SID: [some-id]" when sending
3. 📱 Actual SMS received on your phone
4. 🔐 OTP verification working in your app

## 🎯 Next Steps

After successful setup:
1. **Test with multiple phone numbers**
2. **Implement rate limiting** for OTP requests
3. **Add SMS delivery status tracking**
4. **Consider implementing backup SMS service**
5. **Monitor SMS delivery rates and costs**
