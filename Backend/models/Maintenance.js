const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    },
    category: {
        type: String,
        enum: ['plumbing', 'electrical', 'hvac', 'structural', 'appliance', 'other'],
        default: 'other'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: String,
        default: null
    },
    estimatedCost: {
        type: Number,
        default: 0
    },
    actualCost: {
        type: Number,
        default: 0
    },
    scheduledDate: {
        type: Date,
        default: null
    },
    completedDate: {
        type: Date,
        default: null
    },
    notes: [{
        message: String,
        author: {
            type: String,
            enum: ['tenant', 'owner', 'maintenance'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    images: [{
        url: String,
        caption: String
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
maintenanceSchema.index({ owner: 1, status: 1 });
maintenanceSchema.index({ tenant: 1, status: 1 });
maintenanceSchema.index({ property: 1 });
maintenanceSchema.index({ createdAt: -1 });

// Virtual for formatted creation date
maintenanceSchema.virtual('formattedCreatedAt').get(function() {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

// Virtual for formatted scheduled date
maintenanceSchema.virtual('formattedScheduledDate').get(function() {
    if (!this.scheduledDate) return 'Not scheduled';
    return this.scheduledDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

// Method to add a note
maintenanceSchema.methods.addNote = function(message, author) {
    this.notes.push({ message, author });
    return this.save();
};

// Method to update status
maintenanceSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    if (newStatus === 'resolved') {
        this.completedDate = new Date();
    }
    return this.save();
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);
