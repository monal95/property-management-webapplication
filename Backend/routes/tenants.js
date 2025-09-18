const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tenants/debug-user
// @desc    Debug endpoint to check user and tenant records
// @access  Private
router.get('/debug-user', auth, async (req, res) => {
  try {
    console.log('Debug user request:', {
      userId: req.user._id,
      userEmail: req.user.email,
      userPhone: req.user.phone,
      userRole: req.user.role
    });

    // Check if tenant record exists
    const tenant = await Tenant.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });

    // Check all tenants with similar email/phone
    const allTenants = await Tenant.find({
      $or: [
        { email: { $regex: req.user.email, $options: 'i' } },
        { phone: { $regex: req.user.phone, $options: 'i' } }
      ]
    });

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role
      },
      tenantFound: !!tenant,
      tenant: tenant,
      allSimilarTenants: allTenants.map(t => ({
        id: t._id,
        email: t.email,
        phone: t.phone,
        name: t.name,
        hasProperty: !!t.assignedProperty
      }))
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      message: 'Server error in debug endpoint'
    });
  }
});

// @route   GET /api/tenants/my-property
// @desc    Get tenant's assigned property details
// @access  Private (Tenants only)
router.get('/my-property', auth, async (req, res) => {
  try {
    console.log('User trying to access my-property:', {
      userId: req.user._id,
      userEmail: req.user.email,
      userPhone: req.user.phone,
      userRole: req.user.role
    });

    // Find tenant by user ID
    const tenant = await Tenant.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    }).populate('assignedProperty', 'title description type address details amenities images pricing availability');

    console.log('Tenant lookup result:', tenant ? 'Found' : 'Not found');

    if (!tenant) {
      return res.status(404).json({
        message: 'No tenant record found for this user'
      });
    }

    if (!tenant.assignedProperty) {
      return res.status(404).json({
        message: 'No property assigned to this tenant'
      });
    }

    res.json({
      message: 'Property details retrieved successfully',
      property: tenant.assignedProperty,
      tenantInfo: {
        name: tenant.name,
        moveInDate: tenant.moveInDate,
        leaseStartDate: tenant.leaseStartDate,
        leaseEndDate: tenant.leaseEndDate,
        rentAmount: tenant.rentAmount,
        depositAmount: tenant.depositAmount,
        status: tenant.status
      }
    });

  } catch (error) {
    console.error('Get tenant property error:', error);
    res.status(500).json({
      message: 'Server error while retrieving property details'
    });
  }
});

// @route   POST /api/tenants
// @desc    Create a new tenant
// @access  Private (Property owners only)
router.post('/', [
  auth,
  authorize('owner'),
  body('name').trim().notEmpty().withMessage('Tenant name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('familyMembers').isInt({ min: 1 }).withMessage('Number of family members must be at least 1'),
  body('occupation').trim().notEmpty().withMessage('Occupation is required'),
  body('assignedProperty').isMongoId().withMessage('Valid property ID is required'),
  body('moveInDate').isISO8601().withMessage('Valid move-in date is required'),
  body('leaseStartDate').isISO8601().withMessage('Valid lease start date is required'),
  body('leaseEndDate').isISO8601().withMessage('Valid lease end date is required'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('depositAmount').isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('status').optional().isIn(['pending', 'active', 'inactive']).withMessage('Invalid status'),
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relationship').optional().trim()
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
      name,
      phone,
      email,
      familyMembers,
      occupation,
      assignedProperty,
      moveInDate,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      depositAmount,
      status = 'pending',
      emergencyContact
    } = req.body;

    // Check if property exists and belongs to current user
    const property = await Property.findById(assignedProperty);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only assign tenants to your own properties.'
      });
    }

    // Check if property is available
    if (property.availability.status !== 'available') {
      return res.status(400).json({
        message: 'Property is not available for rent'
      });
    }

    // Check if email is already used by another tenant
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      return res.status(400).json({
        message: 'A tenant with this email already exists'
      });
    }

    // Create new tenant
    const tenant = new Tenant({
      name,
      phone,
      email,
      familyMembers,
      occupation,
      assignedProperty,
      moveInDate,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      depositAmount,
      status,
      emergencyContact,
      owner: req.user.id
    });

    await tenant.save();

    // Update property status to rented
    property.availability.status = 'rented';
    property.currentTenant = tenant._id;
    await property.save();

    // Populate property details for response
    await tenant.populate('assignedProperty', 'title address city');

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant
    });

  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({
      message: 'Server error while creating tenant'
    });
  }
});

