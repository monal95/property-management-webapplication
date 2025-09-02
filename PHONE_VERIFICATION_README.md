# Phone Verification Feature

## Overview
The Rentify application now includes phone number verification during user registration. Users must verify their phone number with an OTP (One-Time Password) before they can log in and access the application.

## New Features

### 🔐 **Flexible Login**
- **Login with Email OR Phone Number**: Users can now sign in using either their email address or phone number
- **Smart Detection**: System automatically detects whether the input is an email or phone number
- **Same Password**: Uses the same password regardless of login method

### 📱 **Simple Phone Number System**
- **Single Input Field**: Users enter their full phone number including country code
- **International Format**: Supports phone numbers from any country (e.g., +919876543210, +15551234567)
- **No Country Selection**: Simplified user experience with direct phone number input

## How It Works

### 1. Registration Flow
1. User fills out the signup form including:
   - First Name
   - Last Name
   - Email (must be letters+numbers@gmail.com format)
   - **Phone Number** (full number with country code, e.g., +919876543210)
   - Password (must include 1 uppercase, 1 number, 1 special char, min 6 chars)
   - Confirm Password
   - Role (owner/tenant)

2. Upon successful registration:
   - Account is created with the provided phone number
   - 6-digit OTP is generated and sent to the user's phone
   - User is redirected to OTP verification screen

### 2. Phone Verification
1. User enters the 6-digit OTP received via SMS
2. System validates the OTP and marks phone as verified
3. User is redirected to login page
4. Account is now fully activated

### 3. Login Options
- **Option 1**: Login with email (e.g., monal98@gmail.com)
- **Option 2**: Login with full phone number (e.g., +919876543210)
- **Password**: Same password for both methods
- **Verification Required**: Phone must be verified before login

## API Endpoints

### POST /api/auth/register
- Creates new user account with phone number
- Generates and sends OTP via SMS
- Returns user data (without token)

### POST /api/auth/verify-phone
- Verifies phone number with OTP
- Marks phone as verified
- Returns success message

### POST /api/auth/resend-otp
- Generates new OTP if previous expired
- Sends new OTP via SMS
- Useful if user didn't receive first OTP

### POST /api/auth/login
- **NEW**: Accepts either email or phone number
- **NEW**: Automatically detects input type
- Checks phone verification status
- Only allows login for verified phones
- Returns JWT token upon successful verification

## Database Changes

### User Model Updates
```javascript
{
  phone: { type: String, required: true }, // Full phone number with country code
  phoneOTP: { type: String, default: null },
  phoneOTPExpiry: { type: Date, default: null },
  phoneVerified: { type: Boolean, default: false }
}
```

## Frontend Changes

### Signup Component
- **UPDATED**: Single phone number input field
- **REMOVED**: Country code dropdown
- **ENHANCED**: Placeholder shows example format
- **UPDATED**: Form validation for phone field

### Login Component
- **NEW**: Single input field for email OR phone
- **NEW**: Placeholder text: "Email or Phone"
- **UPDATED**: Backend communication with `identifier` field
- **ENHANCED**: Error handling for both login methods

## Phone Number Format

### Supported Formats
- **International**: +919876543210 (India)
- **International**: +15551234567 (USA/Canada)
- **International**: +447911123456 (UK)
- **Any Country**: Users can enter their phone number in international format

### Validation
- Phone number must include country code (+)
- System validates phone number format
- Prevents duplicate phone numbers

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Unique Phone Numbers**: Each phone can only be used once
3. **Rate Limiting**: Ready for implementation on resend OTP
4. **Validation**: Phone number format validation
5. **Secure Storage**: OTPs are not stored in plain text after verification
6. **Flexible Authentication**: Multiple login methods with same security level

## Testing

### Development Testing
1. Start backend server
2. Register new user with full phone number (including country code)
3. Check console for OTP (logged for development)
4. Verify phone with OTP
5. Test login with both email and phone number

### Login Testing
1. **Email Login**: Use registered email address
2. **Phone Login**: Use full phone number (including country code)
3. **Verification Check**: Ensure phone is verified before login
4. **Error Handling**: Test invalid credentials for both methods

## Future Enhancements

1. **Rate Limiting**: Prevent OTP spam
2. **Voice OTP**: Alternative verification method
3. **Email OTP**: Backup verification option
4. **2FA Integration**: Use phone for two-factor authentication
5. **Phone Number Change**: Allow users to update verified numbers
6. **Phone Number Validation**: Ensure phone number format is valid
7. **International SMS**: Support for different SMS providers by region

## Troubleshooting

### Common Issues

1. **"Failed to fetch" during signup**
   - Check backend server is running
   - Verify CORS configuration
   - Check MongoDB connection

2. **OTP not received**
   - Check console logs for OTP (development)
   - Verify phone number format includes country code
   - Use resend OTP feature

3. **Phone verification fails**
   - Ensure OTP is 6 digits
   - Check OTP hasn't expired
   - Verify phone number matches registration

4. **Login issues**
   - **Email Login**: Ensure email format is correct (letters+numbers@gmail.com)
   - **Phone Login**: Use full phone number including country code
   - **Verification**: Phone must be verified before login

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your environment variables.
