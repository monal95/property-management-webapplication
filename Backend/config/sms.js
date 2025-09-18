// SMS Service Configuration
// This file contains configuration for SMS services like Twilio, AWS SNS, etc.

// For development: Console logging only (no external dependencies)
// For production: Uncomment and configure your preferred SMS service

let twilioClient = null;

// Try to initialize Twilio if available (optional)
try {
    const twilio = require('twilio');
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        console.log('✅ Twilio SMS service initialized successfully');
    } else {
        console.log('ℹ️  Twilio credentials not found. Using console logging for SMS.');
    }
} catch (error) {
    console.log('ℹ️  Twilio package not installed. Using console logging for SMS.');
    console.log('💡 To enable real SMS: npm install twilio and set environment variables');
}

const sendSMS = async (to, message) => {
    try {
        if (twilioClient) {
            // Send real SMS via Twilio
            const result = await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`✅ SMS sent successfully via Twilio. SID: ${result.sid}`);
            return result;
        } else {
            // Console logging for development
            console.log(`📱 [SMS] To: ${to}`);
            console.log(`📝 Message: ${message}`);
            console.log('ℹ️  This is console logging. In production, configure Twilio or another SMS service.');
            return { success: true, message: 'OTP logged to console for development' };
        }
    } catch (error) {
        console.error('❌ SMS sending failed:', error);

        // Fallback to console logging
        console.log(`📱 [FALLBACK SMS] To: ${to}`);
        console.log(`📝 Message: ${message}`);
        console.log('ℹ️  SMS failed, but OTP is logged above for development use');

        return { success: true, message: 'OTP logged to console (SMS service failed)' };
    }
};

// Example AWS SNS configuration (uncomment and configure when ready)
/*
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const sns = new AWS.SNS();

const sendSMSViaAWS = async (to, message) => {
    try {
        const params = {
            Message: message,
            PhoneNumber: to
        };
        
        const result = await sns.publish(params).promise();
        return result;
    } catch (error) {
        console.error('SMS sending failed:', error);
        throw error;
    }
};

module.exports = { sendSMS, sendSMSViaAWS };
*/

module.exports = { sendSMS };