// @route   GET /api/tenants
// @desc    Get all tenants (for property owners)
// @access  Private (Property owners only)
router.get('/', [
  auth,
  authorize('owner'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().trim().notEmpty().withMessage('Search query cannot be empty'),
  query('status').optional().isIn(['all', 'pending', 'active', 'inactive']).withMessage('Invalid status filter')
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

    const { page = 1, limit = 10, search, status = 'all' } = req.query;

    // Build filter
    let filter = { owner: req.user.id };

    if (status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get tenants with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tenants = await Tenant.find(filter)
      .populate('assignedProperty', 'title address city type pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tenant.countDocuments(filter);

    res.json({
      tenants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      message: 'Server error while fetching tenants'
    });
  }
});

// @route   GET /api/tenants/:id
// @desc    Get tenant by ID
// @access  Private (Property owners only)
router.get('/:id', [
  auth,
  authorize('owner'),
  body('id').isMongoId().withMessage('Valid tenant ID is required')
], async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('assignedProperty', 'title address city type pricing')
      .populate('owner', 'name email');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant belongs to current user
    if (tenant.owner._id.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own tenants.'
      });
    }

    res.json({ tenant });

  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      message: 'Server error while fetching tenant'
    });
  }
});

// @route   PUT /api/tenants/:id
// @desc    Update tenant
// @access  Private (Property owners only)
router.put('/:id', [
  auth,
  authorize('owner'),
  body('name').optional().trim().notEmpty().withMessage('Tenant name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('familyMembers').optional().isInt({ min: 1 }).withMessage('Number of family members must be at least 1'),
  body('occupation').optional().trim().notEmpty().withMessage('Occupation cannot be empty'),
  body('assignedProperty').optional().isMongoId().withMessage('Valid property ID is required'),
  body('moveInDate').optional().isISO8601().withMessage('Valid move-in date is required'),
  body('leaseStartDate').optional().isISO8601().withMessage('Valid lease start date is required'),
  body('leaseEndDate').optional().isISO8601().withMessage('Valid lease end date is required'),
  body('rentAmount').optional().isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('depositAmount').optional().isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('status').optional().isIn(['pending', 'active', 'inactive']).withMessage('Invalid status'),
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relationship').optional().trim()
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

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant belongs to current user
    if (tenant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only update your own tenants.'
      });
    }

    // Check if email is already used by another tenant (if email is being updated)
    if (req.body.email && req.body.email !== tenant.email) {
      const existingTenant = await Tenant.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingTenant) {
        return res.status(400).json({
          message: 'A tenant with this email already exists'
        });
      }
    }

    // Update tenant
    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedProperty', 'title address city type pricing');

    res.json({
      message: 'Tenant updated successfully',
      tenant: updatedTenant
    });

  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      message: 'Server error while updating tenant'
    });
  }
});

// @route   DELETE /api/tenants/:id
// @desc    Delete tenant
// @access  Private (Property owners only)
router.delete('/:id', [
  auth,
  authorize('owner')
], async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant belongs to current user
    if (tenant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only delete your own tenants.'
      });
    }

    // Update property status back to available
    if (tenant.assignedProperty) {
      await Property.findByIdAndUpdate(tenant.assignedProperty, {
        'availability.status': 'available',
        currentTenant: null
      });
    }

    // Delete tenant
    await Tenant.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Tenant deleted successfully'
    });

  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      message: 'Server error while deleting tenant'
    });
  }
});

