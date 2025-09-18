const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Tenant is required']
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property is required']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Property owner is required']
    },
    title: {
        type: String,
        required: [true, 'Complaint title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Complaint description is required']
    },
    category: {
        type: String,
        enum: [
            'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
            'pest', 'noise', 'security', 'cleaning', 'other'
        ],
        required: [true, 'Complaint category is required']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    images: [{
        url: String,
        caption: String
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    estimatedCost: {
        type: Number,
        min: 0
    },
    actualCost: {
        type: Number,
        min: 0
    },
    scheduledDate: Date,
    completedDate: Date,
    tenantRating: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String,
        ratedAt: Date
    },
    notes: [{
        content: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isUrgent: {
        type: Boolean,
        default: false
    },
    tags: [String]
}, {
    timestamps: true
});

// Index for better query performance
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ property: 1, tenant: 1 });

// Virtual for complaint age
complaintSchema.virtual('age').get(function () {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to update status
complaintSchema.methods.updateStatus = function (newStatus, notes = '') {
    this.status = newStatus;

    if (newStatus === 'resolved' || newStatus === 'closed') {
        this.completedDate = new Date();
    }

    if (notes) {
        this.notes.push({
            content: notes,
            author: this.assignedTo || this.owner,
            createdAt: new Date()
        });
    }

    return this.save();
};

// Method to add note
complaintSchema.methods.addNote = function (content, authorId) {
    this.notes.push({
        content,
        author: authorId,
        createdAt: new Date()
    });

    return this.save();
};

module.exports = mongoose.model('Complaint', complaintSchema);
