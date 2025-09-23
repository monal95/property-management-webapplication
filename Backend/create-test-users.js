const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lprt_db';

const createTestUsers = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing test users
        await User.deleteMany({ 
            email: { $in: ['testowner@gmail.com', 'testtenant@gmail.com'] }
        });

        // Create test owner
        const testOwner = new User({
            name: 'Test Property Owner',
            email: 'testowner@gmail.com',
            password: 'Test@123',
            role: 'owner',
            phone: '+1234567890',
            phoneVerified: true, // Skip OTP for testing
            isActive: true,
            address: {
                street: '123 Owner Street',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'Test Country'
            }
        });

        // Create test tenant
        const testTenant = new User({
            name: 'Test Tenant',
            email: 'testtenant@gmail.com',
            password: 'Test@123',
            role: 'tenant',
            phone: '+1234567891',
            phoneVerified: true, // Skip OTP for testing
            isActive: true,
            address: {
                street: '456 Tenant Avenue',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'Test Country'
            }
        });

        await testOwner.save();
        await testTenant.save();

        console.log('✅ Test users created successfully!');
        console.log('');
        console.log('🏠 Test Property Owner:');
        console.log('   Email: testowner@gmail.com');
        console.log('   Password: Test@123');
        console.log('');
        console.log('🏠 Test Tenant:');
        console.log('   Email: testtenant@gmail.com');
        console.log('   Password: Test@123');
        console.log('');
        console.log('Use these credentials to login to your application');

    } catch (error) {
        console.error('Error creating test users:', error);
    } finally {
        mongoose.connection.close();
    }
};

createTestUsers();