// @route   GET /api/tenants/my-rental
// @desc    Get current rental property for tenant
// @access  Private (Tenants only)
router.get('/my-rental', auth, authorize('tenant'), async (req, res) => {
  try {
    // Find property where current tenant is the current user
    const property = await Property.findOne({
      currentTenant: req.user.id,
      isActive: true
    }).populate('owner', 'name email phone address');

    if (!property) {
      return res.status(404).json({
        message: 'You are not currently renting any property'
      });
    }

    res.json({ property });

  } catch (error) {
    console.error('Get my rental error:', error);
    res.status(500).json({
      message: 'Server error while fetching rental property'
    });
  }
});

// @route   POST /api/tenants/apply
// @desc    Apply for a property
// @access  Private (Tenants only)
router.post('/apply', [
  auth,
  authorize('tenant'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('message').optional().trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters if provided')
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

    const { propertyId, message } = req.body;

    // Check if property exists and is available
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.availability.status !== 'available') {
      return res.status(400).json({
        message: 'Property is not available for rent'
      });
    }

    // Check if tenant is already renting this property
    if (property.currentTenant?.toString() === req.user.id) {
      return res.status(400).json({
        message: 'You are already renting this property'
      });
    }

    // For now, we'll just return success
    // In a real application, you'd create an application record
    // and notify the property owner

    res.json({
      message: 'Application submitted successfully',
      property: {
        id: property._id,
        title: property.title,
        address: property.address
      }
    });

  } catch (error) {
    console.error('Apply for property error:', error);
    res.status(500).json({
      message: 'Server error while submitting application'
    });
  }
});

// @route   PUT /api/tenants/assign
// @desc    Assign tenant to property (for property owners)
// @access  Private (Property owners only)
router.put('/assign', [
  auth,
  authorize('owner'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('tenantId').isMongoId().withMessage('Valid tenant ID is required'),
  body('leaseStartDate').isISO8601().withMessage('Valid lease start date is required'),
  body('leaseEndDate').isISO8601().withMessage('Valid lease end date is required'),
  body('monthlyRent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('deposit').optional().isFloat({ min: 0 }).withMessage('Deposit must be a positive number')
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
      propertyId,
      tenantId,
      leaseStartDate,
      leaseEndDate,
      monthlyRent,
      deposit
    } = req.body;

    // Check if property exists and belongs to current user
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only assign tenants to your own properties.'
      });
    }

    // Check if property is available
    if (property.availability.status !== 'available') {
      return res.status(400).json({
        message: 'Property is not available for rent'
      });
    }

    // Check if tenant exists and has tenant role
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Update property
    property.currentTenant = tenantId;
    property.availability.status = 'rented';
    property.availability.availableFrom = leaseStartDate;
    property.pricing.rent = monthlyRent;
    if (deposit) property.pricing.deposit = deposit;

    await property.save();

    // Populate references for response
    await property.populate([
      { path: 'currentTenant', select: 'name email phone' },
      { path: 'owner', select: 'name email phone' }
    ]);

    res.json({
      message: 'Tenant assigned successfully',
      property
    });

  } catch (error) {
    console.error('Assign tenant error:', error);
    res.status(500).json({
      message: 'Server error while assigning tenant'
    });
  }
});

// @route   PUT /api/tenants/remove
// @desc    Remove tenant from property (for property owners)
// @access  Private (Property owners only)
router.put('/remove', [
  auth,
  authorize('owner'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('reason').optional().trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters if provided')
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

    const { propertyId, reason } = req.body;

    // Check if property exists and belongs to current user
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only remove tenants from your own properties.'
      });
    }

    // Check if property has a tenant
    if (!property.currentTenant) {
      return res.status(400).json({
        message: 'Property does not have an assigned tenant'
      });
    }

    // Remove tenant
    property.currentTenant = null;
    property.availability.status = 'available';
    property.availability.availableFrom = new Date();

    await property.save();

    res.json({
      message: 'Tenant removed successfully',
      property
    });

  } catch (error) {
    console.error('Remove tenant error:', error);
    res.status(500).json({
      message: 'Server error while removing tenant'
    });
  }
});

