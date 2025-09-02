const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendSMS } = require('../config/sms');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
        expiresIn: '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email')
        .matches(/^[A-Za-z]+\d+@gmail\.com$/)
        .withMessage('Email must be letters followed by numbers and @gmail.com'),
    body('password')
        .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/)
        .withMessage('Password needs 1 uppercase, 1 number, 1 special char, 6+ chars'),
    body('role').isIn(['owner', 'tenant']).withMessage('Role must be either owner or tenant'),
    body('phone').isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, password, role, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                message: 'User with this phone number already exists'
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new user
        const user = new User({
            name: `${firstName} ${lastName}`.trim(),
            email,
            password,
            role,
            phone,
            address,
            phoneOTP: otp,
            phoneOTPExpiry: otpExpiry
        });

        await user.save();

        // Send OTP via SMS
        try {
            await sendSMS(phone, `Your Rentify verification code is: ${otp}. Valid for 10 minutes.`);
        } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue with registration even if SMS fails
        }

        res.status(201).json({
            message: 'User registered successfully. Please verify your phone number with OTP.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                phoneVerified: user.phoneVerified
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Server error during registration'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    body('identifier')
        .notEmpty()
        .withMessage('Please provide email or phone number'),
    body('password')
        .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/)
        .withMessage('Password needs 1 uppercase, 1 number, 1 special char, 6+ chars')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { identifier, password } = req.body;

        // Check if identifier is email or phone
        const isEmail = identifier.includes('@');
        let user;

        if (isEmail) {
            // Login with email
            if (!/^[A-Za-z]+\d+@gmail\.com$/.test(identifier)) {
                return res.status(400).json({
                    message: 'Email must be letters followed by numbers and @gmail.com'
                });
            }
            user = await User.findOne({ email: identifier }).select('+password');
        } else {
            // Login with phone number
            user = await User.findOne({ phone: identifier }).select('+password');
        }

        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({
                message: 'Account is deactivated'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        // Check if phone is verified
        if (!user.phoneVerified) {
            return res.status(400).json({
                message: 'Please verify your phone number before logging in. Check your phone for OTP.',
                phoneVerified: false
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage,
                phoneVerified: user.phoneVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server error during login'
        });
    }
});

// @route   POST /api/auth/verify-phone
// @desc    Verify phone number with OTP
// @access  Public
router.post('/verify-phone', [
    body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { phone, otp } = req.body;

        // Find user by phone
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({
                message: 'User with this phone number not found'
            });
        }

        // Check if OTP matches
        if (user.phoneOTP !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (user.phoneOTPExpiry < new Date()) {
            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Mark phone as verified
        user.phoneVerified = true;
        user.phoneOTP = null;
        user.phoneOTPExpiry = null;
        await user.save();

        res.json({
            message: 'Phone number verified successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                phoneVerified: user.phoneVerified
            }
        });

    } catch (error) {
        console.error('Phone verification error:', error);
        res.status(500).json({
            message: 'Server error during phone verification'
        });
    }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for phone verification
// @access  Public
router.post('/resend-otp', [
    body('phone').isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { phone } = req.body;

        // Find user by phone
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({
                message: 'User with this phone number not found'
            });
        }

        // Check if phone is already verified
        if (user.phoneVerified) {
            return res.status(400).json({
                message: 'Phone number is already verified'
            });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        user.phoneOTP = otp;
        user.phoneOTPExpiry = otpExpiry;
        await user.save();

        // Send OTP via SMS service
        try {
            await sendSMS(phone, `Your Rentify verification code is: ${otp}. Valid for 10 minutes.`);
        } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue with resending even if SMS fails
        }

        res.json({
            message: 'OTP sent successfully',
            user: {
                id: user._id,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            message: 'Server error while resending OTP'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Server error while fetching profile'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    auth,
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Your Email is incorrect',
                errors: errors.array()
            });
        }

        const { name, phone, address } = req.body;
        const updateFields = {};

        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            message: 'Server error while updating profile'
        });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
    auth,
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            message: 'Server error while changing password'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
