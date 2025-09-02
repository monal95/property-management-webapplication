const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Property = require('../models/Property');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private (Property owners only)
router.post('/', [
    auth,
    authorize('owner'),
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('type').isIn(['apartment', 'house', 'villa', 'commercial', 'land']).withMessage('Invalid property type'),
    body('address.street').notEmpty().withMessage('Street address is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('address.state').notEmpty().withMessage('State is required'),
    body('address.zipCode').notEmpty().withMessage('ZIP code is required'),
    body('address.country').notEmpty().withMessage('Country is required'),
    body('pricing.rent').isFloat({ min: 0 }).withMessage('Rent must be a positive number'),
    body('details.bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
    body('details.bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
    body('details.area').optional().isFloat({ min: 0 }).withMessage('Area must be a positive number')
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

        const propertyData = {
            ...req.body,
            owner: req.user.id
        };

        const property = new Property(propertyData);
        await property.save();

        res.status(201).json({
            message: 'Property created successfully',
            property
        });

    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({
            message: 'Server error while creating property'
        });
    }
});

// @route   GET /api/properties
// @desc    Get all properties with filtering and pagination
// @access  Public
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('type').optional().isIn(['apartment', 'house', 'villa', 'commercial', 'land']).withMessage('Invalid property type'),
    query('minRent').optional().isFloat({ min: 0 }).withMessage('Min rent must be a positive number'),
    query('maxRent').optional().isFloat({ min: 0 }).withMessage('Max rent must be a positive number'),
    query('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
    query('status').optional().isIn(['available', 'rented', 'maintenance', 'reserved']).withMessage('Invalid status'),
    query('search').optional().trim().notEmpty().withMessage('Search query cannot be empty')
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

        const {
            page = 1,
            limit = 10,
            type,
            minRent,
            maxRent,
            city,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (type) filter.type = type;
        if (status) filter['availability.status'] = status;
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };

        if (minRent || maxRent) {
            filter['pricing.rent'] = {};
            if (minRent) filter['pricing.rent'].$gte = parseFloat(minRent);
            if (maxRent) filter['pricing.rent'].$lte = parseFloat(maxRent);
        }

        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const properties = await Property.find(filter)
            .populate('owner', 'name email phone')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-documents');

        // Get total count
        const total = await Property.countDocuments(filter);

        res.json({
            properties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({
            message: 'Server error while fetching properties'
        });
    }
});

// @route   GET /api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('owner', 'name email phone address')
            .populate('currentTenant', 'name email phone');

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        if (!property.isActive) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Increment view count
        property.views += 1;
        await property.save();

        res.json({ property });

    } catch (error) {
        console.error('Get property error:', error);
        res.status(500).json({
            message: 'Server error while fetching property'
        });
    }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Property owner only)
router.put('/:id', [
    auth,
    body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('type').optional().isIn(['apartment', 'house', 'villa', 'commercial', 'land']).withMessage('Invalid property type'),
    body('pricing.rent').optional().isFloat({ min: 0 }).withMessage('Rent must be a positive number')
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

        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Access denied. You can only update your own properties.'
            });
        }

        // Update property
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('owner', 'name email phone');

        res.json({
            message: 'Property updated successfully',
            property: updatedProperty
        });

    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({
            message: 'Server error while updating property'
        });
    }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property (soft delete)
// @access  Private (Property owner only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Access denied. You can only delete your own properties.'
            });
        }

        // Check if property has active tenant
        if (property.currentTenant) {
            return res.status(400).json({
                message: 'Cannot delete property with active tenant'
            });
        }

        // Soft delete
        property.isActive = false;
        await property.save();

        res.json({ message: 'Property deleted successfully' });

    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({
            message: 'Server error while deleting property'
        });
    }
});

// @route   GET /api/properties/owner/my-properties
// @desc    Get properties owned by current user
// @access  Private (Property owners only)
router.get('/owner/my-properties', auth, authorize('owner'), async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter = { owner: req.user.id };
        if (status) filter['availability.status'] = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const properties = await Property.find(filter)
            .populate('currentTenant', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Property.countDocuments(filter);

        res.json({
            properties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get my properties error:', error);
        res.status(500).json({
            message: 'Server error while fetching your properties'
        });
    }
});

// @route   POST /api/properties/:id/images
// @desc    Add images to property
// @access  Private (Property owner only)
router.post('/:id/images', auth, async (req, res) => {
    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message: 'Images array is required'
            });
        }

        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Access denied. You can only update your own properties.'
            });
        }

        // Add new images
        property.images.push(...images);
        await property.save();

        res.json({
            message: 'Images added successfully',
            images: property.images
        });

    } catch (error) {
        console.error('Add images error:', error);
        res.status(500).json({
            message: 'Server error while adding images'
        });
    }
});

// @route   DELETE /api/properties/:id/images/:imageId
// @desc    Remove image from property
// @access  Private (Property owner only)
router.delete('/:id/images/:imageId', auth, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Access denied. You can only update your own properties.'
            });
        }

        // Remove image
        property.images = property.images.filter(
            img => img._id.toString() !== req.params.imageId
        );

        await property.save();

        res.json({
            message: 'Image removed successfully',
            images: property.images
        });

    } catch (error) {
        console.error('Remove image error:', error);
        res.status(500).json({
            message: 'Server error while removing image'
        });
    }
});

module.exports = router;
