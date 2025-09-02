const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Complaint = require('../models/Complaint');
const Property = require('../models/Property');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private (Tenants only)
router.post('/', [
  auth,
  authorize('tenant'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn([
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural', 
    'pest', 'noise', 'security', 'cleaning', 'other'
  ]).withMessage('Invalid complaint category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
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

    const { propertyId, title, description, category, priority = 'medium', images } = req.body;

    // Check if property exists and is active
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if tenant is currently renting this property
    if (property.currentTenant?.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only submit complaints for properties you are currently renting' 
      });
    }

    // Create complaint
    const complaint = new Complaint({
      tenant: req.user.id,
      property: propertyId,
      owner: property.owner,
      title,
      description,
      category,
      priority,
      images: images || []
    });

    await complaint.save();

    // Populate references for response
    await complaint.populate([
      { path: 'property', select: 'title address' },
      { path: 'owner', select: 'name email phone' }
    ]);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ 
      message: 'Server error while creating complaint' 
    });
  }
});

// @route   GET /api/complaints
// @desc    Get complaints with filtering and pagination
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('category').optional().isIn([
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural', 
    'pest', 'noise', 'security', 'cleaning', 'other'
  ]).withMessage('Invalid category')
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
      status,
      priority,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (req.user.role === 'tenant') {
      filter.tenant = req.user.id;
    } else if (req.user.role === 'owner') {
      filter.owner = req.user.id;
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const complaints = await Complaint.find(filter)
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching complaints' 
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone')
      .populate('assignedTo', 'name email phone');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.role === 'tenant' && complaint.tenant.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own complaints.' 
      });
    }

    if (req.user.role === 'owner' && complaint.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view complaints for your properties.' 
      });
    }

    res.json({ complaint });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching complaint' 
    });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint
// @access  Private
router.put('/:id', [
  auth,
  body('status').optional().isIn(['pending', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('assignedTo').optional().isMongoId().withMessage('Valid user ID is required for assignment'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('scheduledDate').optional().isISO8601().withMessage('Valid date is required')
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

    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.role === 'tenant' && complaint.tenant.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own complaints.' 
      });
    }

    if (req.user.role === 'owner' && complaint.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update complaints for your properties.' 
      });
    }

    // Update complaint
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'owner', select: 'name email phone' },
      { path: 'assignedTo', select: 'name email phone' }
    ]);

    res.json({
      message: 'Complaint updated successfully',
      complaint: updatedComplaint
    });

  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ 
      message: 'Server error while updating complaint' 
    });
  }
});

// @route   POST /api/complaints/:id/notes
// @desc    Add note to complaint
// @access  Private
router.post('/:id/notes', [
  auth,
  body('content').trim().isLength({ min: 1 }).withMessage('Note content is required')
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

    const { content } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.role === 'tenant' && complaint.tenant.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only add notes to your own complaints.' 
      });
    }

    if (req.user.role === 'owner' && complaint.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only add notes to complaints for your properties.' 
      });
    }

    // Add note
    await complaint.addNote(content, req.user.id);

    // Populate references for response
    await complaint.populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'owner', select: 'name email phone' },
      { path: 'assignedTo', select: 'name email phone' }
    ]);

    res.json({
      message: 'Note added successfully',
      complaint
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ 
      message: 'Server error while adding note' 
    });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status
// @access  Private (Property owners and assigned staff)
router.put('/:id/status', [
  auth,
  body('status').isIn(['pending', 'in-progress', 'resolved', 'closed']).withMessage('Valid status is required'),
  body('notes').optional().trim().isLength({ min: 1 }).withMessage('Notes must not be empty if provided')
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

    const { status, notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.role === 'tenant' && complaint.tenant.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own complaints.' 
      });
    }

    if (req.user.role === 'owner' && complaint.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update complaints for your properties.' 
      });
    }

    // Update status
    await complaint.updateStatus(status, notes);

    // Populate references for response
    await complaint.populate([
      { path: 'property', select: 'title address' },
      { path: 'tenant', select: 'name email phone' },
      { path: 'owner', select: 'name email phone' },
      { path: 'assignedTo', select: 'name email phone' }
    ]);

    res.json({
      message: 'Complaint status updated successfully',
      complaint
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      message: 'Server error while updating status' 
    });
  }
});

// @route   POST /api/complaints/:id/rating
// @desc    Rate resolved complaint
// @access  Private (Tenants only)
router.post('/:id/rating', [
  auth,
  authorize('tenant'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim().isLength({ min: 1 }).withMessage('Feedback must not be empty if provided')
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

    const { rating, feedback } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if complaint belongs to tenant
    if (complaint.tenant.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only rate your own complaints.' 
      });
    }

    // Check if complaint is resolved
    if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
      return res.status(400).json({ 
        message: 'You can only rate resolved complaints.' 
      });
    }

    // Check if already rated
    if (complaint.tenantRating.rating) {
      return res.status(400).json({ 
        message: 'You have already rated this complaint.' 
      });
    }

    // Add rating
    complaint.tenantRating = {
      rating,
      feedback,
      ratedAt: new Date()
    };

    await complaint.save();

    res.json({
      message: 'Rating submitted successfully',
      complaint
    });

  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ 
      message: 'Server error while submitting rating' 
    });
  }
});

// @route   GET /api/complaints/stats/summary
// @desc    Get complaint statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'tenant') {
      filter.tenant = req.user.id;
    } else if (req.user.role === 'owner') {
      filter.owner = req.user.id;
    }

    const stats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      priorityStats,
      categoryStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching statistics' 
    });
  }
});

module.exports = router;
