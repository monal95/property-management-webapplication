const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Property owner is required']
    },
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Property description is required']
    },
    type: {
        type: String,
        enum: ['apartment', 'house', 'villa', 'commercial', 'land'],
        required: [true, 'Property type is required']
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        zipCode: {
            type: String,
            required: [true, 'ZIP code is required']
        },
        country: {
            type: String,
            required: [true, 'Country is required']
        }
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    details: {
        bedrooms: {
            type: Number,
            min: 0
        },
        bathrooms: {
            type: Number,
            min: 0
        },
        area: {
            type: Number,
            min: 0
        },
        areaUnit: {
            type: String,
            enum: ['sqft', 'sqm', 'acres'],
            default: 'sqft'
        },
        parking: {
            type: Number,
            min: 0,
            default: 0
        },
        furnished: {
            type: Boolean,
            default: false
        }
    },
    amenities: [{
        type: String,
        enum: [
            'wifi', 'ac', 'heating', 'kitchen', 'laundry', 'gym', 'pool',
            'garden', 'balcony', 'elevator', 'security', 'parking'
        ]
    }],
    images: [{
        url: String,
        caption: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    pricing: {
        rent: {
            type: Number,
            required: [true, 'Rent amount is required'],
            min: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        deposit: {
            type: Number,
            min: 0
        },
        utilities: {
            type: Number,
            min: 0
        }
    },
    availability: {
        status: {
            type: String,
            enum: ['available', 'rented', 'maintenance', 'reserved'],
            default: 'available'
        },
        availableFrom: Date,
        leaseTerm: {
            type: Number,
            min: 1
        },
        leaseTermUnit: {
            type: String,
            enum: ['months', 'years'],
            default: 'months'
        }
    },
    currentTenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    documents: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for search functionality
propertySchema.index({
    title: 'text',
    description: 'text',
    'address.city': 'text',
    'address.state': 'text'
});

// Virtual for full address
propertySchema.virtual('fullAddress').get(function () {
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

// Method to calculate total monthly cost
propertySchema.methods.getTotalMonthlyCost = function () {
    return this.pricing.rent + (this.pricing.utilities || 0);
};

module.exports = mongoose.model('Property', propertySchema);
