const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Maintenance = require('../models/Maintenance');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');

const router = express.Router();

// Get all maintenance requests for owner
router.get('/owner', auth, authorize('owner'), async (req, res) => {
    try {
        const maintenanceRequests = await Maintenance.find({ owner: req.user._id })
            .populate('tenant', 'name email phone')
            .populate('property', 'title address')
            .sort({ createdAt: -1 });

        res.json(maintenanceRequests);
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        res.status(500).json({ message: 'Server error while fetching maintenance requests' });
    }
});

// Get maintenance requests for tenant
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

        const maintenanceRequests = await Maintenance.find({ tenant: tenant._id })
            .populate('property', 'title address')
            .sort({ createdAt: -1 });

        res.json(maintenanceRequests);
    } catch (error) {
        console.error('Error fetching tenant maintenance requests:', error);
        res.status(500).json({ message: 'Server error while fetching maintenance requests' });
    }
});

// Create new maintenance request (tenant complaint)
router.post('/', auth, [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority level'),
    body('category').isIn(['plumbing', 'electrical', 'hvac', 'structural', 'appliance', 'other']).withMessage('Invalid category')
], async (req, res) => {
    try {
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

        if (!tenant.assignedProperty) {
            return res.status(400).json({ message: 'No property assigned to tenant' });
        }

        // Get property details to find owner
        const property = await Property.findById(tenant.assignedProperty);
        if (!property) {
            return res.status(404).json({ message: 'Assigned property not found' });
        }

        const maintenanceRequest = new Maintenance({
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'medium',
            category: req.body.category || 'other',
            tenant: tenant._id,
            property: tenant.assignedProperty,
            owner: property.owner,
            notes: [{
                message: req.body.description,
                author: 'tenant'
            }]
        });

        await maintenanceRequest.save();

        // Populate references for response
        await maintenanceRequest.populate('tenant', 'name email phone');
        await maintenanceRequest.populate('property', 'title address');

        res.status(201).json({
            message: 'Maintenance request created successfully',
            maintenanceRequest
        });
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        res.status(500).json({ message: 'Server error while creating maintenance request' });
    }
});

// Update maintenance request status (owner only)
router.patch('/:id/status', auth, authorize('owner'), [
    body('status').isIn(['open', 'in_progress', 'resolved']).withMessage('Invalid status'),
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

        const maintenanceRequest = await Maintenance.findById(req.params.id);
        if (!maintenanceRequest) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }

        // Check if owner owns this maintenance request
        if (maintenanceRequest.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Not your maintenance request.' });
        }

        maintenanceRequest.status = req.body.status;

        // Add note if provided
        if (req.body.notes) {
            maintenanceRequest.notes.push({
                message: req.body.notes,
                author: 'owner'
            });
        }

        // Set completed date if resolved
        if (req.body.status === 'resolved') {
            maintenanceRequest.completedDate = new Date();
        }

        await maintenanceRequest.save();

        // Populate references for response
        await maintenanceRequest.populate('tenant', 'name email phone');
        await maintenanceRequest.populate('property', 'title address');

        res.json({
            message: 'Maintenance request updated successfully',
            maintenanceRequest
        });
    } catch (error) {
        console.error('Error updating maintenance request:', error);
        res.status(500).json({ message: 'Server error while updating maintenance request' });
    }
});

// Add note to maintenance request
router.post('/:id/notes', auth, [
    body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
    body('author').isIn(['tenant', 'owner', 'maintenance']).withMessage('Invalid author type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const maintenanceRequest = await Maintenance.findById(req.params.id);
        if (!maintenanceRequest) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }

        // Check if user has access to this maintenance request
        const tenant = await Tenant.findOne({
            $or: [
                { email: req.user.email },
                { phone: req.user.phone }
            ]
        });

        const hasAccess = (req.user.role === 'owner' && maintenanceRequest.owner.toString() === req.user._id.toString()) ||
            (tenant && maintenanceRequest.tenant.toString() === tenant._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied to this maintenance request' });
        }

        // Add the note
        maintenanceRequest.notes.push({
            message: req.body.message,
            author: req.body.author
        });

        await maintenanceRequest.save();

        res.json({
            message: 'Note added successfully',
            maintenanceRequest
        });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ message: 'Server error while adding note' });
    }
});

// Get single maintenance request
router.get('/:id', auth, async (req, res) => {
    try {
        const maintenanceRequest = await Maintenance.findById(req.params.id)
            .populate('tenant', 'name email phone')
            .populate('property', 'title address description')
            .populate('owner', 'firstName lastName email');

        if (!maintenanceRequest) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }

        // Check if user has access to this maintenance request
        const tenant = await Tenant.findOne({
            $or: [
                { email: req.user.email },
                { phone: req.user.phone }
            ]
        });

        const hasAccess = (req.user.role === 'owner' && maintenanceRequest.owner.toString() === req.user._id.toString()) ||
            (tenant && maintenanceRequest.tenant.toString() === tenant._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied to this maintenance request' });
        }

        res.json(maintenanceRequest);
    } catch (error) {
        console.error('Error fetching maintenance request:', error);
        res.status(500).json({ message: 'Server error while fetching maintenance request' });
    }
});

module.exports = router;