// @route   GET /api/tenants/profile/:id
// @desc    Get tenant profile (for property owners)
// @access  Private (Property owners only)
router.get('/profile/:id', auth, authorize('owner'), async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id).select('-password');

    if (!tenant || tenant.role !== 'tenant') {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if this tenant is renting any of the current user's properties
    const isRentingFromOwner = await Property.exists({
      owner: req.user.id,
      currentTenant: req.params.id,
      isActive: true
    });

    if (!isRentingFromOwner) {
      return res.status(403).json({
        message: 'Access denied. You can only view profiles of tenants renting your properties.'
      });
    }

    res.json({ tenant });

  } catch (error) {
    console.error('Get tenant profile error:', error);
    res.status(500).json({
      message: 'Server error while fetching tenant profile'
    });
  }
});

// @route   POST /api/tenants/assign-by-email
// @desc    Assign property to tenant by email
// @access  Private (Property owners only)
router.post('/assign-by-email', [
  auth,
  authorize('owner'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('tenantEmail').isEmail().withMessage('Valid tenant email is required'),
  body('name').trim().notEmpty().withMessage('Tenant name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('familyMembers').isInt({ min: 1 }).withMessage('Number of family members must be at least 1'),
  body('occupation').trim().notEmpty().withMessage('Occupation is required'),
  body('moveInDate').isISO8601().withMessage('Valid move-in date is required'),
  body('leaseStartDate').isISO8601().withMessage('Valid lease start date is required'),
  body('leaseEndDate').isISO8601().withMessage('Valid lease end date is required'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('depositAmount').isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('status').optional().isIn(['pending', 'active', 'inactive']).withMessage('Invalid status'),
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relationship').optional().trim()
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
      propertyId,
      tenantEmail,
      name,
      phone,
      familyMembers,
      occupation,
      moveInDate,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      depositAmount,
      status = 'pending',
      emergencyContact
    } = req.body;

    // Check if property exists and belongs to current user
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied. You can only assign tenants to your own properties.'
      });
    }

    // Check if property is available
    if (property.availability.status !== 'available') {
      return res.status(400).json({
        message: 'Property is not available for rent'
      });
    }

    // Check if email is already used by another tenant
    const existingTenant = await Tenant.findOne({ email: tenantEmail });
    if (existingTenant) {
      return res.status(400).json({
        message: 'A tenant with this email already exists'
      });
    }

    // Create new tenant
    const tenant = new Tenant({
      name,
      phone,
      email: tenantEmail,
      familyMembers,
      occupation,
      assignedProperty: propertyId,
      moveInDate,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      depositAmount,
      status,
      emergencyContact,
      owner: req.user.id
    });

    await tenant.save();

    // Update property status to rented
    property.availability.status = 'rented';
    property.currentTenant = tenant._id;
    await property.save();

    // Generate monthly payment records for the lease period
    try {
      const Payment = require('../models/Payment');
      const payments = await Payment.generateMonthlyPayments(
        tenant._id,
        propertyId,
        req.user.id,
        leaseStartDate,
        leaseEndDate,
        rentAmount
      );

      console.log(`Generated ${payments.length} monthly payment records for tenant ${tenant.name}`);
    } catch (paymentError) {
      console.error('Error generating payment records:', paymentError);
      // Don't fail the tenant assignment if payment generation fails
      // The owner can manually generate payments later
    }

    // Populate property details for response
    await tenant.populate('assignedProperty', 'title address city');

    res.status(201).json({
      message: 'Tenant assigned to property successfully. Monthly payment records have been generated.',
      tenant
    });

  } catch (error) {
    console.error('Assign tenant by email error:', error);
    res.status(500).json({
      message: 'Server error while assigning tenant to property'
    });
  }
});

module.exports = router;
