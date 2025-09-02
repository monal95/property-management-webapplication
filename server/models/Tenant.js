const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  familyMembers: {
    type: Number,
    required: [true, 'Number of family members is required'],
    min: [1, 'At least 1 family member is required']
  },
  occupation: {
    type: String,
    required: [true, 'Occupation is required'],
    trim: true
  },
  assignedProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property assignment is required']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  moveInDate: {
    type: Date,
    required: [true, 'Move-in date is required']
  },
  leaseStartDate: {
    type: Date,
    required: [true, 'Lease start date is required']
  },
  leaseEndDate: {
    type: Date,
    required: [true, 'Lease end date is required']
  },
  rentAmount: {
    type: Number,
    required: [true, 'Rent amount is required'],
    min: [0, 'Rent amount cannot be negative']
  },
  depositAmount: {
    type: Number,
    required: [true, 'Deposit amount is required'],
    min: [0, 'Deposit amount cannot be negative']
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner reference is required']
  },
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
tenantSchema.index({ owner: 1, status: 1 });
tenantSchema.index({ assignedProperty: 1 });
tenantSchema.index({ email: 1 });

// Virtual for lease duration
tenantSchema.virtual('leaseDuration').get(function() {
  if (this.leaseStartDate && this.leaseEndDate) {
    const diffTime = Math.abs(this.leaseEndDate - this.leaseStartDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Method to check if lease is active
tenantSchema.methods.isLeaseActive = function() {
  const now = new Date();
  return this.leaseStartDate <= now && this.leaseEndDate >= now;
};

// Method to get days until lease expires
tenantSchema.methods.daysUntilExpiry = function() {
  if (!this.isLeaseActive()) return null;
  const now = new Date();
  const diffTime = this.leaseEndDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Tenant', tenantSchema);
